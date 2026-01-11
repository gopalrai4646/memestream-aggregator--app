
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { TokenData, FilterConfig, TimePeriod, SortMetric } from './types';
import { tokenService } from './services/apiService';
import { TokenTable } from './components/TokenTable';
import { Badge } from './components/ui/Badge';
import { LogTerminal } from './components/ui/LogTerminal';

const App: React.FC = () => {
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [totalTokens, setTotalTokens] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  const [filters, setFilters] = useState<FilterConfig>({
    period: '24h',
    sortBy: 'volume',
    search: ''
  });

  const fetchInitialData = useCallback(async (isRefresh = false) => {
    setLoading(true);
    try {
      const response = await tokenService.getPaginatedTokens(null, 25, isRefresh);
      setTokens(response.tokens);
      setNextCursor(response.nextCursor);
      setTotalTokens(response.total);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError('Service unavailable. Retrying connection...');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const response = await tokenService.getPaginatedTokens(nextCursor, 25);
      setTokens(prev => {
        const existingIds = new Set(prev.map(t => t.token_address));
        const newTokens = response.tokens.filter(t => !existingIds.has(t.token_address));
        return [...prev, ...newTokens];
      });
      setNextCursor(response.nextCursor);
    } catch (err) {
      console.error('Pagination fault', err);
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore]);

  useEffect(() => {
    fetchInitialData();
    const unsubscribe = tokenService.subscribeToUpdates((updates) => {
      setTokens(prev => {
        const next = [...prev];
        updates.forEach(update => {
          const idx = next.findIndex(t => t.token_address === update.token_address);
          if (idx !== -1) next[idx] = { ...next[idx], ...update };
        });
        return next;
      });
      setLastUpdate(new Date());
    });
    // Fix: Wrap in void-returning arrow function to satisfy React's EffectCallback expectations
    return () => { unsubscribe(); };
  }, [fetchInitialData]);

  const processedTokens = useMemo(() => {
    let result = [...tokens];
    if (filters.search) {
      const s = filters.search.toLowerCase();
      result = result.filter(t => 
        t.token_name.toLowerCase().includes(s) || 
        t.token_ticker.toLowerCase().includes(s)
      );
    }
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'volume': return b.volume_usd - a.volume_usd;
        case 'price_change': 
          // Fix: Corrected property name from price_1h_change to price_1hr_change
          const valA = filters.period === '1h' ? a.price_1hr_change : (filters.period === '7d' ? a.price_7d_change : a.price_24h_change);
          const valB = filters.period === '1h' ? b.price_1hr_change : (filters.period === '7d' ? b.price_7d_change : b.price_24h_change);
          return valB - valA;
        case 'market_cap': return (b.market_cap_sol * b.price_usd / (b.price_sol || 1)) - (a.market_cap_sol * a.price_usd / (a.price_sol || 1));
        case 'liquidity': return b.liquidity_sol - a.liquidity_sol;
        default: return 0;
      }
    });
    return result;
  }, [tokens, filters]);

  return (
    <div className="min-h-screen pb-32">
      <nav className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center font-black text-white italic shadow-lg shadow-blue-500/20">M</div>
            <h1 className="text-xl font-extrabold tracking-tighter">MEMESTREAM</h1>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full">
              <div className="w-2 h-2 rounded-full bg-emerald-500 live-indicator" />
              <span className="text-zinc-400 font-bold uppercase tracking-wider">Sync Active</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold text-white tracking-tight">Market Pulse</h2>
            <div className="flex items-center gap-3 text-zinc-500 text-sm font-medium">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> {totalTokens} Assets</span>
              <span className="w-1 h-1 rounded-full bg-zinc-800" />
              <span className="flex items-center gap-1 uppercase tracking-widest text-[10px]">Refresh: 30s</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800 shadow-inner">
              {(['1h', '24h', '7d'] as TimePeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setFilters(f => ({ ...f, period: p }))}
                  className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase transition-all ${
                    filters.period === p ? 'bg-zinc-800 text-blue-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Search coins..." 
                className="bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all placeholder:text-zinc-600"
                value={filters.search}
                onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
              />
              <svg className="w-4 h-4 text-zinc-600 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <select 
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none cursor-pointer text-zinc-300 font-bold"
              value={filters.sortBy}
              onChange={(e) => setFilters(f => ({ ...f, sortBy: e.target.value as SortMetric }))}
            >
              <option value="volume">Volume</option>
              <option value="price_change">Gainers</option>
              <option value="market_cap">Market Cap</option>
            </select>
            <button 
              onClick={() => fetchInitialData(true)}
              className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-500 hover:text-blue-400 transition-colors"
              title="Force Refresh Aggregator"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-center justify-between animate-pulse">
            <span className="text-sm font-bold uppercase tracking-tight">{error}</span>
          </div>
        )}

        <TokenTable tokens={processedTokens} loading={loading} period={filters.period} />
        
        {nextCursor && !loading && (
          <div className="flex flex-col items-center mt-12 gap-4">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="group relative flex items-center gap-3 px-12 py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-200 font-black text-[11px] uppercase tracking-[0.15em] transition-all disabled:opacity-50 active:scale-95 shadow-lg"
            >
              {loadingMore ? (
                <div className="w-4 h-4 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
              ) : (
                <>
                  Fetch Next Cluster
                  <svg className="w-4 h-4 text-zinc-500 transition-transform group-hover:translate-y-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </>
              )}
            </button>
            <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest bg-zinc-900/50 px-3 py-1 rounded-full border border-zinc-800">
              Indexing {tokens.length} / {totalTokens}
            </div>
          </div>
        )}
      </main>
      
      <LogTerminal />
    </div>
  );
};

export default App;
