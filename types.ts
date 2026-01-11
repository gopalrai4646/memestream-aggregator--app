
export interface TokenData {
  token_address: string;
  token_name: string;
  token_ticker: string;
  price_sol: number;
  price_usd: number;
  market_cap_sol: number;
  volume_sol: number;
  volume_usd: number;
  liquidity_sol: number;
  transaction_count: number;
  price_1hr_change: number;
  price_24h_change: number;
  price_7d_change: number;
  protocol: string;
  chain_id: string;
  last_updated: number;
  logo_url?: string;
  // Metadata for aggregation tracking
  sources?: string[];
}

export type TimePeriod = '1h' | '24h' | '7d';
export type SortMetric = 'volume' | 'price_change' | 'market_cap' | 'liquidity';

export interface FilterConfig {
  period: TimePeriod;
  sortBy: SortMetric;
  search: string;
}

export interface CacheEntry {
  data: TokenData[];
  timestamp: number;
}

export interface PaginatedResponse {
  tokens: TokenData[];
  nextCursor: string | null;
  total: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'info' | 'success' | 'warning' | 'error' | 'ws';
  message: string;
  source: string;
}
