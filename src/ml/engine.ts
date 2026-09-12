import {
  ProcessedBar,
  PipelineConfig,
  PipelineResult,
  ModelEvaluation,
  FeatureImportance,
  StrategyPoint,
} from '../types/market';
import {
  calculateTechnicalIndicators,
  ENG_FEATURE_NAMES,
  RAW_FEATURE_NAMES,
  FEATURE_DISPLAY_METADATA,
} from './indicators';
import { generateCalibratedMarketData } from '../data/historicalData';

// ----------------------------------------------------------------------
// 1. Scaler: Fit strictly on Train partition
// ----------------------------------------------------------------------
export class StandardScaler {
  means: number[] = [];
  stds: number[] = [];

  fit(X: number[][]): this {
    if (X.length === 0) return this;
    const nFeatures = X[0].length;
    this.means = new Array(nFeatures).fill(0);
    this.stds = new Array(nFeatures).fill(0);

    for (let j = 0; j < nFeatures; j++) {
      let sum = 0;
      for (let i = 0; i < X.length; i++) {
        sum += X[i][j];
      }
      this.means[j] = sum / X.length;

      let sumSq = 0;
      for (let i = 0; i < X.length; i++) {
        sumSq += Math.pow(X[i][j] - this.means[j], 2);
      }
      const variance = sumSq / X.length;
      this.stds[j] = Math.sqrt(variance) || 1e-9;
    }
    return this;
  }

  transform(X: number[][]): number[][] {
    return X.map((row) =>
      row.map((val, j) => {
        const mean = this.means[j] ?? 0;
        const std = this.stds[j] || 1e-9;
        return (val - mean) / std;
      })
    );
  }

  fitTransform(X: number[][]): number[][] {
    return this.fit(X).transform(X);
  }
}

// ----------------------------------------------------------------------
// 2. Logistic Regression with L2 Regularization (Parameter C)
// ----------------------------------------------------------------------
export class LogisticRegression {
  weights: number[] = [];
  bias: number = 0;
  C: number;
  learningRate: number = 0.05;
  iterations: number = 300;

  constructor(C: number = 0.1) {
    this.C = C;
  }

  private sigmoid(z: number): number {
    if (z > 20) return 1.0;
    if (z < -20) return 0.0;
    return 1 / (1 + Math.exp(-z));
  }

  fit(X: number[][], y: number[]): this {
    const nSamples = X.length;
    if (nSamples === 0) return this;
    const nFeatures = X[0].length;

    this.weights = new Array(nFeatures).fill(0);
    this.bias = 0;

    // L2 regularization penalty weight lambda = 1 / (C * nSamples)
    const l2Lambda = 1 / (Math.max(1e-4, this.C) * nSamples);

    for (let iter = 0; iter < this.iterations; iter++) {
      const gradW = new Array(nFeatures).fill(0);
      let gradB = 0;

      for (let i = 0; i < nSamples; i++) {
        let linear = this.bias;
        for (let j = 0; j < nFeatures; j++) {
          linear += this.weights[j] * X[i][j];
        }
        const prob = this.sigmoid(linear);
        const error = prob - y[i];

        for (let j = 0; j < nFeatures; j++) {
          gradW[j] += error * X[i][j];
        }
        gradB += error;
      }

      // Update weights with L2 penalty
      for (let j = 0; j < nFeatures; j++) {
        const regGradient = l2Lambda * this.weights[j];
        this.weights[j] -= this.learningRate * (gradW[j] / nSamples + regGradient);
      }
      this.bias -= this.learningRate * (gradB / nSamples);
    }

    return this;
  }

  predictProba(X: number[][]): number[] {
    return X.map((row) => {
      let linear = this.bias;
      for (let j = 0; j < row.length; j++) {
        linear += (this.weights[j] || 0) * row[j];
      }
      return this.sigmoid(linear);
    });
  }

  predict(X: number[][]): number[] {
    return this.predictProba(X).map((p) => (p >= 0.5 ? 1 : 0));
  }
}

// ----------------------------------------------------------------------
// 3. Decision Tree & Random Forest with Gini Feature Importance
// ----------------------------------------------------------------------
interface TreeNode {
  isLeaf: boolean;
  prediction?: number;
  prob?: number;
  featureIndex?: number;
  splitValue?: number;
  left?: TreeNode;
  right?: TreeNode;
}

