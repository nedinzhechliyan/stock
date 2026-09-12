import React, { useState, useEffect, useMemo } from 'react';
import { PipelineConfig, PipelineResult } from './types/market';
import { executeTimeSeriesPipeline } from './ml/engine';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MetricCards } from './components/MetricCards';
import { PerformanceMatrix } from './components/PerformanceMatrix';
import { LeakProofAudit } from './components/LeakProofAudit';
import { DiagnosticsView } from './components/DiagnosticsView';
import { TechnicalInspector } from './components/TechnicalInspector';
import { MethodologyReport } from './components/MethodologyReport';
import { DirectionalVisualizationGraph } from './components/DirectionalVisualizationGraph';
import {
  Table,
  ShieldCheck,
  LineChart as LineChartIcon,
  Sliders,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Activity,
} from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<PipelineConfig>({
    ticker: 'SPY',
    startDate: '2018-01-01',
    endDate: '2024-01-01',
    splitRatio: 0.8,
    rfEstimators: 150,
    rfMaxDepth: 4,
    cReg: 0.1,
  });

  const [activeTab, setActiveTab] = useState<
    'visualization' | 'matrix' | 'audit' | 'diagnostics' | 'indicators' | 'methodology'
  >('visualization');

  const [isComputing, setIsComputing] = useState<boolean>(false);
  const [lastExecutedConfig, setLastExecutedConfig] = useState<PipelineConfig>(config);

  // Compute pipeline result
  const [pipelineResult, setPipelineResult] = useState<PipelineResult>(() =>
    executeTimeSeriesPipeline(config)
  );

  const handleRunPipeline = () => {
    setIsComputing(true);
    // Small timeout to allow UI to render the loading state
    setTimeout(() => {
      try {
        const res = executeTimeSeriesPipeline(config);
        setPipelineResult(res);
        setLastExecutedConfig({ ...config });
      } catch (err) {
        console.error('Pipeline execution error:', err);
      } finally {
        setIsComputing(false);
      }
    }, 80);
  };

  // Re-run when config changes or ticker is clicked
  const handleConfigChange = (newConfig: PipelineConfig) => {
    setConfig(newConfig);
  };

  const tabs = [
    {
      id: 'visualization',
      label: 'Directional Movement Graph',
      icon: Activity,
      badge: 'Pred vs Actual',
    },
    {
      id: 'matrix',
      label: 'Performance Comparison Matrix',
      icon: Table,
      badge: '5 Models',
    },
    {
      id: 'audit',
      label: 'Leak-Free Target Proof',
      icon: ShieldCheck,
      badge: 'Shift Audit',
    },
    {
      id: 'diagnostics',
      label: 'Visual Diagnostics & Simulation',
      icon: LineChartIcon,
      badge: '$1.00 Equity',
    },
    {
      id: 'indicators',
      label: 'Technical Indicators',
      icon: Sliders,
      badge: 'Stationarity',
    },
    {
      id: 'methodology',
      label: 'Methodology & Takeaways',
      icon: BookOpen,
      badge: 'Research',
    },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Institutional Top Navbar */}
      <Header
        ticker={config.ticker}
        onRefresh={handleRunPipeline}
        isComputing={isComputing}
      />

      {/* Main App Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto">
        {/* Left Sidebar: Configurations & Hyperparameters */}
        <Sidebar
          config={config}
          onChangeConfig={handleConfigChange}
          onApply={handleRunPipeline}
          isComputing={isComputing}
        />

        {/* Right Content Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-x-hidden">
          {/* Top 4 Metric Cards */}
          <MetricCards result={pipelineResult} />

          {/* Tab Navigation */}
          <div className="border-b border-slate-800">
            <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-px" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`tab-btn-${tab.id}`}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`group inline-flex items-center gap-2 py-3 px-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap cursor-pointer transition ${
                      isActive
                        ? 'border-emerald-500 text-emerald-400 font-bold'
                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        isActive
                          ? 'text-emerald-400'
                          : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />
                    <span>{tab.label}</span>
                    <span
                      className={`hidden md:inline-block text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Active Tab Panel */}
          <div className="mt-4">
            {activeTab === 'visualization' && (
              <DirectionalVisualizationGraph result={pipelineResult} />
            )}

            {activeTab === 'matrix' && (
              <PerformanceMatrix evaluations={pipelineResult.evaluations} />
            )}

            {activeTab === 'audit' && (
              <LeakProofAudit auditRows={pipelineResult.auditRows} />
            )}

            {activeTab === 'diagnostics' && (
              <DiagnosticsView
                strategyCurve={pipelineResult.strategyCurve}
                featureImportances={pipelineResult.featureImportances}
                recentTestTimeline={pipelineResult.recentTestTimeline}
              />
            )}

            {activeTab === 'indicators' && (
              <TechnicalInspector processedData={pipelineResult.processedData} />
            )}

            {activeTab === 'methodology' && <MethodologyReport />}
          </div>
        </main>
      </div>
    </div>
  );
}
