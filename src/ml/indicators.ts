import { RawBar, ProcessedBar } from '../types/market';

/**
 * Technical Indicator Engineering Engine
 * Adheres strictly to the pandas implementation from the model_pipeline specification.
 * All indicators at time t are computed exclusively using data <= t.
 */
export function calculateTechnicalIndicators(rawBars: RawBar[]): ProcessedBar[] {
  const n = rawBars.length;
  if (n < 30) return [];

  // Intermediate arrays for exponential moving averages
  const ema12: number[] = new Array(n).fill(0);
  const ema26: number[] = new Array(n).fill(0);
  const alpha12 = 2 / (12 + 1);
  const alpha26 = 2 / (26 + 1);

  // EMA 12 and EMA 26 initialization
  ema12[0] = rawBars[0].close;
  ema26[0] = rawBars[0].close;
  for (let i = 1; i < n; i++) {
    ema12[i] = alpha12 * rawBars[i].close + (1 - alpha12) * ema12[i - 1];
    ema26[i] = alpha26 * rawBars[i].close + (1 - alpha26) * ema26[i - 1];
  }

  // MACD line and Signal line (span 9)
  const macdLine: number[] = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    macdLine[i] = ema12[i] - ema26[i];
  }

  const macdSignal: number[] = new Array(n).fill(0);
  const alpha9 = 2 / (9 + 1);
  macdSignal[0] = macdLine[0];
  for (let i = 1; i < n; i++) {
    macdSignal[i] = alpha9 * macdLine[i] + (1 - alpha9) * macdSignal[i - 1];
  }

  // True Range for ATR
  const tr: number[] = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    if (i === 0) {
      tr[i] = rawBars[i].high - rawBars[i].low;
    } else {
      const tr1 = rawBars[i].high - rawBars[i].low;
      const tr2 = Math.abs(rawBars[i].high - rawBars[i - 1].close);
      const tr3 = Math.abs(rawBars[i].low - rawBars[i - 1].close);
      tr[i] = Math.max(tr1, tr2, tr3);
    }
  }

  const processed: ProcessedBar[] = [];

  // Start after warmup period (e.g. index 26) up to n - 2 (dropping the last row where next_close is unknown)
  const warmup = 26;

  for (let i = warmup; i < n - 1; i++) {
    const curr = rawBars[i];
    const prev = rawBars[i - 1];
    const next = rawBars[i + 1];

    // 1. Price Momentum / Returns
    const ret_1d = (curr.close - prev.close) / prev.close;
    const ret_5d = (curr.close - rawBars[i - 5].close) / rawBars[i - 5].close;
    const hl_spread = (curr.high - curr.low) / curr.close;
    const oc_spread = (curr.close - curr.open) / (curr.open || 1e-9);

    // 2. Relative Strength Index (RSI 14)
    let gainSum = 0;
    let lossSum = 0;
    for (let k = i - 13; k <= i; k++) {
      const d = rawBars[k].close - rawBars[k - 1].close;
      if (d > 0) gainSum += d;
      else lossSum += Math.abs(d);
    }
    const gainMean = gainSum / 14;
    const lossMean = lossSum / 14;
    const rs = gainMean / (lossMean + 1e-9);
    const rsi_14 = 100 - 100 / (1 + rs);

    // 3. Normalized MACD & Histogram
    const macd = macdLine[i] / curr.close;
    const macd_hist = (macdLine[i] - macdSignal[i]) / curr.close;

    // 4. Bollinger Bands %B (20-day window, 2 std dev)
    let sumClose20 = 0;
    for (let k = i - 19; k <= i; k++) {
      sumClose20 += rawBars[k].close;
    }
    const bb_mean = sumClose20 / 20;
    let sumSqDiff = 0;
    for (let k = i - 19; k <= i; k++) {
      sumSqDiff += Math.pow(rawBars[k].close - bb_mean, 2);
    }
    const bb_std = Math.sqrt(sumSqDiff / 20);
    const bb_upper = bb_mean + 2 * bb_std;
    const bb_lower = bb_mean - 2 * bb_std;
    const bb_pct_b = (curr.close - bb_lower) / (bb_upper - bb_lower + 1e-9);

    // 5. Normalized Average True Range (ATR 14)
    let sumTr14 = 0;
    for (let k = i - 13; k <= i; k++) {
      sumTr14 += tr[k];
    }
    const atr14 = sumTr14 / 14;
    const natr_14 = (atr14 / curr.close) * 100;

    // 6. Volume Ratio (vs 20-day SMA)
    let sumVol20 = 0;
    for (let k = i - 19; k <= i; k++) {
      sumVol20 += rawBars[k].volume;
    }
    const avgVol20 = sumVol20 / 20;
    const vol_ratio_20 = curr.volume / (avgVol20 + 1e-9);

    // Zero-Leakage Target: Will Close(t+1) > Close(t)?
    const next_close = next.close;
    const target = next_close > curr.close ? 1 : 0;

    // Today direction (persistence baseline)
    const today_direction = curr.close > prev.close ? 1 : 0;

    processed.push({
      ...curr,
      ret_1d,
      ret_5d,
      hl_spread,
      oc_spread,
      rsi_14,
      macd,
      macd_hist,
      bb_pct_b,
      natr_14,
      vol_ratio_20,
      next_close,
      target,
      today_direction,
    });
  }

  return processed;
}

export const RAW_FEATURE_NAMES = ['open', 'high', 'low', 'close', 'volume'] as const;
export const ENG_FEATURE_NAMES = [
  'ret_1d',
  'ret_5d',
  'hl_spread',
  'oc_spread',
  'rsi_14',
  'macd',
  'macd_hist',
  'bb_pct_b',
  'natr_14',
  'vol_ratio_20',
] as const;

export const FEATURE_DISPLAY_METADATA: Record<
  string,
  { label: string; category: 'Momentum' | 'Trend' | 'Volatility' | 'Volume' | 'Price Action'; description: string }
> = {
  ret_1d: { label: '1-Day Return', category: 'Momentum', description: 'Percentage price change over 1 session' },
  ret_5d: { label: '5-Day Return', category: 'Momentum', description: 'Weekly rolling momentum drift' },
  hl_spread: { label: 'High-Low Spread', category: 'Volatility', description: 'Intraday price range normalized by close' },
  oc_spread: { label: 'Open-Close Spread', category: 'Price Action', description: 'Directional intraday body relative to open' },
  rsi_14: { label: 'RSI (14-Period)', category: 'Momentum', description: 'Relative Strength Index bounded [0, 100]' },
  macd: { label: 'Normalized MACD', category: 'Trend', description: '(EMA12 - EMA26) normalized by current close' },
  macd_hist: { label: 'MACD Histogram', category: 'Trend', description: 'Distance between MACD line and 9-day signal' },
  bb_pct_b: { label: 'Bollinger %B', category: 'Volatility', description: 'Position within 2-sigma 20-day bands' },
  natr_14: { label: 'Normalized ATR (14)', category: 'Volatility', description: 'Average true range as percentage of price' },
  vol_ratio_20: { label: 'Volume Ratio (20d)', category: 'Volume', description: 'Current volume relative to 20-day SMA' },
};
