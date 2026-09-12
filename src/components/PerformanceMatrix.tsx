import React, { useState } from 'react';
import { ModelEvaluation } from '../types/market';
import { HelpCircle, Check, AlertTriangle, BarChart2 } from 'lucide-react';

interface PerformanceMatrixProps {
  evaluations: ModelEvaluation[];
}

export const PerformanceMatrix: React.FC<PerformanceMatrixProps> = ({ evaluations }) => {
  const [selectedModelId, setSelectedModelId] = useState<string>('eng_lr');

  const selectedModel =
    evaluations.find((e) => e.id === selectedModelId) || evaluations[3] || evaluations[0];

  // Determine highest scores for subtle badge highlights
  const maxAcc = Math.max(...evaluations.map((e) => e.accuracy));
  const maxPrec = Math.max(...evaluations.map((e) => e.precision));
  const maxRec = Math.max(...evaluations.map((e) => e.recall));
  const maxF1 = Math.max(...evaluations.map((e) => e.f1));
  const maxAuc = Math.max(...evaluations.map((e) => e.rocAuc));

  const majorityEval = evaluations.find((e) => e.id === 'baseline_majority');
  const majorityAcc = majorityEval?.accuracy ?? 0.54;

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Five-Way Model Comparison Matrix (Test Set Performance)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Evaluated on the out-of-sample forward test partition with zero data leakage.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-mono font-medium bg-slate-800/80 text-slate-300 border border-slate-700">
              Majority Drift: {(majorityAcc * 100).toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-sm font-sans">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-xs uppercase tracking-wider bg-slate-950/60">
                <th className="py-3 px-4">Model / Strategy</th>
                <th className="py-3 px-3 text-right">Accuracy</th>
                <th className="py-3 px-3 text-right">Precision</th>
                <th className="py-3 px-3 text-right">Recall</th>
                <th className="py-3 px-3 text-right">F1-Score</th>
                <th className="py-3 px-3 text-right">ROC-AUC</th>
                <th className="py-3 px-4 text-center">Status vs Baseline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {evaluations.map((item) => {
                const isSelected = item.id === selectedModelId;
                const isWinner = item.accuracy === maxAcc;
                const alpha = (item.accuracy - majorityAcc) * 100;

                return (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedModelId(item.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-slate-800/70 font-medium text-slate-100'
                        : 'hover:bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            item.isBaseline
                              ? 'bg-slate-500'
                              : item.isEngineered
                              ? 'bg-emerald-400 shadow-xs shadow-emerald-400/50'
                              : 'bg-amber-400'
                          }`}
                        />
                        <span className={item.isEngineered ? 'font-semibold text-slate-100' : ''}>
                          {item.name}
                        </span>
                        {item.isEngineered && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                            Engineered
                          </span>
                        )}
                        {item.isBaseline && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                            Baseline
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono">
                      <span
                        className={
                          item.accuracy === maxAcc
                            ? 'font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20'
                            : 'text-slate-300'
                        }
                      >
                        {item.accuracy.toFixed(4)}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono">
                      <span
                        className={
                          item.precision === maxPrec && !item.isBaseline
                            ? 'font-bold text-slate-100'
                            : 'text-slate-400'
                        }
                      >
                        {item.precision.toFixed(4)}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-400">
                      <span>{item.recall.toFixed(4)}</span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono">
                      <span
                        className={
                          item.f1 === maxF1 && !item.isBaseline
                            ? 'font-bold text-slate-100'
                            : 'text-slate-400'
                        }
                      >
                        {item.f1.toFixed(4)}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono">
                      <span
                        className={
                          item.rocAuc === maxAuc && item.rocAuc > 0.51
                            ? 'font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20'
                            : 'text-slate-400'
                        }
                      >
                        {item.rocAuc.toFixed(4)}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {item.isBaseline ? (
                        <span className="text-xs text-slate-500 font-mono">Reference</span>
                      ) : alpha > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                          <Check className="w-3 h-3 text-emerald-400" />
                          +{alpha.toFixed(2)}% Alpha
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full font-mono">
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          {alpha.toFixed(2)}% No Alpha
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Model Deep Dive: Confusion Matrix & Diagnostic Metrics */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-slate-100">
              Confusion Matrix & Error Diagnostic: <span className="text-emerald-400 font-semibold">{selectedModel.name}</span>
            </h4>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Click table row to inspect model
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 items-center">
          {/* Confusion Matrix 2x2 Grid */}
          <div className="md:col-span-2">
            <div className="text-xs font-mono uppercase text-slate-400 tracking-wider mb-2">
              Directional Classification Grid
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* True Negative */}
              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-lg">
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span>True Negative (TN)</span>
                  <span className="text-emerald-400 font-semibold">Correct Down</span>
                </div>
                <div className="text-2xl font-bold font-mono text-slate-100 mt-1">
                  {selectedModel.confusionMatrix.tn}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Model predicted Down, Market went Down
                </div>
              </div>

              {/* False Positive */}
              <div className="p-3.5 bg-rose-950/20 border border-rose-800/40 rounded-lg">
                <div className="flex items-center justify-between text-xs text-rose-400 font-medium">
                  <span>False Positive (FP)</span>
                  <span className="text-rose-400 font-semibold">Type I Error</span>
                </div>
                <div className="text-2xl font-bold font-mono text-rose-300 mt-1">
                  {selectedModel.confusionMatrix.fp}
                </div>
                <div className="text-[11px] text-rose-400/80 mt-1">
                  Model predicted Up, Market went Down
                </div>
              </div>

              {/* False Negative */}
              <div className="p-3.5 bg-rose-950/20 border border-rose-800/40 rounded-lg">
                <div className="flex items-center justify-between text-xs text-rose-400 font-medium">
                  <span>False Negative (FN)</span>
                  <span className="text-rose-400 font-semibold">Type II Error</span>
                </div>
                <div className="text-2xl font-bold font-mono text-rose-300 mt-1">
                  {selectedModel.confusionMatrix.fn}
                </div>
                <div className="text-[11px] text-rose-400/80 mt-1">
                  Model predicted Down, Market went Up
                </div>
              </div>

              {/* True Positive */}
              <div className="p-3.5 bg-emerald-950/20 border border-emerald-800/40 rounded-lg">
                <div className="flex items-center justify-between text-xs text-emerald-400 font-medium">
                  <span>True Positive (TP)</span>
                  <span className="text-emerald-400 font-semibold">Correct Up</span>
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">
                  {selectedModel.confusionMatrix.tp}
                </div>
                <div className="text-[11px] text-emerald-400/80 mt-1">
                  Model predicted Up, Market went Up
                </div>
              </div>
            </div>
          </div>

          {/* Diagnostic Breakdown */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 pb-2 border-b border-slate-800">
              Key Diagnostic Ratios
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Accuracy Rate</span>
              <span className="font-mono font-bold text-slate-200">
                {(selectedModel.accuracy * 100).toFixed(2)}%
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Precision (PPV)</span>
              <span className="font-mono font-bold text-slate-200">
                {(selectedModel.precision * 100).toFixed(2)}%
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Recall (Sensitivity)</span>
              <span className="font-mono font-bold text-slate-200">
                {(selectedModel.recall * 100).toFixed(2)}%
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">ROC-AUC Discriminator</span>
              <span className="font-mono font-bold text-emerald-400">
                {selectedModel.rocAuc.toFixed(4)}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 leading-normal">
              A ROC-AUC of 0.50 represents random drift. Liquid equity models typically reach 0.53 - 0.58.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
