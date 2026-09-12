import React, { useState } from 'react';
import { ProcessedBar } from '../types/market';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  BarChart,
  Bar,
} from 'recharts';
import { Activity, Layers, SlidersHorizontal, Info } from 'lucide-react';
import { FEATURE_DISPLAY_METADATA } from '../ml/indicators';

interface TechnicalInspectorProps {
  processedData: ProcessedBar[];
}

export const TechnicalInspector: React.FC<TechnicalInspectorProps> = ({ processedData }) => {
  const [indicatorView, setIndicatorView] = useState<'rsi' | 'macd' | 'bb' | 'atr'>('rsi');

  // Take recent 120 bars for smooth visualization
  const recentSlice = processedData.slice(-120);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="text-base font-bold text-slate-100">
                Technical Indicator Stationarity & Feature Inspector
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Deterministic, zero-leakage technical indicators computed purely from trailing data &le; t.
            </p>
          </div>

          {/* Selector Tabs */}
          <div className="flex flex-wrap gap-1 bg-slate-950/80 border border-slate-800 p-1 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setIndicatorView('rsi')}
              className={`px-3 py-1.5 rounded-md cursor-pointer transition ${
                indicatorView === 'rsi'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              RSI (14)
            </button>
            <button
              type="button"
              onClick={() => setIndicatorView('macd')}
              className={`px-3 py-1.5 rounded-md cursor-pointer transition ${
                indicatorView === 'macd'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              MACD Normalized
            </button>
            <button
              type="button"
              onClick={() => setIndicatorView('bb')}
              className={`px-3 py-1.5 rounded-md cursor-pointer transition ${
                indicatorView === 'bb'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Bollinger %B
            </button>
            <button
              type="button"
              onClick={() => setIndicatorView('atr')}
              className={`px-3 py-1.5 rounded-md cursor-pointer transition ${
                indicatorView === 'atr'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Normalized ATR & Vol
            </button>
          </div>
        </div>

        {/* Dynamic Chart based on selected indicator */}
        <div className="mt-4">
          {indicatorView === 'rsi' && (
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-semibold text-slate-200">
                  Relative Strength Index (RSI 14) [Bounded 0 - 100]
                </span>
                <span className="text-slate-400 font-mono">
                  Overbought: 70 | Oversold: 30 | Neutral: 50
                </span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={recentSlice} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#64748B"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => val.slice(5)}
                    />
                    <YAxis stroke="#64748B" fontSize={11} domain={[10, 90]} tickLine={false} />
                    <ReferenceLine y={70} stroke="#F43F5E" strokeDasharray="3 3" label={{ value: 'Overbought (70)', fill: '#F43F5E', fontSize: 10, position: 'insideTopRight' }} />
                    <ReferenceLine y={50} stroke="#475569" strokeDasharray="2 2" />
                    <ReferenceLine y={30} stroke="#10B981" strokeDasharray="3 3" label={{ value: 'Oversold (30)', fill: '#10B981', fontSize: 10, position: 'insideBottomRight' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '6px', fontSize: '12px', color: '#F1F5F9' }}
                      formatter={(val: any) => [`${Number(val).toFixed(2)}`, 'RSI (14)']}
                    />
                    <Line type="monotone" dataKey="rsi_14" stroke="#10B981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {indicatorView === 'macd' && (
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-semibold text-slate-200">
                  MACD Line & Histogram (Normalized by Close(t))
                </span>
                <span className="text-slate-400 font-mono">
                  EMA(12) - EMA(26) with 9-Day Signal
                </span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={recentSlice} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#64748B"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => val.slice(5)}
                    />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(v) => `${(v * 100).toFixed(1)}%`} />
                    <ReferenceLine y={0} stroke="#475569" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '6px', fontSize: '12px', color: '#F1F5F9' }}
                      formatter={(val: any) => [`${(Number(val) * 100).toFixed(4)}%`, 'MACD Hist / Close']}
                    />
                    <Bar dataKey="macd_hist" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {indicatorView === 'bb' && (
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-semibold text-slate-200">
                  Bollinger Bands %B (Position Relative to 20-Day 2-Std Dev Bands)
                </span>
                <span className="text-slate-400 font-mono">
                  %B &gt; 1: Upper Band Breakout | %B &lt; 0: Lower Band Breakout
                </span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={recentSlice} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#64748B"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => val.slice(5)}
                    />
                    <YAxis stroke="#64748B" fontSize={11} domain={[-0.2, 1.2]} tickLine={false} />
                    <ReferenceLine y={1.0} stroke="#F43F5E" strokeDasharray="3 3" label={{ value: 'Upper Band (%B=1.0)', fill: '#F43F5E', fontSize: 10, position: 'insideTopRight' }} />
                    <ReferenceLine y={0.5} stroke="#475569" strokeDasharray="2 2" />
                    <ReferenceLine y={0.0} stroke="#10B981" strokeDasharray="3 3" label={{ value: 'Lower Band (%B=0.0)', fill: '#10B981', fontSize: 10, position: 'insideBottomRight' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '6px', fontSize: '12px', color: '#F1F5F9' }}
                      formatter={(val: any) => [`${Number(val).toFixed(3)}`, 'Bollinger %B']}
                    />
                    <Line type="monotone" dataKey="bb_pct_b" stroke="#38BDF8" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {indicatorView === 'atr' && (
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-semibold text-slate-200">
                  Normalized ATR (14-period Volatility as % of Price) & Volume Ratio
                </span>
                <span className="text-slate-400 font-mono">
                  Scale-invariant volatility measure
                </span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={recentSlice} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#64748B"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => val.slice(5)}
                    />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(v) => `${Number(v).toFixed(1)}%`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '6px', fontSize: '12px', color: '#F1F5F9' }}
                      formatter={(val: any, name: any) => [
                        `${Number(val).toFixed(2)}${name === 'natr_14' ? '%' : 'x'}`,
                        name === 'natr_14' ? 'Normalized ATR (14)' : 'Volume Ratio (20d)',
                      ]}
                    />
                    <Line type="monotone" dataKey="natr_14" name="natr_14" stroke="#F59E0B" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="vol_ratio_20" name="vol_ratio_20" stroke="#10B981" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feature Engineering Dictionary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(FEATURE_DISPLAY_METADATA).map(([key, meta]) => (
          <div key={key} className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
              <span>{meta.label}</span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                {meta.category}
              </span>
            </div>
            <div className="font-mono text-xs text-emerald-400 mt-1 font-semibold">
              df['{key}']
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {meta.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
