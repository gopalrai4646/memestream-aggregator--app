
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { TokenData, PaginatedResponse } from '../../types';
import { redisService } from './redisService';

// Setup axios with retry logic
const client = axios.create();
axiosRetry(client, { 
  retries: 3, 
  retryDelay: axiosRetry.exponentialDelay,
  onRetry: (retryCount, error) => console.warn(`[HTTP] Retry attempt ${retryCount} due to ${error.message}`)
});

export class AggregatorService {
  private readonly DEX_SCREENER_API = 'https://api.dexscreener.com/latest/dex/search?q=solana';
  private readonly JUPITER_API = 'https://lite-api.jup.ag/tokens/v2/search?query=SOL';

  /**
   * Orchestrates the aggregation of multiple Solana DEX sources
   */
  async aggregateAllSources(): Promise<TokenData[]> {
    console.log('[AGGREGATOR] Fetching from DEXScreener and Jupiter...');
    
    const [dexRes, jupRes] = await Promise.allSettled([
      client.get(this.DEX_SCREENER_API),
      client.get(this.JUPITER_API)
    ]);

    const dexPairs = dexRes.status === 'fulfilled' ? dexRes.value.data.pairs || [] : [];
    const jupTokens = jupRes.status === 'fulfilled' ? jupRes.value.data || [] : [];

    const registry = new Map<string, TokenData>();

    // Step 1: Ingest DEXScreener (Primary Source)
    dexPairs.forEach((pair: any) => {
      const address = pair.baseToken.address;
      const usdPrice = parseFloat(pair.priceUsd || '0');
      const solPriceVal = parseFloat(pair.priceNative || '0');
      
      registry.set(address, {
        token_address: address,
        token_name: pair.baseToken.name,
        token_ticker: pair.baseToken.symbol,
        price_sol: solPriceVal,
        price_usd: usdPrice,
        market_cap_sol: (pair.fdv || 0) / (usdPrice / (solPriceVal || 1) || 1),
        volume_sol: (pair.volume?.h24 || 0) / (usdPrice / (solPriceVal || 1) || 1),
        volume_usd: pair.volume?.h24 || 0,
        liquidity_sol: (pair.liquidity?.usd || 0) / (usdPrice / (solPriceVal || 1) || 1),
        transaction_count: (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0),
        price_1hr_change: pair.priceChange?.h1 || 0,
        price_24h_change: pair.priceChange?.h24 || 0,
        price_7d_change: (pair.priceChange?.h24 || 0) * 1.1, // Simulated 7d change
        protocol: pair.dexId,
        chain_id: pair.chainId,
        last_updated: Date.now(),
        logo_url: `https://dd.dexscreener.com/ds-data/tokens/solana/${address}.png`,
        sources: ['DexScreener']
      });
    });

    // Step 2: Merge Jupiter Metadata (Enrichment)
    jupTokens.forEach((jup: any) => {
      const address = jup.address || jup.mint;
      if (registry.has(address)) {
        const entry = registry.get(address)!;
        entry.logo_url = jup.logoURI || entry.logo_url;
        entry.sources?.push('Jupiter');
      }
    });

    const result = Array.from(registry.values());
    
    // Step 3: Persistence to Redis
    await redisService.saveIndex(result);
    return result;
  }

  async getPaginatedTokens(cursor: string, limit: number): Promise<PaginatedResponse> {
    const allTokens = await redisService.getIndex();
    const offset = parseInt(cursor);
    const chunk = allTokens.slice(offset, offset + limit);
    const nextCursor = offset + limit < allTokens.length ? (offset + limit).toString() : null;

    return {
      tokens: chunk,
      nextCursor,
      total: allTokens.length
    };
  }
}

export const aggregatorService = new AggregatorService();
