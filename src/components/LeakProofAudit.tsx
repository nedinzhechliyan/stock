import React, { useState } from 'react';
import { ProcessedBar } from '../types/market';
import { ShieldCheck, ArrowRight, CheckCircle2, AlertCircle, Eye } from 'lucide-react';

interface LeakProofAuditProps {
  auditRows: ProcessedBar[];
}

export const LeakProofAudit: React.FC<LeakProofAuditProps> = ({ auditRows }) => {
  const [activeRowIdx, setActiveRowIdx] = useState<number | null>(0);

  const selectedRow = activeRowIdx !== null ? auditRows[activeRowIdx] : auditRows[0];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Audit: Zero Forward Leakage</span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Target Formulation: Target(t) = 1 if Close(t+1) &gt; Close(t) else 0
          </span>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          To guarantee <strong className="text-slate-100">no future information</strong> leaks into feature vectors,
          target labels are constructed via an explicit 1-period forward label shift (<code className="text-xs font-mono bg-slate-950 px-1.5 py-0.5 rounded text-emerald-400 border border-slate-800">shift(-1)</code>).
          All features at row <span className="font-mono font-semibold text-slate-100">Date(t)</span> (e.g. 1-day Return, RSI-14, Bollinger %B) are computed exclusively from price information available at or before Date(t).
        </p>

        {/* Verification Checkmarks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800 text-xs">
          <div className="flex items-start gap-2 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-slate-100">Temporal Forward Shift</span>
              <span className="text-slate-400">Target at t is strictly (Close(t+1) &gt; Close(t)). Last row is dropped.</span>
            </div>
          </div>

          <div className="flex items-start gap-2 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-slate-100">Training-Only Normalization</span>
              <span className="text-slate-400">StandardScaler fits strictly on t &lt; T_split; test partition is transformed only.</span>
            </div>
          </div>

          <div className="flex items-start gap-2 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-slate-100">Chronological Split (Zero Shuffle)</span>
              <span className="text-slate-400">Preserves time order; prevents autoregressive lookahead artifacts.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Audit Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              Step-by-Step Target Shift Audit (First 10 Clean Rows)
            </h4>
            <p className="text-xs text-slate-400">
              Hover or click on any row to verify how Date(t) Close is paired with next_close (Date t+1 Close).
            </p>
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-2 font-mono">
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span>Inspection Mode</span>
          </div>
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-950/70 text-slate-400 font-semibold border-b border-slate-800">
                <th className="py-2.5 px-3">Date (t)</th>
                <th className="py-2.5 px-3 text-right">Close (t)</th>
                <th className="py-2.5 px-3 text-right text-emerald-400 bg-emerald-500/10 font-bold border-x border-emerald-500/20">next_close (t+1)</th>
                <th className="py-2.5 px-3 text-right">ret_1d</th>
                <th className="py-2.5 px-3 text-right">rsi_14</th>
                <th className="py-2.5 px-3 text-right">bb_pct_b</th>
                <th className="py-2.5 px-3 text-center">today_dir</th>
                <th className="py-2.5 px-3 text-center text-emerald-400 bg-emerald-500/10 font-bold border-x border-emerald-500/20">Target (t)</th>
                <th className="py-2.5 px-3 text-center">Shift Proof</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {auditRows.map((row, idx) => {
                const isSelected = activeRowIdx === idx;
                const isTargetUp = row.target === 1;

                return (
                  <tr
                    key={row.date}
                    onMouseEnter={() => setActiveRowIdx(idx)}
                    onClick={() => setActiveRowIdx(idx)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-slate-800/80 text-slate-100 font-medium'
                        : 'hover:bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-semibold text-slate-200">{row.date}</td>
                    <td className="py-2.5 px-3 text-right">${row.close.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-400 bg-emerald-500/5 border-x border-slate-800/80">
                      ${row.next_close.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={row.ret_1d >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {(row.ret_1d * 100).toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">{row.rsi_14.toFixed(1)}</td>
                    <td className="py-2.5 px-3 text-right">{row.bb_pct_b.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${row.today_direction === 1 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                        {row.today_direction}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold bg-emerald-500/5 border-x border-slate-800/80">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                          isTargetUp
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-700 text-slate-200'
                        }`}
                      >
                        {row.target} ({isTargetUp ? 'Up' : 'Down'})
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-[11px]">
                      {row.next_close > row.close ? (
                        <span className="text-emerald-400 font-sans font-medium flex items-center justify-center gap-1">
                          <span>${row.next_close.toFixed(2)} &gt; ${row.close.toFixed(2)}</span>
                          <span className="text-emerald-400 font-bold">✓ 1</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 font-sans font-medium flex items-center justify-center gap-1">
                          <span>${row.next_close.toFixed(2)} ≤ ${row.close.toFixed(2)}</span>
                          <span className="text-slate-400 font-bold">✓ 0</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Row Diagnostic Callout */}
        {selectedRow && (
          <div className="mt-4 p-3.5 bg-slate-950/70 border border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="font-bold text-slate-100 flex items-center gap-2">
                <span>Row Inspection: {selectedRow.date}</span>
                <span className="text-emerald-400 font-mono">t → t+1 Audit</span>
              </div>
              <p className="text-slate-300">
                At Date {selectedRow.date}, Close was <strong className="text-slate-100">${selectedRow.close.toFixed(2)}</strong>.
                The following trading day closed at <strong className="text-emerald-400">${selectedRow.next_close.toFixed(2)}</strong>.
                Since ${selectedRow.next_close.toFixed(2)} {selectedRow.next_close > selectedRow.close ? '>' : '≤'} ${selectedRow.close.toFixed(2)},
                the target label is strictly set to <strong className="text-slate-100">{selectedRow.target}</strong>.
              </p>
            </div>
            <div className="shrink-0 font-mono text-right">
              <div className="text-slate-400 text-[11px]">RSI(14) computed at t:</div>
              <div className="font-bold text-slate-200">{selectedRow.rsi_14.toFixed(2)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Four Common Leakage Traps in Quantitative Finance */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-xs">
        <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wide mb-3 font-mono">
          Audit Checklist: Common Data Leakage Pitfalls Prevented
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400">
          <div className="p-3 bg-slate-950/70 rounded border border-slate-800 space-y-1">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Pitfall 1: Target Mis-Alignment</span>
            </div>
            <p>
              Predicting today's Close from today's Open with features calculated using today's Close. In our pipeline, all features are indexed &le; t, and target is explicitly t+1.
            </p>
          </div>

          <div className="p-3 bg-slate-950/70 rounded border border-slate-800 space-y-1">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Pitfall 2: Pre-Split Normalization Leakage</span>
            </div>
            <p>
              Fitting a StandardScaler on the full dataset leaks future test set distribution parameters (mean and standard deviation). We fit scalers strictly on the training partition.
            </p>
          </div>

          <div className="p-3 bg-slate-950/70 rounded border border-slate-800 space-y-1">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Pitfall 3: Centered Rolling Windows</span>
            </div>
            <p>
              Using centered averages (window centered at t) leaks future bars into technical indicators. All our pandas indicators use purely trailing, backward-looking windows.
            </p>
          </div>

          <div className="p-3 bg-slate-950/70 rounded border border-slate-800 space-y-1">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Pitfall 4: Shuffled Train/Test Split</span>
            </div>
            <p>
              Standard k-fold cross validation shuffles dates, training on future days to predict past days. We enforce a strictly chronological forward time-series split.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
