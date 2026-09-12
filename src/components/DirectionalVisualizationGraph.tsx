import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Line,
  Area,
  AreaChart,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
  Cell,
} from 'recharts';
import { PipelineResult } from '../types/market';
import {
  TrendingUp,
  Activity,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Sparkles,
  Filter,
  BarChart2,
  Maximize2,
  Info,
} from 'lucide-react';

interface DirectionalVisualizationGraphProps {
  result: PipelineResult;
}

type HorizonOption = '30' | '60' | '120' | 'all';
type GraphMode = 'overlay' | 'steps' | 'confidence' | 'cumulative';

export const DirectionalVisualizationGraph: React.FC<DirectionalVisualizationGraphProps> = ({
  result,
}) => {
  // Active selected model for visualization
  const [selectedModelId, setSelectedModelId] = useState<string>('eng_lr');
  // Time horizon filter
  const [horizon, setHorizon] = useState<HorizonOption>('60');
  // Graph display mode
  const [graphMode, setGraphMode] = useState<GraphMode>('overlay');

  const selectedEvaluation = useMemo(() => {
    return (
      result.evaluations.find((e) => e.id === selectedModelId) ||
      result.evaluations[3] || // fallback to engineered logistic regression
      result.evaluations[0]
    );
  }, [result.evaluations, selectedModelId]);

  // Construct full test window directional dataset
  const fullTestDataset = useMemo(() => {
    let runningHits = 0;
    return result.strategyCurve.map((point, idx) => {
      const actual = point.actualDirection; // 1 (Up) or 0 (Down)
      const pred = selectedEvaluation.predictions[idx] ?? point.predDirection;
      const prob =
        selectedEvaluation.probabilities[idx] ??
        (pred === 1 ? 0.65 : 0.35);

      const isHit = actual === pred;
      if (isHit) runningHits++;

      const cumAccuracy = Number(((runningHits / (idx + 1)) * 100).toFixed(1));

      return {
        date: point.date,
        close: point.close,
        actual,
        actualLabel: actual === 1 ? 'Up (▲)' : 'Down (▼)',
        actualStep: actual === 1 ? 1 : -1,
        predicted: pred,
        predictedLabel: pred === 1 ? 'Up (▲)' : 'Down (▼)',
        predictedStep: pred === 1 ? 1 : -1,
        probability: Number((prob * 100).toFixed(1)),
        isHit,
        matchScore: isHit ? 1 : 0,
        mismatchScore: isHit ? 0 : 1,
        cumAccuracy,
        nextReturnPct: Number((point.benchmarkReturn * 100).toFixed(2)),
        // Marker representation on price line
        hitClose: isHit ? point.close : null,
        missClose: !isHit ? point.close : null,
      };
    });
  }, [result.strategyCurve, selectedEvaluation]);

  // Slice dataset based on chosen horizon
  const visibleData = useMemo(() => {
    if (horizon === '30') return fullTestDataset.slice(-30);
    if (horizon === '60') return fullTestDataset.slice(-60);
    if (horizon === '120') return fullTestDataset.slice(-120);
    return fullTestDataset;
  }, [fullTestDataset, horizon]);

  // Window statistics
  const windowStats = useMemo(() => {
    const total = visibleData.length;
    if (total === 0) {
      return {
        accuracy: 0,
        hits: 0,
        total: 0,
        upPredictions: 0,
        downPredictions: 0,
        upPrecision: 0,
        downPrecision: 0,
        longestStreak: 0,
      };
    }

    const hits = visibleData.filter((d) => d.isHit).length;
    const accuracy = Number(((hits / total) * 100).toFixed(1));

    const upPreds = visibleData.filter((d) => d.predicted === 1);
    const downPreds = visibleData.filter((d) => d.predicted === 0);

    const upHits = upPreds.filter((d) => d.actual === 1).length;
    const downHits = downPreds.filter((d) => d.actual === 0).length;

    const upPrecision =
      upPreds.length > 0 ? Number(((upHits / upPreds.length) * 100).toFixed(1)) : 0;
    const downPrecision =
      downPreds.length > 0
        ? Number(((downHits / downPreds.length) * 100).toFixed(1))
        : 0;

    // Calculate max consecutive hit streak
    let currentStreak = 0;
    let maxStreak = 0;
    for (const d of visibleData) {
      if (d.isHit) {
        currentStreak++;
        if (currentStreak > maxStreak) maxStreak = currentStreak;
      } else {
        currentStreak = 0;
      }
    }

    return {
      accuracy,
      hits,
      total,
      upPredictions: upPreds.length,
      downPredictions: downPreds.length,
      upPrecision,
      downPrecision,
      longestStreak: maxStreak,
    };
  }, [visibleData]);

  // Downsample if "all" is selected and length is high for smooth rendering
  const chartData = useMemo(() => {
    if (visibleData.length <= 150) return visibleData;
    const step = Math.max(1, Math.floor(visibleData.length / 120));
    return visibleData.filter(
      (_, i) => i % step === 0 || i === visibleData.length - 1
    );
  }, [visibleData]);

  return (
    <div id="directional-visualization-root" className="space-y-6">
      {/* 1. Header & Specification Deliverable Badge */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base sm:text-lg font-bold text-slate-100 font-mono tracking-tight">
                Plot: Predicted vs. Actual Directional Movement
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Visualizing day-by-day directional classifications (<span className="text-emerald-400 font-mono">1 = Up</span>, <span className="text-slate-300 font-mono">0 = Down</span>) across the unseen out-of-sample test window.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xs font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Deliverable: Test Window Visualization</span>
            </span>
          </div>
        </div>

        {/* 2. Time-Based Split Architectural Banner */}
        <div className="mt-4 pt-1">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2 mb-2">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Time-Based Split Structure (Strict Chronological Partition)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 text-xs font-mono">
            {/* Train Segment */}
            <div className="md:col-span-7 bg-slate-950/90 border border-slate-800 p-3 rounded-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400 inline-block"></span>
                    Training Partition (Earlier Range)
                  </span>
                  <span className="text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                    {result.trainBars} Bars (~{Math.round((result.trainBars / result.totalBars) * 100)}%)
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Range: <span className="text-slate-200 font-medium">{result.trainStartDate}</span> to <span className="text-slate-200 font-medium">{result.trainEndDate}</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-sky-400 shrink-0" />
                <span><strong className="text-slate-300">Rule Enforced:</strong> Feature StandardScalers fit strictly here.</span>
              </div>
            </div>

            {/* Split Boundary Marker */}
            <div className="md:col-span-1 hidden md:flex flex-col items-center justify-center text-center">
              <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-1">Split</div>
              <div className="h-8 w-px bg-emerald-500/40"></div>
              <div className="text-[9px] text-slate-400 font-mono mt-1">T_split</div>
            </div>

            {/* Test Segment */}
            <div className="md:col-span-4 bg-emerald-950/20 border border-emerald-500/30 p-3 rounded-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                    Test Window (Later Range)
                  </span>
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {result.testBars} Bars (~{Math.round((result.testBars / result.totalBars) * 100)}%)
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Range: <span className="text-emerald-200 font-medium">{result.testStartDate}</span> to <span className="text-emerald-200 font-medium">{result.testEndDate}</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span><strong className="text-emerald-300">Out-of-Sample:</strong> Plotted in visualization below.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Interactive Visualization Workspace */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-xs space-y-4">
        {/* Top Control Bar: Model, Horizon, and Mode Selectors */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          {/* Model Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-semibold text-slate-400">Target Model:</span>
            <select
              id="model-selector-dropdown"
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-100 text-xs rounded-md px-3 py-1.5 font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              {result.evaluations.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} (Acc: {(model.accuracy * 100).toFixed(1)}%)
                </option>
              ))}
            </select>
          </div>

          {/* Visualization Modes */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-slate-950/80 border border-slate-800 p-1 rounded-md flex text-xs font-semibold">
              <button
                type="button"
                id="mode-btn-overlay"
                onClick={() => setGraphMode('overlay')}
                className={`px-3 py-1 rounded transition cursor-pointer ${
                  graphMode === 'overlay'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Price & Signals
              </button>
              <button
                type="button"
                id="mode-btn-steps"
                onClick={() => setGraphMode('steps')}
                className={`px-3 py-1 rounded transition cursor-pointer ${
                  graphMode === 'steps'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Directional Steps (±1)
              </button>
              <button
                type="button"
                id="mode-btn-confidence"
                onClick={() => setGraphMode('confidence')}
                className={`px-3 py-1 rounded transition cursor-pointer ${
                  graphMode === 'confidence'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Confidence P(Up)
              </button>
              <button
                type="button"
                id="mode-btn-cumulative"
                onClick={() => setGraphMode('cumulative')}
                className={`px-3 py-1 rounded transition cursor-pointer ${
                  graphMode === 'cumulative'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Cumulative Hit Rate
              </button>
            </div>

            {/* Time Horizon Filter */}
            <div className="bg-slate-950/80 border border-slate-800 p-1 rounded-md flex text-xs font-mono">
              {(['30', '60', '120', 'all'] as const).map((h) => (
                <button
                  key={h}
                  type="button"
                  id={`horizon-btn-${h}`}
                  onClick={() => setHorizon(h)}
                  className={`px-2.5 py-1 rounded transition cursor-pointer ${
                    horizon === h
                      ? 'bg-slate-800 text-emerald-400 font-bold border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {h === 'all' ? 'All Test' : `${h}D`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Metric Summary Strip for Selected Test Horizon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 text-xs font-mono">
          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg">
            <span className="text-slate-400 block text-[11px]">Window Directional Accuracy</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-bold text-emerald-400">
                {windowStats.accuracy}%
              </span>
              <span className="text-slate-400 text-[11px]">
                ({windowStats.hits}/{windowStats.total} days)
              </span>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg">
            <span className="text-slate-400 block text-[11px]">Bullish Precision (Pred Up)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-bold text-sky-400">
                {windowStats.upPrecision}%
              </span>
              <span className="text-slate-400 text-[11px]">
                ({windowStats.upPredictions} calls)
              </span>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg">
            <span className="text-slate-400 block text-[11px]">Bearish Precision (Pred Down)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-bold text-amber-400">
                {windowStats.downPrecision}%
              </span>
              <span className="text-slate-400 text-[11px]">
                ({windowStats.downPredictions} calls)
              </span>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg">
            <span className="text-slate-400 block text-[11px]">Longest Winning Streak</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-bold text-slate-100">
                {windowStats.longestStreak}
              </span>
              <span className="text-slate-400 text-[11px]">consecutive sessions</span>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg col-span-2 sm:col-span-4 lg:col-span-1">
            <span className="text-slate-400 block text-[11px]">Selected Evaluator</span>
            <div className="mt-1 truncate">
              <span className="text-slate-200 font-bold block truncate">
                {selectedEvaluation.name}
              </span>
              <span className="text-[10px] text-emerald-400">
                F1 Score: {(selectedEvaluation.f1 * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* 4. PRIMARY CHARTS (Based on Selected Mode) */}
        <div className="h-80 w-full pt-2">
          {/* MODE 1: Price Path with Directional Prediction Markers */}
          {graphMode === 'overlay' && (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => val.slice(5)}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  domain={['auto', 'auto']}
                  tickLine={false}
                  tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg shadow-xl text-xs font-mono space-y-1.5 text-slate-100 max-w-xs">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1 font-bold">
                          <span className="text-slate-300">{data.date}</span>
                          <span className="text-emerald-400">${data.close.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Model Prediction:</span>
                          <span
                            className={`font-bold ${
                              data.predicted === 1 ? 'text-sky-400' : 'text-amber-400'
                            }`}
                          >
                            {data.predicted === 1 ? '▲ Up (1)' : '▼ Down (0)'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Actual Market Movement:</span>
                          <span
                            className={`font-bold ${
                              data.actual === 1 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {data.actual === 1 ? '▲ Up (1)' : '▼ Down (0)'} ({data.nextReturnPct >= 0 ? '+' : ''}{data.nextReturnPct}%)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Classification Result:</span>
                          <span
                            className={`font-bold inline-flex items-center gap-1 ${
                              data.isHit ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {data.isHit ? '✓ Accurate Hit' : '✗ Misprediction'}
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px] pt-1 border-t border-slate-800/80">
                          <span className="text-slate-400">Model Confidence P(Up):</span>
                          <span className="text-slate-200">{data.probability}%</span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', color: '#94A3B8' }}
                />
                {/* Baseline Price Line */}
                <Area
                  type="monotone"
                  dataKey="close"
                  name="Asset Close Price ($)"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#priceGradient)"
                />
                {/* Hit points */}
                <Line
                  type="monotone"
                  dataKey="hitClose"
                  name="Correct Prediction (Hit ✓)"
                  stroke="transparent"
                  dot={{ r: 3.5, fill: '#10B981', stroke: '#064E3B', strokeWidth: 1.5 }}
                />
                {/* Miss points */}
                <Line
                  type="monotone"
                  dataKey="missClose"
                  name="Misprediction (Miss ✗)"
                  stroke="transparent"
                  dot={{ r: 3.5, fill: '#F43F5E', stroke: '#881337', strokeWidth: 1.5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}

          {/* MODE 2: Discrete Directional Step Comparison (+1 Up / -1 Down) */}
          {graphMode === 'steps' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => val.slice(5)}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  domain={[-1.5, 1.5]}
                  ticks={[-1, 0, 1]}
                  tickLine={false}
                  tickFormatter={(v) => (v === 1 ? '+1 (Up)' : v === -1 ? '-1 (Dn)' : '0')}
                />
                <ReferenceLine y={0} stroke="#475569" strokeDasharray="2 2" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: '#F1F5F9',
                  }}
                  formatter={(val: any, name: any) => [
                    Number(val) === 1 ? '▲ Up (+1)' : '▼ Down (-1)',
                    name,
                  ]}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', color: '#94A3B8' }}
                />
                <Line
                  type="stepAfter"
                  dataKey="actualStep"
                  name="Actual Market Direction"
                  stroke="#94A3B8"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="3 3"
                />
                <Line
                  type="stepAfter"
                  dataKey="predictedStep"
                  name="Model Predicted Direction"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {/* MODE 3: Model Prediction Probability P(Up) vs 50% Threshold */}
          {graphMode === 'confidence' && (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => val.slice(5)}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <ReferenceLine
                  y={50}
                  stroke="#F59E0B"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  label={{
                    value: 'Threshold = 50% (>50% Bullish, <50% Bearish)',
                    fill: '#F59E0B',
                    fontSize: 10,
                    position: 'insideTopRight',
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: '#F1F5F9',
                  }}
                  formatter={(val: any, name: any) => [`${val}%`, name]}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', color: '#94A3B8' }}
                />
                <Area
                  type="monotone"
                  dataKey="probability"
                  name="Model Confidence P(Up %)"
                  stroke="#38BDF8"
                  strokeWidth={2}
                  fill="#0284C7"
                  fillOpacity={0.15}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}

          {/* MODE 4: Cumulative Out-of-Sample Hit Rate */}
          {graphMode === 'cumulative' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => val.slice(5)}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  domain={[40, 70]}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <ReferenceLine
                  y={50}
                  stroke="#94A3B8"
                  strokeDasharray="3 3"
                  label={{ value: 'Coin Flip (50%)', fill: '#94A3B8', fontSize: 10, position: 'insideBottomRight' }}
                />
                <ReferenceLine
                  y={result.testUpPct * 100}
                  stroke="#F59E0B"
                  strokeDasharray="3 3"
                  label={{
                    value: `Majority Drift (${(result.testUpPct * 100).toFixed(1)}%)`,
                    fill: '#F59E0B',
                    fontSize: 10,
                    position: 'insideTopRight',
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: '#F1F5F9',
                  }}
                  formatter={(val: any) => [`${Number(val).toFixed(1)}%`, 'Running Accuracy']}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', color: '#94A3B8' }}
                />
                <Line
                  type="monotone"
                  dataKey="cumAccuracy"
                  name="Cumulative Hit Rate (%)"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Legend & Visual Diagnostic Footnote */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              <span className="text-slate-300">Green Dots = Correct Directional Hits</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
              <span className="text-slate-300">Red Dots = Directional Misses</span>
            </span>
          </div>

          <div className="font-mono text-slate-400 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-emerald-400" />
            <span>Target formulation: strictly evaluated on Date(t+1) close versus Date(t) close</span>
          </div>
        </div>
      </div>

      {/* 5. Direct Side-by-Side Directional Inspection Window */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wide font-mono">
              Chronological Directional Feed (Recent {Math.min(visibleData.length, 25)} Sessions)
            </h4>
            <p className="text-xs text-slate-400">
              Granular observation logs verifying predicted sign vs. actual price action on unseen bars.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
            Window Accuracy: {windowStats.accuracy}%
          </span>
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-950/70 text-slate-400 font-semibold border-b border-slate-800">
                <th className="py-2 px-3">Date (t)</th>
                <th className="py-2 px-3 text-right">Close (t)</th>
                <th className="py-2 px-3 text-center">Predicted Sign</th>
                <th className="py-2 px-3 text-center">Actual Sign (t+1)</th>
                <th className="py-2 px-3 text-right">Next Return</th>
                <th className="py-2 px-3 text-center">Confidence P(Up)</th>
                <th className="py-2 px-3 text-center">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {visibleData.slice(-25).reverse().map((row) => (
                <tr
                  key={row.date}
                  className={`transition-colors ${
                    row.isHit ? 'hover:bg-slate-800/40 text-slate-200' : 'bg-rose-950/10 hover:bg-rose-950/20 text-slate-300'
                  }`}
                >
                  <td className="py-2 px-3 font-semibold text-slate-300">{row.date}</td>
                  <td className="py-2 px-3 text-right">${row.close.toFixed(2)}</td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                        row.predicted === 1
                          ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {row.predicted === 1 ? '▲ Up (1)' : '▼ Down (0)'}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                        row.actual === 1
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {row.actual === 1 ? '▲ Up (1)' : '▼ Down (0)'}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <span
                      className={
                        row.nextReturnPct >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'
                      }
                    >
                      {row.nextReturnPct >= 0 ? '+' : ''}
                      {row.nextReturnPct}%
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center font-bold">
                    <span className={row.probability >= 50 ? 'text-sky-400' : 'text-amber-400'}>
                      {row.probability}%
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center font-bold">
                    {row.isHit ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Hit
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-400">
                        <XCircle className="w-3.5 h-3.5" /> Miss
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