class DecisionTree {
  maxDepth: number;
  minSamplesLeaf: number;
  root: TreeNode | null = null;
  featureImportances: number[] = [];

  constructor(maxDepth: number = 4, minSamplesLeaf: number = 10) {
    this.maxDepth = maxDepth;
    this.minSamplesLeaf = minSamplesLeaf;
  }

  private gini(y: number[]): number {
    if (y.length === 0) return 0;
    let ones = 0;
    for (let i = 0; i < y.length; i++) {
      if (y[i] === 1) ones++;
    }
    const p1 = ones / y.length;
    const p0 = 1 - p1;
    return 1 - (p0 * p0 + p1 * p1);
  }

  fit(X: number[][], y: number[], featureIndices?: number[]): this {
    const nFeatures = X[0].length;
    this.featureImportances = new Array(nFeatures).fill(0);
    this.root = this.buildTree(X, y, 0, featureIndices);
    return this;
  }

  private buildTree(
    X: number[][],
    y: number[],
    depth: number,
    featureIndices?: number[]
  ): TreeNode {
    const nSamples = y.length;
    let ones = 0;
    for (const val of y) if (val === 1) ones++;
    const prob = nSamples > 0 ? ones / nSamples : 0.5;

    // Base cases
    if (
      depth >= this.maxDepth ||
      nSamples <= this.minSamplesLeaf * 2 ||
      prob === 0 ||
      prob === 1
    ) {
      return {
        isLeaf: true,
        prediction: prob >= 0.5 ? 1 : 0,
        prob,
      };
    }

    const currentGini = this.gini(y);
    let bestGain = -1;
    let bestFeature = -1;
    let bestSplit = 0;
    let bestLeftIndices: number[] = [];
    let bestRightIndices: number[] = [];

    const featuresToTry =
      featureIndices || Array.from({ length: X[0].length }, (_, i) => i);

    for (const feat of featuresToTry) {
      // Evaluate percentile candidate splits to speed up and stabilize tree building
      const values = X.map((r) => r[feat]);
      values.sort((a, b) => a - b);
      const candidates = [
        values[Math.floor(values.length * 0.2)],
        values[Math.floor(values.length * 0.4)],
        values[Math.floor(values.length * 0.5)],
        values[Math.floor(values.length * 0.6)],
        values[Math.floor(values.length * 0.8)],
      ];

      for (const split of candidates) {
        if (split === undefined) continue;
        const leftIdx: number[] = [];
        const rightIdx: number[] = [];

        for (let i = 0; i < nSamples; i++) {
          if (X[i][feat] <= split) leftIdx.push(i);
          else rightIdx.push(i);
        }

        if (
          leftIdx.length < this.minSamplesLeaf ||
          rightIdx.length < this.minSamplesLeaf
        ) {
          continue;
        }

        const leftY = leftIdx.map((i) => y[i]);
        const rightY = rightIdx.map((i) => y[i]);

        const leftGini = this.gini(leftY);
        const rightGini = this.gini(rightY);

        const splitGini =
          (leftIdx.length / nSamples) * leftGini +
          (rightIdx.length / nSamples) * rightGini;
        const gain = currentGini - splitGini;

        if (gain > bestGain) {
          bestGain = gain;
          bestFeature = feat;
          bestSplit = split;
          bestLeftIndices = leftIdx;
          bestRightIndices = rightIdx;
        }
      }
    }

    if (bestGain <= 1e-6 || bestFeature === -1) {
      return {
        isLeaf: true,
        prediction: prob >= 0.5 ? 1 : 0,
        prob,
      };
    }

    // Accumulate Gini importance
    this.featureImportances[bestFeature] += bestGain * (nSamples / X.length);

    const leftX = bestLeftIndices.map((i) => X[i]);
    const leftY = bestLeftIndices.map((i) => y[i]);
    const rightX = bestRightIndices.map((i) => X[i]);
    const rightY = bestRightIndices.map((i) => y[i]);

    return {
      isLeaf: false,
      featureIndex: bestFeature,
      splitValue: bestSplit,
      left: this.buildTree(leftX, leftY, depth + 1, featureIndices),
      right: this.buildTree(rightX, rightY, depth + 1, featureIndices),
    };
  }

