import { RawBar } from '../types/market';

// Deterministic Pseudo-Random Number Generator (Mulberry32) for reproducible data
function createRng(seed: number) {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Generates continuous trading days (skipping weekends) between start and end dates
export function generateCalibratedMarketData(
  ticker: string,
  startDateStr: string = '2018-01-01',
  endDateStr: string = '2024-01-01'
): RawBar[] {
  const seedMap: Record<string, { seed: number; basePrice: number; drift: number; vol: number; baseVol: number }> = {
    SPY: { seed: 104729, basePrice: 268.0, drift: 0.00038, vol: 0.0105, baseVol: 75000000 },
    QQQ: { seed: 384911, basePrice: 156.0, drift: 0.00055, vol: 0.0135, baseVol: 45000000 },
    AAPL: { seed: 928371, basePrice: 42.5, drift: 0.00062, vol: 0.0160, baseVol: 90000000 },
    MSFT: { seed: 541289, basePrice: 85.0, drift: 0.00058, vol: 0.0145, baseVol: 30000000 },
    NVDA: { seed: 719284, basePrice: 48.0, drift: 0.00095, vol: 0.0240, baseVol: 40000000 },
    TSLA: { seed: 284719, basePrice: 21.0, drift: 0.00085, vol: 0.0320, baseVol: 85000000 },
  };

  const config = seedMap[ticker.toUpperCase()] || {
    seed: 555555,
    basePrice: 150.0,
    drift: 0.0004,
    vol: 0.012,
    baseVol: 50000000,
  };

  const rng = createRng(config.seed);

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  const bars: RawBar[] = [];

  let currentPrice = config.basePrice;
  const curr = new Date(startDate);

  // Calibrate regime shocks (e.g. March 2020 pandemic volatility, 2022 inflation regime)
  while (curr <= endDate) {
    const dayOfWeek = curr.getDay();
    // 0 = Sun, 6 = Sat
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const year = curr.getFullYear();
      const month = curr.getMonth() + 1; // 1-12

      // Macro regime adjustment
      let regimeVol = config.vol;
      let regimeDrift = config.drift;

      // 2020 Q1 shock
      if (year === 2020 && (month === 2 || month === 3)) {
        regimeVol *= 2.8;
        regimeDrift = -0.004;
      } else if (year === 2020 && month >= 4) {
        regimeVol *= 1.4;
        regimeDrift = 0.0018;
      } else if (year === 2022) {
        regimeVol *= 1.35;
        regimeDrift = -0.0006;
      } else if (year === 2023) {
        regimeVol *= 0.95;
        regimeDrift = 0.0011;
      }

      // Box-Muller Gaussian
      const u1 = Math.max(1e-7, rng());
      const u2 = rng();
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

      const dailyReturn = regimeDrift + regimeVol * z;
      const prevClose = currentPrice;
      
      // Intraday variations
      const openShock = (rng() - 0.5) * 0.004;
      const open = Number((prevClose * (1 + openShock)).toFixed(2));
      
      const newClose = Math.max(1.0, Number((prevClose * (1 + dailyReturn)).toFixed(2)));
      currentPrice = newClose;

      const candleMin = Math.min(open, newClose);
      const candleMax = Math.max(open, newClose);

      const highWick = candleMax * (1 + Math.abs(rng()) * regimeVol * 0.85);
      const lowWick = candleMin * (1 - Math.abs(rng()) * regimeVol * 0.85);

      const high = Number(Math.max(open, newClose, highWick).toFixed(2));
      const low = Number(Math.min(open, newClose, lowWick).toFixed(2));

      // Volume with volatility correlation
      const volMultiplier = 0.65 + 0.7 * Math.abs(z) + rng() * 0.35;
      const volume = Math.round(config.baseVol * volMultiplier);

      const dateStr = curr.toISOString().split('T')[0];
      bars.push({
        date: dateStr,
        open,
        high,
        low,
        close: newClose,
        volume,
      });
    }

    curr.setDate(curr.getDate() + 1);
  }

  return bars;
}

export const AVAILABLE_TICKERS = [
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', category: 'Broad Index ETF' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust (Nasdaq 100)', category: 'Tech Index ETF' },
  { symbol: 'AAPL', name: 'Apple Inc.', category: 'Mega-Cap Tech' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', category: 'Enterprise Cloud/AI' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', category: 'Semiconductors/Compute' },
  { symbol: 'TSLA', name: 'Tesla, Inc.', category: 'Consumer Discretionary/EV' },
];
