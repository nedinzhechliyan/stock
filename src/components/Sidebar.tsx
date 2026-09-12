import React from 'react';
import { Sliders, Calendar, Cpu, Layers, Info, CheckCircle2 } from 'lucide-react';
import { PipelineConfig } from '../types/market';
import { AVAILABLE_TICKERS } from '../data/historicalData';

interface SidebarProps {
  config: PipelineConfig;
  onChangeConfig: (newConfig: PipelineConfig) => void;
  onApply: () => void;
  isComputing: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  config,
  onChangeConfig,
  onApply,
  isComputing,
}) => {
  const cOptions = [0.001, 0.01, 0.1, 1.0, 10.0];

  const handleTickerSelect = (symbol: string) => {
    onChangeConfig({ ...config, ticker: symbol });
  };

  const handleResetDefaults = () => {
    onChangeConfig({
      ticker: 'SPY',
      startDate: '2018-01-01',
      endDate: '2024-01-01',
      splitRatio: 0.8,
      rfEstimators: 150,
      rfMaxDepth: 4,
      cReg: 0.1,
    });
  };

  return (
    <aside className="w-full lg:w-80 bg-slate-900 border-r border-slate-800 p-5 space-y-6 shrink-0 shadow-xs">
      {/* Configuration Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
            Pipeline Configuration
          </h2>
        </div>
        <button
          id="btn-reset-defaults"
          onClick={handleResetDefaults}
          className="text-xs text-slate-400 hover:text-emerald-400 underline font-medium cursor-pointer transition"
        >
          Reset Defaults
        </button>
      </div>

      {/* Asset Ticker Selection */}
      <div className="space-y-2">
        <label htmlFor="input-ticker" className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">
          Asset Ticker
        </label>
        <div className="grid grid-cols-3 gap-1.5 mb-2">
          {AVAILABLE_TICKERS.map((t) => (
            <button
              key={t.symbol}
              id={`ticker-btn-${t.symbol}`}
              type="button"
              onClick={() => handleTickerSelect(t.symbol)}
              className={`px-2.5 py-1.5 text-xs font-mono font-semibold rounded-md border text-center transition cursor-pointer ${
                config.ticker.toUpperCase() === t.symbol
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                  : 'bg-slate-800/50 text-slate-300 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              {t.symbol}
            </button>
          ))}
        </div>
        <input
          id="input-ticker"
          type="text"
          value={config.ticker}
          onChange={(e) => onChangeConfig({ ...config, ticker: e.target.value.toUpperCase() })}
          placeholder="e.g. SPY, QQQ, AAPL"
          className="w-full px-3 py-1.5 text-sm font-mono uppercase bg-slate-800/50 border border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-slate-200 placeholder-slate-500 transition"
        />
        <p className="text-[11px] text-slate-400">
          SPY (S&P 500 ETF) is the canonical liquid benchmark for zero-leakage testing.
        </p>
      </div>

      {/* Temporal Window */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 uppercase tracking-wide">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Historical Horizon</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="start-date-input" className="block text-[11px] text-slate-400 font-medium mb-1">
              Start Date
            </label>
            <input
              id="start-date-input"
              type="date"
              value={config.startDate}
              onChange={(e) => onChangeConfig({ ...config, startDate: e.target.value })}
              className="w-full px-2 py-1.5 text-xs font-mono bg-slate-800/50 border border-slate-700 rounded-md text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition"
            />
          </div>
          <div>
            <label htmlFor="end-date-input" className="block text-[11px] text-slate-400 font-medium mb-1">
              End Date
            </label>
            <input
              id="end-date-input"
              type="date"
              value={config.endDate}
              onChange={(e) => onChangeConfig({ ...config, endDate: e.target.value })}
              className="w-full px-2 py-1.5 text-xs font-mono bg-slate-800/50 border border-slate-700 rounded-md text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition"
            />
          </div>
        </div>
      </div>

      {/* Train / Test Split Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300 uppercase tracking-wide">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Train Partition Split</span>
          </span>
          <span className="font-mono text-emerald-400 font-bold">
            {(config.splitRatio * 100).toFixed(0)}% / {((1 - config.splitRatio) * 100).toFixed(0)}%
          </span>
        </div>
        <div className="p-2.5 bg-slate-800/50 border border-slate-700 rounded-md">
          <input
            id="split-ratio-slider"
            type="range"
            min="0.60"
            max="0.85"
            step="0.05"
            value={config.splitRatio}
            onChange={(e) => onChangeConfig({ ...config, splitRatio: parseFloat(e.target.value) })}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-1">
            <span>60% Train</span>
            <span className="text-slate-500">80% Default</span>
            <span>85% Train</span>
          </div>
        </div>
      </div>

      {/* Model Hyperparameters */}
      <div className="pt-3 border-t border-slate-800 space-y-4">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-100">
          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          <span>Model Hyperparameters</span>
        </div>

        {/* Logistic Regression C */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-300">
            <span>Logistic Reg C (L2 Penalty)</span>
            <span className="font-mono font-bold text-emerald-400">{config.cReg}</span>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {cOptions.map((opt) => (
              <button
                key={opt}
                id={`c-reg-btn-${opt}`}
                type="button"
                onClick={() => onChangeConfig({ ...config, cReg: opt })}
                className={`py-1 text-xs font-mono font-medium rounded border text-center transition cursor-pointer ${
                  config.cReg === opt
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-800/50 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-400">
            Lower C enforces stronger shrinkage (λ = 1/C) against financial noise.
          </p>
        </div>

        {/* Random Forest Depth */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-300">
            <span>Random Forest Max Depth</span>
            <span className="font-mono font-bold text-emerald-400">{config.rfMaxDepth}</span>
          </div>
          <div className="p-2.5 bg-slate-800/50 border border-slate-700 rounded-md">
            <input
              id="rf-depth-slider"
              type="range"
              min="2"
              max="8"
              step="1"
              value={config.rfMaxDepth}
              onChange={(e) => onChangeConfig({ ...config, rfMaxDepth: parseInt(e.target.value) })}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-1">
              <span>2 (Constrained)</span>
              <span className="text-slate-500">4 (Standard)</span>
              <span>8 (Deep)</span>
            </div>
          </div>
        </div>

        {/* Random Forest Estimators */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-300">
            <span>RF Estimators (Trees)</span>
            <span className="font-mono font-bold text-emerald-400">{config.rfEstimators}</span>
          </div>
          <div className="p-2.5 bg-slate-800/50 border border-slate-700 rounded-md">
            <input
              id="rf-estimators-slider"
              type="range"
              min="50"
              max="300"
              step="25"
              value={config.rfEstimators}
              onChange={(e) => onChangeConfig({ ...config, rfEstimators: parseInt(e.target.value) })}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-1">
              <span>50</span>
              <span className="text-slate-500">150</span>
              <span>300</span>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Notice */}
      <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Temporal Split Guarantee</span>
        </div>
        <p className="leading-relaxed">
          Scalers and tree splits are learned solely on the training partition. No shuffle or future window leakage.
        </p>
      </div>

      {/* Execute Button */}
      <button
        id="btn-sidebar-execute"
        type="button"
        disabled={isComputing}
        onClick={onApply}
        className="w-full py-2.5 px-4 rounded-md text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 transition cursor-pointer shadow-xs border border-emerald-500/40 flex items-center justify-center gap-2"
      >
        <Cpu className="w-4 h-4" />
        <span>{isComputing ? 'Computing Pipeline...' : 'Execute Time-Series Pipeline'}</span>
      </button>
    </aside>
  );
};