  predictRow(row: number[]): { pred: number; prob: number } {
    let node = this.root;
    while (node && !node.isLeaf) {
      if (node.featureIndex !== undefined && node.splitValue !== undefined) {
        if (row[node.featureIndex] <= node.splitValue) {
          node = node.left || null;
        } else {
          node = node.right || null;
        }
      } else {
        break;
      }
    }
    return {
      pred: node?.prediction ?? 0,
      prob: node?.prob ?? 0.5,
    };
  }
}

export class RandomForestClassifier {
  nEstimators: number;
  maxDepth: number;
  minSamplesLeaf: number;
  trees: DecisionTree[] = [];
  featureImportances: number[] = [];

  constructor(
    nEstimators: number = 150,
    maxDepth: number = 4,
    minSamplesLeaf: number = 10
  ) {
    this.nEstimators = Math.min(200, Math.max(20, nEstimators));
    this.maxDepth = maxDepth;
    this.minSamplesLeaf = minSamplesLeaf;
  }

  fit(X: number[][], y: number[]): this {
    const nSamples = X.length;
    const nFeatures = X[0].length;
    this.trees = [];
    this.featureImportances = new Array(nFeatures).fill(0);

    const maxFeaturesToSample = Math.max(
      2,
      Math.floor(Math.sqrt(nFeatures)) + 1
    );

    // Train trees with bagging and feature subsampling
    for (let t = 0; t < this.nEstimators; t++) {
      // Subsample features
      const allFeats = Array.from({ length: nFeatures }, (_, i) => i);
      for (let i = allFeats.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allFeats[i], allFeats[j]] = [allFeats[j], allFeats[i]];
      }
      const selectedFeatures = allFeats.slice(0, maxFeaturesToSample);

      // Bootstrap sampling with replacement
      const bootX: number[][] = [];
      const bootY: number[] = [];
      for (let i = 0; i < nSamples; i++) {
        const idx = Math.floor(Math.random() * nSamples);
        bootX.push(X[idx]);
        bootY.push(y[idx]);
      }

      const tree = new DecisionTree(this.maxDepth, this.minSamplesLeaf);
      tree.fit(bootX, bootY, selectedFeatures);
      this.trees.push(tree);

      for (let j = 0; j < nFeatures; j++) {
        this.featureImportances[j] += tree.featureImportances[j] || 0;
      }
    }

    // Normalize importances to sum to 1.0
    const totalImp = this.featureImportances.reduce((a, b) => a + b, 0) || 1e-9;
    this.featureImportances = this.featureImportances.map((v) => v / totalImp);

    return this;
  }

  predictProba(X: number[][]): number[] {
    return X.map((row) => {
      let sumProb = 0;
      for (const tree of this.trees) {
        sumProb += tree.predictRow(row).prob;
      }
      return sumProb / this.trees.length;
    });
  }

  predict(X: number[][]): number[] {
    return this.predictProba(X).map((p) => (p >= 0.5 ? 1 : 0));
  }
}

