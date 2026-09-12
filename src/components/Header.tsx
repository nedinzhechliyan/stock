import React from 'react';
import { ShieldCheck, Activity, LineChart, Sparkles, RefreshCw } from 'lucide-react';

interface HeaderProps {
  ticker: string;
  onRefresh: () => void;
  isComputing: boolean;
}

export const Header: React.FC<HeaderProps> = ({ ticker, onRefresh, isComputing }) => {
  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-xs">
            <LineChart className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 tracking-tight font-sans">
                Time-Series Market Movement Predictor
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-slate-800/80 text-emerald-400 border border-slate-700">
                {ticker}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-2 flex-wrap">
              <span>Quantitative Directional Engine</span>
              <span className="text-slate-600">•</span>
              <span>Temporal Forward Split</span>
              <span className="text-slate-600">•</span>
              <span>Zero-Leakage Guard</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Audit: Zero Forward Leakage</span>
          </div>

          <div className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-800/60 text-slate-300 border border-slate-700/60 font-mono">
            <Activity className="w-3 h-3 text-emerald-400" />
            <span>Dual Baseline Guard</span>
          </div>

          <button
            id="btn-recompute-header"
            onClick={onRefresh}
            disabled={isComputing}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 transition cursor-pointer shadow-xs border border-emerald-500/40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isComputing ? 'animate-spin' : ''}`} />
            <span>{isComputing ? 'Executing...' : 'Run Pipeline'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
