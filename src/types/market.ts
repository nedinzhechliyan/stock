export interface RawBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ProcessedBar extends RawBar {
  ret_1d: number;
  ret_5d: number;
  hl_spread: number;
  oc_spread: number;
  rsi_14: number;
  macd: number;
  macd_hist: number;
  bb_pct_b: number;
  natr_14: number;
  vol_ratio_20: number;
  next_close: number;
  target: number; // 1 if next_close > close else 0
  today_direction: number; // 1 if close > close(t-1) else 0
}

export interface PipelineConfig {
  ticker: string;
  startDate: string;
  endDate: string;
  splitRatio: number; // e.g. 0.80
  rfEstimators: number; // e.g. 150
  rfMaxDepth: number; // e.g. 4
  cReg: number; // e.g. 0.1
}

export interface ConfusionMatrixData {
  tn: number;
  fp: number;
  fn: number;
  tp: number;
}

export interface ModelEvaluation {
  id: string;
  name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  rocAuc: number;
  isBaseline?: boolean;
  isEngineered?: boolean;
  predictions: number[];
  probabilities: number[];
  confusionMatrix: ConfusionMatrixData;
}

export interface StrategyPoint {
  date: string;
  benchmarkEquity: number;
  strategyEquity: number;
  strategyReturn: number;
  benchmarkReturn: number;
  predDirection: number;
  actualDirection: number;
  close: number;
}

export interface FeatureImportance {
  feature: string;
  displayName: string;
  category: 'Momentum' | 'Trend' | 'Volatility' | 'Volume' | 'Price Action';
  importance: number;
}

export interface PipelineResult {
  ticker: string;
  totalBars: number;
  trainBars: number;
  testBars: number;
  trainUpPct: number;
  testUpPct: number;
  trainStartDate: string;
  trainEndDate: string;
  testStartDate: string;
  testEndDate: string;
  evaluations: ModelEvaluation[];
  strategyCurve: StrategyPoint[];
  featureImportances: FeatureImportance[];
  auditRows: ProcessedBar[];
  recentTestTimeline: {
    date: string;
    actual: number;
    predicted: number;
    close: number;
  }[];
  processedData: ProcessedBar[];
}