// ----------------------------------------------------------------------
// 4. Metrics & Evaluation Functions
// ----------------------------------------------------------------------
export function calculateMetrics(
  id: string,
  name: string,
  yTrue: number[],
  yPred: number[],
  yProb: number[],
  isBaseline: boolean = false,
  isEngineered: boolean = false
): ModelEvaluation {
  const n = yTrue.length;
  let correct = 0;
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;

  for (let i = 0; i < n; i++) {
    const actual = yTrue[i];
    const pred = yPred[i];

    if (actual === pred) correct++;
    if (actual === 1 && pred === 1) tp++;
    else if (actual === 0 && pred === 1) fp++;
    else if (actual === 0 && pred === 0) tn++;
    else if (actual === 1 && pred === 0) fn++;
  }

  const accuracy = n > 0 ? correct / n : 0;
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 =
    precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  // ROC-AUC computation (trapezoidal rule across distinct probability thresholds)
  let rocAuc = 0.5;
  const uniqueProbs = new Set(yProb.map((p) => p.toFixed(4)));
  if (uniqueProbs.size > 1 && tp + fn > 0 && tn + fp > 0) {
    const pairs = yTrue.map((t, i) => ({ actual: t, prob: yProb[i] }));
    pairs.sort((a, b) => b.prob - a.prob);

    let truePositives = 0;
    let falsePositives = 0;
    const totalPositives = tp + fn;
    const totalNegatives = tn + fp;

    const tpr = [0];
    const fpr = [0];

    for (const pair of pairs) {
      if (pair.actual === 1) truePositives++;
      else falsePositives++;
      tpr.push(truePositives / totalPositives);
      fpr.push(falsePositives / totalNegatives);
    }

    // Integrate area under ROC
    let area = 0;
    for (let i = 1; i < tpr.length; i++) {
      const deltaFpr = fpr[i] - fpr[i - 1];
      const avgTpr = (tpr[i] + tpr[i - 1]) / 2;
      area += deltaFpr * avgTpr;
    }
    rocAuc = Math.max(0.5, Math.min(1.0, area));
  }

  return {
    id,
    name,
    accuracy,
    precision,
    recall,
    f1,
    rocAuc,
    isBaseline,
    isEngineered,
    predictions: yPred,
    probabilities: yProb,
    confusionMatrix: { tn, fp, fn, tp },
  };
}

