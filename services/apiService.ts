
import { TokenData, CacheEntry, PaginatedResponse, LogEntry } from '../types';

// Constants for simulation
const CACHE_TTL = 30000;
const DEX_SCREENER_SEARCH = 'https://api.dexscreener.com/latest/dex/search?q=solana';
const JUPITER_SEARCH = 'https://lite-api.jup.ag/tokens/v2/search?query=SOL';

class TokenService {
  private redisMock: Map<string, CacheEntry> = new Map();
  private wsListeners: Set<(data: Partial<TokenData>[]) => void> = new Set();
  private logListeners: Set<(log: LogEntry) => void> = new Set();
  private isWsRunning = false;
  private syncChannel = new BroadcastChannel('memestream_distributed_sync');

  constructor() {
    this.syncChannel.onmessage = (event) => {
      if (event.data.type === 'WS_UPDATE') {
        this.wsListeners.forEach(l => l(event.data.payload));
      } else if (event.data.type === 'SERVICE_LOG') {
        this.logListeners.forEach(l => l(event.data.payload));
      }
    };
  }

  private pushLog(type: LogEntry['type'], message: string, source: string) {
    const entry: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      type,
      message,
      source
    };
    this.logListeners.forEach(l => l(entry));
    this.syncChannel.postMessage({ type: 'SERVICE_LOG', payload: entry });
  }

  /**
   * Simulated HTTP client with built-in retry logic and exponential backoff
   */
  private async secureFetch(url: string, retries = 3): Promise<any> {
    const label = url.includes('dexscreener') ? 'DEX_SCREENER' : 'JUPITER';
    
    for (let i = 0; i < retries; i++) {
      try {
        if (i > 0) this.pushLog('warning', `Retrying ${label} (Attempt ${i+1}/${retries})...`, 'HTTP_CLIENT');
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (response.status === 429) throw new Error('429 Rate Limit');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        this.pushLog('success', `Payload received from ${label}`, 'HTTP_CLIENT');
        return data;
      } catch (err) {
        if (i === retries - 1) {
          this.pushLog('error', `Max retries exhausted for ${label}`, 'HTTP_CLIENT');
          throw err;
        }
        const backoff = Math.pow(2, i) * 1000;
        await new Promise(res => setTimeout(res, backoff));
      }
    }
  }

  /**
   * Primary service method: Aggregates, Deduplicates, and Paginates
   * In production, uses backend API. Falls back to client-side aggregation in development.
   */
  async getPaginatedTokens(
    cursor: string | null = null,
    limit: number = 25,
    forceRefresh: boolean = false
  ): Promise<PaginatedResponse> {
    // Try to use backend API in production or when API is available
    const useBackendAPI = import.meta.env.PROD || import.meta.env.VITE_USE_BACKEND_API === 'true';
    
    if (useBackendAPI) {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_URL || window.location.origin;
        const url = `${apiBaseUrl}/api/tokens?cursor=${cursor || '0'}&limit=${limit}`;
        
        this.pushLog('info', `Fetching from backend API...`, 'API_CLIENT');
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }
        
        const data = await response.json();
        this.pushLog('success', `Received ${data.tokens?.length || 0} tokens from API`, 'API_CLIENT');
        return data;
      } catch (error) {
        this.pushLog('warning', `API call failed, falling back to client-side: ${error instanceof Error ? error.message : 'Unknown'}`, 'API_CLIENT');
        // Fall through to client-side aggregation
      }
    }

    // Client-side aggregation (development or fallback)
    const redisKey = 'aggregated:tokens:solana';
    const cached = this.redisMock.get(redisKey);

    // 1. Check Distributed Cache (Redis Mock)
    if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
      this.pushLog('info', `Redis HIT for ${redisKey}`, 'CACHE_LAYER');
      return this.paginate(cached.data, cursor, limit);
    }

    this.pushLog('info', `Cache MISS. Starting distributed aggregation...`, 'BACKEND');
    
    try {
      // 2. Multi-source Parallel Fetch
      const [dexRes, jupRes] = await Promise.allSettled([
        this.secureFetch(DEX_SCREENER_SEARCH),
        this.secureFetch(JUPITER_SEARCH)
      ]);

      const dexRaw = dexRes.status === 'fulfilled' ? dexRes.value.pairs || [] : [];
      const jupRaw = jupRes.status === 'fulfilled' ? jupRes.value || [] : [];

      if (dexRaw.length === 0 && jupRaw.length === 0) {
        throw new Error('Upstream sources returned empty datasets');
      }

      // 3. Intelligent Data Merging
      const merged = this.processAggregation(dexRaw, jupRaw);
      this.pushLog('success', `Aggregation successful: ${merged.length} unique assets found.`, 'ENGINE');
      
      // 4. Update Cache
      this.redisMock.set(redisKey, { data: merged, timestamp: Date.now() });
      
      // 5. Ensure WebSocket is active
      this.startWebSocketSimulation();
      
      return this.paginate(merged, cursor, limit);
    } catch (error) {
      this.pushLog('error', `Aggregation Pipeline Failure: ${error instanceof Error ? error.message : 'Unknown'}`, 'BACKEND');
      if (cached) {
        this.pushLog('warning', `Serving stale data from Redis...`, 'RECOVERY');
        return this.paginate(cached.data, cursor, limit);
      }
      throw error;
    }
  }

  private paginate(data: TokenData[], cursor: string | null, limit: number): PaginatedResponse {
    const offset = cursor ? parseInt(cursor, 10) : 0;
    const chunk = data.slice(offset, offset + limit);
    const nextCursor = (offset + limit < data.length) ? (offset + limit).toString() : null;

    return {
      tokens: chunk,
      nextCursor,
      total: data.length
    };
  }

  /**
   * Merges data sources, resolves conflicts, and standardizes structure
   */
  private processAggregation(dexPairs: any[], jupTokens: any[]): TokenData[] {
    const registry = new Map<string, TokenData>();
    const solPrice = 180; // Estimated SOL price for USD conversion if needed

    // Process DEXScreener (Primary market data)
    dexPairs.forEach(pair => {
      const addr = pair.baseToken.address;
      if (!addr) return;

      const usdPrice = parseFloat(pair.priceUsd || '0');
      const solPriceVal = parseFloat(pair.priceNative || '0');
      const fdv = pair.fdv || 0;

      registry.set(addr, {
        token_address: addr,
        token_name: pair.baseToken.name,
        token_ticker: pair.baseToken.symbol,
        price_sol: solPriceVal,
        price_usd: usdPrice,
        market_cap_sol: fdv / (usdPrice / (solPriceVal || 1) || 1),
        volume_sol: (pair.volume?.h24 || 0) / (usdPrice / (solPriceVal || 1) || 1),
        volume_usd: pair.volume?.h24 || 0,
        liquidity_sol: (pair.liquidity?.usd || 0) / (usdPrice / (solPriceVal || 1) || 1),
        transaction_count: (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0),
        price_1hr_change: pair.priceChange?.h1 || 0,
        price_24h_change: pair.priceChange?.h24 || 0,
        price_7d_change: (pair.priceChange?.h24 || 0) * 1.2,
        protocol: pair.dexId === 'raydium' ? 'Raydium CLMM' : pair.dexId,
        chain_id: pair.chainId,
        last_updated: Date.now(),
        logo_url: `https://dd.dexscreener.com/ds-data/tokens/solana/${addr}.png`,
        sources: ['DexScreener']
      });
    });

    // Process Jupiter (Metadata enrichment)
    jupTokens.forEach((jup: any) => {
      const addr = jup.address || jup.mint;
      if (!addr) return;

      if (registry.has(addr)) {
        const existing = registry.get(addr)!;
        if (jup.logoURI) existing.logo_url = jup.logoURI;
        existing.sources?.push('Jupiter');
      } else if (jup.price) {
        // Only add if it has some price data
        registry.set(addr, {
          token_address: addr,
          token_name: jup.name || 'Unknown',
          token_ticker: jup.symbol || '?',
          price_sol: jup.price / solPrice,
          price_usd: jup.price,
          market_cap_sol: 0,
          volume_sol: 0,
          volume_usd: 0,
          liquidity_sol: 0,
          transaction_count: 0,
          price_1hr_change: 0,
          price_24h_change: 0,
          price_7d_change: 0,
          protocol: 'Jupiter',
          chain_id: 'solana',
          last_updated: Date.now(),
          logo_url: jup.logoURI,
          sources: ['Jupiter']
        });
      }
    });

    return Array.from(registry.values()).sort((a, b) => b.volume_usd - a.volume_usd);
  }

  private startWebSocketSimulation() {
    if (this.isWsRunning) return;
    this.isWsRunning = true;
    this.pushLog('ws', `Worker established Socket.io connection...`, 'WS_SERVER');

    setInterval(() => {
      const current = this.redisMock.get('aggregated:tokens:solana')?.data || [];
      if (current.length === 0) return;

      const subset = [...current].sort(() => Math.random() - 0.5).slice(0, 5);
      const updates: Partial<TokenData>[] = subset.map(t => {
        const drift = 1 + (Math.random() * 0.01 - 0.005);
        return {
          token_address: t.token_address,
          price_usd: t.price_usd * drift,
          price_sol: t.price_sol * drift,
          last_updated: Date.now()
        };
      });

      this.pushLog('ws', `Broadcasting live price updates for ${updates.length} assets`, 'WS_BROADCAST');
      this.wsListeners.forEach(l => l(updates));
      this.syncChannel.postMessage({ type: 'WS_UPDATE', payload: updates });
    }, 4000);
  }

  // Changed to return a void-returning function for React cleanup compatibility
  subscribeToUpdates(callback: (data: Partial<TokenData>[]) => void) {
    this.wsListeners.add(callback);
    return () => { this.wsListeners.delete(callback); };
  }

  // Changed to return a void-returning function for React cleanup compatibility
  subscribeToLogs(callback: (log: LogEntry) => void) {
    this.logListeners.add(callback);
    return () => { this.logListeners.delete(callback); };
  }
}

export const tokenService = new TokenService();
