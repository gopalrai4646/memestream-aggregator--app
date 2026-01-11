
import React, { useEffect, useState, useRef } from 'react';
import { LogEntry } from '../../types';
import { tokenService } from '../../services/apiService';

export const LogTerminal: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = tokenService.subscribeToLogs((newLog) => {
      setLogs(prev => [...prev.slice(-49), newLog]);
    });
    // Fix: Wrap in void-returning arrow function to satisfy React's EffectCallback expectations
    return () => { unsubscribe(); };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'text-emerald-400';
      case 'error': return 'text-rose-400';
      case 'warning': return 'text-amber-400';
      case 'ws': return 'text-blue-400';
      default: return 'text-zinc-400';
    }
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-[100] transition-transform duration-300 ${isOpen ? 'translate-y-0' : 'translate-y-[calc(100%-40px)]'}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-10 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between px-6 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Real-time Service Logs ({logs.length})
        </div>
        <div className="flex items-center gap-2">
          {isOpen ? 'Collapse' : 'Expand Terminal'}
          <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 15l7-7 7 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </button>

      <div 
        ref={scrollRef}
        className="h-64 bg-black/95 backdrop-blur-xl border-t border-zinc-800 p-4 font-mono text-[11px] overflow-y-auto"
      >
        {logs.length === 0 && (
          <div className="text-zinc-700 italic">Waiting for service activity...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="mb-1 flex gap-4 animate-in slide-in-from-left-2 duration-300">
            <span className="text-zinc-600 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
            <span className="text-zinc-500 font-bold shrink-0 w-24">[{log.source}]</span>
            <span className={`${getColor(log.type)} leading-relaxed`}>{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
