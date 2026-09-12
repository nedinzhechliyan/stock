import React from 'react';
import { BookOpen, AlertTriangle, ShieldCheck, Scale, BarChart2, Cpu } from 'lucide-react';

export const MethodologyReport: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-bold text-slate-100 font-mono">
            Institutional ML Methodology & Directional Audit Takeaways
          </h3>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          Predicting equity price direction is one of the most hostile machine learning tasks due to extreme signal-to-noise ratios, non-stationary regimes, and subtle data leakage avenues. This system was engineered to conform to strict statistical and audit standards.
        </p>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Takeaway 1 */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-200 text-sm">
              <Scale className="w-4 h-4 text-emerald-400" />
              <span>1. The High Signal-to-Noise Ratio Reality</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Directional predictability in liquid markets (such as S&P 500 / SPY) hovers tightly around <strong className="text-slate-200">52% to 56%</strong>.
              In quantitative finance, claims of <span className="text-rose-400 font-semibold">&gt;65% out-of-sample daily directional accuracy</span> on liquid equities almost invariably stem from subtle forward-looking leakage, lookahead bias, or contemporaneous target mis-alignment.
            </p>
          </div>

          {/* Takeaway 2 */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-200 text-sm">
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              <span>2. Non-Stationarity: Raw vs. Engineered Features</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Raw price levels (Open, High, Low, Close) are non-stationary integrated processes (<span className="font-mono text-emerald-400">I(1)</span>). A model trained on $250 prices cannot generalize when the asset rises to $450.
              In contrast, stationary engineered features (RSI, normalized ATR, Bollinger %B, normalized MACD) remain bounded and distributionally stable across structural regime changes.
            </p>
          </div>

          {/* Takeaway 3 */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-200 text-sm">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>3. Model Complexity & Occam's Razor</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              In noisy time series, high-capacity non-linear ensembles (deep Random Forests, gradient boosted trees) frequently overfit spurious historical microstructure noise.
              A properly calibrated, regularized Logistic Regression (with L2 penalty <span className="font-mono text-emerald-400">C=0.1</span>) frequently equals or surpasses complex non-linear models on true out-of-sample forward partitions.
            </p>
          </div>

          {/* Takeaway 4 */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-200 text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>4. The Vital Role of Naive Baselines</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Because equity markets have a positive long-term upward drift, the <strong className="text-slate-200">Majority Class baseline</strong> often yields ~53% to 55% accuracy by simply predicting "Up" every single day.
              A model scoring 54% accuracy has achieved <span className="text-rose-400 font-semibold">zero excess alpha</span>. Benchmarking against both Majority Class and Persistence is mandatory to identify true predictive capability.
            </p>
          </div>
        </div>
      </div>

      {/* Target Construction Formula Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-xs space-y-3">
        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-mono">
          Mathematical Formulation of the Target Vector
        </h4>
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs overflow-x-auto space-y-2">
          <div className="text-slate-400 font-sans text-[11px]">Binary Directional Target:</div>
          <div className="text-emerald-400 font-bold">
            Target(t) = 1  if  Close(t+1) &gt; Close(t)  else  0
          </div>
          <div className="text-slate-400 font-sans text-[11px] pt-2">Feature Set Temporal Horizon:</div>
          <div className="text-sky-300">
            X(t) = f( Open(k), High(k), Low(k), Close(k), Volume(k) )   for all k &le; t
          </div>
          <div className="text-slate-400 font-sans text-[11px] pt-2">Persistence Baseline:</div>
          <div className="text-amber-300">
            Pred_Persistence(t) = 1  if  Close(t) &gt; Close(t-1)  else  0
          </div>
        </div>
      </div>
    </div>
  );
};