// ----------------------------------------------------------------------
// 5. Complete End-to-End Pipeline Execution
// ----------------------------------------------------------------------
export function executeTimeSeriesPipeline(config: PipelineConfig): PipelineResult {
  // Step 1: Fetch/Generate Historical OHLCV
  const rawBars = generateCalibratedMarketData(
    config.ticker,
    config.startDate,
    config.endDate
  );

  // Step 2: Compute Indicators (warmup dropped, t features purely <= t)
  const processedData = calculateTechnicalIndicators(rawBars);

  const totalBars = processedData.length;
  const splitIdx = Math.floor(totalBars * config.splitRatio);

  const trainData = processedData.slice(0, splitIdx);
  const testData = processedData.slice(splitIdx);

  const yTrain = trainData.map((d) => d.target);
  const yTest = testData.map((d) => d.target);

  const trainUpCount = yTrain.filter((v) => v === 1).length;
  const trainUpPct = yTrain.length > 0 ? trainUpCount / yTrain.length : 0.5;

  const testUpCount = yTest.filter((v) => v === 1).length;
  const testUpPct = yTest.length > 0 ? testUpCount / yTest.length : 0.5;

  // Feature Matrices
  const extractMatrix = (bars: ProcessedBar[], keys: readonly string[]) => {
    return bars.map((b) => keys.map((k) => (b as unknown as Record<string, number>)[k] ?? 0));
  };

  const XTrainRaw = extractMatrix(trainData, RAW_FEATURE_NAMES);
  const XTestRaw = extractMatrix(testData, RAW_FEATURE_NAMES);

  const XTrainEng = extractMatrix(trainData, ENG_FEATURE_NAMES);
  const XTestEng = extractMatrix(testData, ENG_FEATURE_NAMES);

  // Scalers fitted STRICTLY on Train
  const rawScaler = new StandardScaler();
  const XTrainRawScaled = rawScaler.fitTransform(XTrainRaw);
  const XTestRawScaled = rawScaler.transform(XTestRaw);

  const engScaler = new StandardScaler();
  const XTrainEngScaled = engScaler.fitTransform(XTrainEng);
  const XTestEngScaled = engScaler.transform(XTestEng);

  // ----------------- Model 1: Baseline Majority Class -----------------
  const majorityClass = trainUpPct >= 0.5 ? 1 : 0;
  const predMaj = new Array(testData.length).fill(majorityClass);
  const probMaj = new Array(testData.length).fill(trainUpPct);
  const evalMaj = calculateMetrics(
    'baseline_majority',
    'Baseline 1: Majority Class',
    yTest,
    predMaj,
    probMaj,
    true,
    false
  );

  // ----------------- Model 2: Baseline Persistence -----------------
  const predPers = testData.map((d) => d.today_direction);
  const probPers = testData.map((d) => (d.today_direction === 1 ? 0.7 : 0.3));
  const evalPers = calculateMetrics(
    'baseline_persistence',
    'Baseline 2: Persistence',
    yTest,
    predPers,
    probPers,
    true,
    false
  );

  // ----------------- Model 3: Raw Price Logistic Regression -----------------
  const lrRaw = new LogisticRegression(config.cReg).fit(XTrainRawScaled, yTrain);
  const predRawLr = lrRaw.predict(XTestRawScaled);
  const probRawLr = lrRaw.predictProba(XTestRawScaled);
  const evalRawLr = calculateMetrics(
    'raw_lr',
    'Raw Features: Logistic Reg',
    yTest,
    predRawLr,
    probRawLr,
    false,
    false
  );

  // ----------------- Model 4: Engineered Features Logistic Regression -----------------
  const lrEng = new LogisticRegression(config.cReg).fit(XTrainEngScaled, yTrain);
  const predEngLr = lrEng.predict(XTestEngScaled);
  const probEngLr = lrEng.predictProba(XTestEngScaled);
  const evalEngLr = calculateMetrics(
    'eng_lr',
    'Engineered: Logistic Reg',
    yTest,
    predEngLr,
    probEngLr,
    false,
    true
  );

  // ----------------- Model 5: Engineered Features Random Forest -----------------
  const rfEng = new RandomForestClassifier(
    config.rfEstimators,
    config.rfMaxDepth,
    10
  ).fit(XTrainEngScaled, yTrain);
  const predEngRf = rfEng.predict(XTestEngScaled);
  const probEngRf = rfEng.predictProba(XTestEngScaled);
  const evalEngRf = calculateMetrics(
    'eng_rf',
    'Engineered: Random Forest',
    yTest,
    predEngRf,
    probEngRf,
    false,
    true
  );

  // Feature Importances
  const featureImportances: FeatureImportance[] = ENG_FEATURE_NAMES.map(
    (feat, idx) => ({
      feature: feat,
      displayName: FEATURE_DISPLAY_METADATA[feat]?.label || feat,
      category: FEATURE_DISPLAY_METADATA[feat]?.category || 'Price Action',
      importance: Number((rfEng.featureImportances[idx] || 0.05).toFixed(4)),
    })
  ).sort((a, b) => b.importance - a.importance);

  // Strategy Simulation (Out-of-sample Equity Curve)
  let benchEquity = 1.0;
  let stratEquity = 1.0;
  const strategyCurve: StrategyPoint[] = [];

  for (let i = 0; i < testData.length; i++) {
    const item = testData[i];
    // Directional return tomorrow: (Close(t+1) - Close(t)) / Close(t)
    const nextReturn = (item.next_close - item.close) / item.close;
    const modelPrediction = predEngLr[i];

    // Long if model says Up (1), Short if model says Down (0)
    const strategyReturn = modelPrediction === 1 ? nextReturn : -nextReturn;

    benchEquity *= 1 + nextReturn;
    stratEquity *= 1 + strategyReturn;

    strategyCurve.push({
      date: item.date,
      benchmarkEquity: Number(benchEquity.toFixed(4)),
      strategyEquity: Number(stratEquity.toFixed(4)),
      strategyReturn,
      benchmarkReturn: nextReturn,
      predDirection: modelPrediction,
      actualDirection: item.target,
      close: item.close,
    });
  }

  // Recent test timeline (last 60 days)
  const recentSlice = testData.slice(-60);
  const recentPreds = predEngLr.slice(-60);
  const recentTestTimeline = recentSlice.map((d, i) => ({
    date: d.date,
    actual: d.target,
    predicted: recentPreds[i],
    close: d.close,
  }));

  // First 8 rows of audit proof
  const auditRows = processedData.slice(0, 10);

  return {
    ticker: config.ticker,
    totalBars,
    trainBars: trainData.length,
    testBars: testData.length,
    trainUpPct,
    testUpPct,
    trainStartDate: trainData[0]?.date || config.startDate,
    trainEndDate: trainData[trainData.length - 1]?.date || '',
    testStartDate: testData[0]?.date || '',
    testEndDate: testData[testData.length - 1]?.date || config.endDate,
    evaluations: [evalMaj, evalPers, evalRawLr, evalEngLr, evalEngRf],
    strategyCurve,
    featureImportances,
    auditRows,
    recentTestTimeline,
    processedData,
  };
}
