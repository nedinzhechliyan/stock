import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { StrategyPoint, FeatureImportance } from '../types/market';
import { TrendingUp, Award, Layers, Calendar, BarChart3 } from 'lucide-react';

interface DiagnosticsViewProps {
  strategyCurve: StrategyPoint[];
  featureImportances: FeatureImportance[];
  recentTestTimeline: { date: string; actual: number; predicted: number; close: number }[];
}

export const DiagnosticsView: React.FC<DiagnosticsViewProps> = ({
  strategyCurve,
  featureImportances,
  recentTestTimeline,
}) => {
  const [timelineWindow, setTimelineWindow] = useState<'60' | 'all'>('60');

  const finalStrategy = strategyCurve[strategyCurve.length - 1]?.strategyEquity || 1.0;
  const finalBenchmark = strategyCurve[strategyCurve.length - 1]?.benchmarkEquity || 1.0;
  const stratGrowthPct = (finalStrategy - 1.0) * 100;
  const benchGrowthPct = (finalBenchmark - 1.0) * 100;
  const alphaEquity = (finalStrategy - finalBenchmark) * 100;

  // Subsample curve data for smooth chart rendering
  const step = Math.max(1, Math.floor(strategyCurve.length / 120));
  const downsampledCurve = strategyCurve.filter((_, idx) => idx % step === 0 || idx === strategyCurve.length - 1);

  // Timeline slice
  const displayedTimeline =
    timelineWindow === '60'
      ? recentTestTimeline.slice(-60)
      : strategyCurve.map((s) => ({
          date: s.date,
          actual: s.actualDirection,
          predicted: s.predDirection,
          close: s.close,
        }));

  const correctPredictionsCount = displayedTimeline.filter(
    (item) => item.actual === item.predicted
  ).length;
  const windowAcc = (correctPredictionsCount / displayedTimeline.length) * 100;

  return (
    <div className="space-y-6">
      {/* 1. Out-of-Sample Performance Simulation ($1.00 Growth) */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h3 className="text-base font-bold text-slate-100">
                Out-of-Sample Strategy Equity Simulation ($1.00 Growth)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Cumulative return of Long/Short directional strategy vs Buy & Hold benchmark on unseen test data.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-right">
              <span className="text-slate-400 block text-[11px]">Strategy Growth</span>
              <span className={`font-bold ${stratGrowthPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ${finalStrategy.toFixed(2)} ({stratGrowthPct >= 0 ? '+' : ''}{stratGrowthPct.toFixed(1)}%)
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[11px]">Benchmark B&H</span>
              <span className="font-bold text-slate-300">
                ${finalBenchmark.toFixed(2)} ({benchGrowthPct >= 0 ? '+' : ''}{benchGrowthPct.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Recharts Simulation Line Chart */}
        <div className="h-72 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={downsampledCurve} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => {
                  const parts = val.split('-');
                  return parts.length >= 2 ? `${parts[0]}-${parts[1]}` : val;
                }}
              />
              <YAxis
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                domain={['auto', 'auto']}
                tickFormatter={(val) => `$${Number(val).toFixed(2)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#334155',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: '#F1F5F9',
                }}
                itemStyle={{ color: '#F1F5F9' }}
                formatter={(value: any, name: any) => [
                  `$${Number(value).toFixed(4)}`,
                  name === 'strategyEquity'
                    ? 'Engineered Strategy (L/S)'
                    : 'Benchmark (Buy & Hold)',
                ]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '12px', color: '#94A3B8' }}
              />
              <Line
                type="monotone"
                dataKey="benchmarkEquity"
                name="Benchmark Buy & Hold"
                stroke="#64748B"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="strategyEquity"
                name="Engineered Model (Long/Short Strategy)"
                stroke="#10B981"
                strokeWidth={2.2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400">
          <span>Simulation assumes daily rebalancing at Close(t) with zero transaction costs.</span>
          <span className="font-mono text-slate-300">
            Strategy Alpha: <strong className={alphaEquity >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {alphaEquity >= 0 ? `+${alphaEquity.toFixed(1)}%` : `${alphaEquity.toFixed(1)}%`}
            </strong>
          </span>
        </div>
      </div>

      {/* 2-Column Section: Directional Timeline & Feature Importance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actual vs Predicted Direction Matrix (Sample Window) */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-slate-100">
                  Predicted vs Actual Direction (Last {displayedTimeline.length} Test Days)
                </h4>
              </div>
              <div className="flex gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setTimelineWindow('60')}
                  className={`px-2.5 py-1 rounded cursor-pointer transition font-mono ${
                    timelineWindow === '60'
                      ? 'bg-emerald-600 text-white font-medium'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                  }`}
                >
                  Last 60
                </button>
                <button
                  type="button"
                  onClick={() => setTimelineWindow('all')}
                  className={`px-2.5 py-1 rounded cursor-pointer transition font-mono ${
                    timelineWindow === 'all'
                      ? 'bg-emerald-600 text-white font-medium'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                  }`}
                >
                  All Test
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              Visual scatter comparing actual market direction (1=Up, 0=Down) with model predicted sign.
              Current window directional hit rate: <strong className="font-mono text-emerald-400">{windowAcc.toFixed(1)}%</strong> ({correctPredictionsCount}/{displayedTimeline.length}).
            </p>

            {/* Scatter / Signal Timeline */}
            <div className="mt-4 space-y-1 max-h-64 overflow-y-auto pr-1">
              <div className="grid grid-cols-12 text-[10px] uppercase font-bold text-slate-400 pb-1 border-b border-slate-800 font-mono">
                <span className="col-span-4">Date</span>
                <span className="col-span-3 text-right">Close</span>
                <span className="col-span-2 text-center">Actual</span>
                <span className="col-span-2 text-center">Pred</span>
                <span className="col-span-1 text-center">Hit</span>
              </div>
              {displayedTimeline.slice(-30).map((item) => {
                const isCorrect = item.actual === item.predicted;
                return (
                  <div
                    key={item.date}
                    className={`grid grid-cols-12 text-xs font-mono py-1 px-1.5 rounded items-center ${
                      isCorrect ? 'bg-slate-950/60 text-slate-200' : 'bg-rose-950/20 text-slate-300'
                    }`}
                  >
                    <span className="col-span-4 text-slate-400 text-[11px]">{item.date}</span>
                    <span className="col-span-3 text-right text-[11px] text-slate-300">${item.close.toFixed(2)}</span>
                    <span className="col-span-2 text-center">
                      <span
                        className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          item.actual === 1 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {item.actual === 1 ? '▲ Up' : '▼ Dn'}
                      </span>
                    </span>
                    <span className="col-span-2 text-center">
                      <span
                        className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          item.predicted === 1 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {item.predicted === 1 ? '▲ Up' : '▼ Dn'}
                      </span>
                    </span>
                    <span className="col-span-1 text-center font-bold">
                      {isCorrect ? (
                        <span className="text-emerald-400">✓</span>
                      ) : (
                        <span className="text-rose-400">✗</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800 flex justify-between">
            <span>Showing recent 30 sessions</span>
            <span className="text-emerald-400 font-medium">Green ✓ = Correct Directional Hit</span>
          </div>
        </div>

        {/* Feature Importance (Random Forest Gini) */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-slate-100">
                  Feature Importance (Random Forest Gini Impurity)
                </h4>
              </div>
              <span className="text-xs font-mono text-slate-400">
                10 Engineered Indicators
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-2 mb-3">
              Normalized relative contribution to tree splits. Stationary indicators (ATR, Returns, RSI) capture volatility and mean-reversion.
            </p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[...featureImportances].reverse()}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#64748B"
                    fontSize={10}
                    tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                  />
                  <YAxis
                    dataKey="displayName"
                    type="category"
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    width={110}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#F1F5F9',
                    }}
                    formatter={(val: any) => [`${(Number(val) * 100).toFixed(2)}%`, 'Relative Gini Importance']}
                  />
                  <Bar dataKey="importance" fill="#10B981" radius={[0, 4, 4, 0]}>
                    {featureImportances.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index < 3 ? '#10B981' : '#059669'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800 flex justify-between">
            <span>Primary drivers: Volatility spread & Momentum</span>
            <span className="font-mono text-emerald-400 font-semibold">Top: {featureImportances[0]?.displayName}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
