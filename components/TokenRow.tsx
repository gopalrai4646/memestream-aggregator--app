
import React, { useEffect, useState, useRef } from 'react';
import { TokenData, TimePeriod } from '../types';
import { Badge } from './ui/Badge';

interface TokenRowProps {
  token: TokenData;
  period: TimePeriod;
}

export const TokenRow: React.FC<TokenRowProps> = ({ token, period }) => {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const prevPrice = useRef(token.price_usd);

  useEffect(() => {
    if (token.price_usd > prevPrice.current * 1.0003) {
      setFlash('up');
      const timer = setTimeout(() => setFlash(null), 1200);
      prevPrice.current = token.price_usd;
      return () => clearTimeout(timer);
    } else if (token.price_usd < prevPrice.current * 0.9997) {
      setFlash('down');
      const timer = setTimeout(() => setFlash(null), 1200);
      prevPrice.current = token.price_usd;
      return () => clearTimeout(timer);
    }
  }, [token.price_usd]);

  const formatLargeNum = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  const change = period === '1h' ? token.price_1hr_change : (period === '7d' ? token.price_7d_change : token.price_24h_change);

  return (
    <tr className={`border-b border-zinc-800/40 group transition-all duration-700 hover:bg-zinc-800/30 ${flash === 'up' ? 'bg-emerald-500/10' : flash === 'down' ? 'bg-rose-500/10' : ''}`}>
      <td className="py-5 px-6 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden flex-shrink-0 relative shadow-inner">
          <img 
            src={token.logo_url} 
            alt={token.token_ticker} 
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${token.token_ticker}&background=09090b&color=52525b&bold=true` }}
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-zinc-100 text-base tracking-tight">{token.token_ticker}</span>
            <Badge variant="neutral" className="text-[7px] py-0 px-1 opacity-60 bg-zinc-950">{token.protocol}</Badge>
          </div>
          <div className="text-[10px] text-zinc-600 truncate max-w-[140px] font-bold uppercase tracking-widest">{token.token_name}</div>
        </div>
      </td>
      <td className="py-5 px-6 text-right mono">
        <div className={`transition-all duration-300 font-bold text-sm ${flash === 'up' ? 'text-emerald-400 scale-105' : flash === 'down' ? 'text-rose-400 scale-105' : 'text-zinc-100'}`}>
          ${token.price_usd < 0.0001 ? token.price_usd.toExponential(4) : token.price_usd.toFixed(6)}
        </div>
        <div className="text-[10px] text-zinc-500 font-bold">{token.price_sol.toFixed(7)} SOL</div>
      </td>
      <td className="py-5 px-6 text-right">
        <span className={`font-black text-sm ${change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {change > 0 ? '+' : ''}{change.toFixed(2)}%
        </span>
      </td>
      <td className="py-5 px-6 text-right mono text-zinc-300 font-bold">
        ${formatLargeNum(token.volume_usd)}
      </td>
      <td className="py-5 px-6 text-right mono text-zinc-500 font-bold">
        ${formatLargeNum(token.market_cap_sol * (token.price_usd / (token.price_sol || 1)))}
      </td>
      <td className="py-5 px-6 text-right">
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 text-xs font-black">{token.transaction_count.toLocaleString()}</span>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
          </div>
          <div className="w-20 h-1 bg-zinc-900 rounded-full mt-2 overflow-hidden border border-zinc-800">
            <div 
              className="h-full bg-zinc-700 transition-all duration-1000 shadow-[0_0_8px_rgba(255,255,255,0.1)]" 
              style={{ width: `${Math.min(100, (token.transaction_count / 15000) * 100)}%` }}
            />
          </div>
        </div>
      </td>
    </tr>
  );
};
