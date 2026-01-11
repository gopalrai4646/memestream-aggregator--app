
import React from 'react';
import { TokenData, TimePeriod } from '../types';
import { TokenRow } from './TokenRow';

interface TokenTableProps {
  tokens: TokenData[];
  loading: boolean;
  period: TimePeriod;
}

export const TokenTable: React.FC<TokenTableProps> = ({ tokens, loading, period }) => {
  if (loading && tokens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6 bg-zinc-900/10 rounded-2xl border border-zinc-800">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 bg-blue-500/20 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-zinc-200 font-bold text-lg tracking-tight">Synchronizing Markets</p>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Aggregating Global DEX Index</p>
        </div>
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="text-center py-32 text-zinc-500 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/5">
        <svg className="w-12 h-12 mx-auto mb-4 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.022.547l-2.387 2.387a2 2 0 001.414 3.414h15.828a2 2 0 001.414-3.414l-2.387-2.387zM7 10V4h3v6l-1.5-1.5L7 10zM17 10V4h-3v6l1.5-1.5 1.5 1.5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <p className="font-bold text-sm tracking-widest uppercase">No assets matching the cluster criteria.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/20 backdrop-blur-xl shadow-2xl">
      <table className="w-full text-sm text-left border-collapse">
        <thead>
          <tr className="border-b border-zinc-800/80 text-zinc-500 uppercase text-[10px] tracking-[0.2em] font-black bg-zinc-900/40">
            <th className="py-5 px-6">Asset / Protocol</th>
            <th className="py-5 px-6 text-right">Price (USD / SOL)</th>
            <th className="py-5 px-6 text-right">{period} Velocity</th>
            <th className="py-5 px-6 text-right">24h Vol</th>
            <th className="py-5 px-6 text-right">MKT Cap</th>
            <th className="py-5 px-6 text-right">Txn Density</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/20">
          {tokens.map((token) => (
            <TokenRow key={token.token_address} token={token} period={period} />
          ))}
        </tbody>
      </table>
    </div>
  );
};
