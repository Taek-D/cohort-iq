// abTestSimulation.js — A/B Test Power Analysis & Retention Simulation
// Normal CDF/PPF, sample size calculation, retention simulation — no external dependencies

import { estimateDecayRate, calculateCohortLTV } from './ltvPrediction.js';

/**
 * Standard Normal CDF — Abramowitz & Stegun approximation (26.2.17)
 * @param {number} x
 * @returns {number} Phi(x), error < 1.5e-7
 */
export function normalCDF(x) {
  if (x === 0) return 0.5;
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);

  const b1 = 0.319381530;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const p = 0.2316419;

  const t = 1.0 / (1.0 + p * ax);
  const t2 = t * t;
  const t3 = t2 * t;
  const t4 = t3 * t;
  const t5 = t4 * t;

  const phi = Math.exp(-0.5 * ax * ax) / Math.sqrt(2 * Math.PI);
  const cdf = 1.0 - phi * (b1 * t + b2 * t2 + b3 * t3 + b4 * t4 + b5 * t5);

  return sign === 1 ? cdf : 1.0 - cdf;
}

/**
 * Inverse Standard Normal (PPF) — Rational Approximation (Peter Acklam)
 * @param {number} p — probability (0 < p < 1)
 * @returns {number} Phi^{-1}(p), error < 1.15e-9
 */
export function normalPPF(p) {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p === 0.5) return 0;

  const a1 = -3.969683028665376e1;
  const a2 = 2.209460984245205e2;
  const a3 = -2.759285104469687e2;
  const a4 = 1.383577518672690e2;
  const a5 = -3.066479806614716e1;
  const a6 = 2.506628277459239e0;

  const b1 = -5.447609879822406e1;
  const b2 = 1.615858368580409e2;
  const b3 = -1.556989798598866e2;
  const b4 = 6.680131188771972e1;
  const b5 = -1.328068155288572e1;

  const c1 = -7.784894002430293e-3;
  const c2 = -3.223964580411365e-1;
  const c3 = -2.400758277161838e0;
  const c4 = -2.549732539343734e0;
  const c5 = 4.374664141464968e0;
  const c6 = 2.938163982698783e0;

  const d1 = 7.784695709041462e-3;
  const d2 = 3.224671290700398e-1;
  const d3 = 2.445134137142996e0;
  const d4 = 3.754408661907416e0;

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  let q, r;

  if (p < pLow) {
    // Lower tail
    q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
      ((((d1 * q + d2) * q + d3) * q + d4) * q + 1)
    );
  } else if (p <= pHigh) {
    // Central region
    q = p - 0.5;
    r = q * q;
    return (
      ((((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q) /
      (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1)
    );
  } else {
    // Upper tail
    q = Math.sqrt(-2 * Math.log(1 - p));
    return (
      -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
      ((((d1 * q + d2) * q + d3) * q + d4) * q + 1)
    );
  }
}

/**
 * Required sample size per group for two-proportion z-test.
 * N = ((z_{alpha/2} + z_beta)^2 * (p1(1-p1) + p2(1-p2))) / (p2 - p1)^2
 *
 * @param {Object} params
 * @param {number} params.baselineRate — current retention (0-1 scale)
 * @param {number} params.mde — minimum detectable effect (absolute, e.g. 0.10)
 * @param {number} [params.alpha=0.05]
 * @param {number} [params.power=0.80]
 * @returns {{ sampleSize: number, treatmentRate: number, effectSize: number }}
 */
export function requiredSampleSize(params) {
  const { baselineRate, mde, alpha = 0.05, power = 0.80 } = params;

  if (!mde || mde <= 0) {
    return { sampleSize: Infinity, treatmentRate: baselineRate, effectSize: 0 };
  }

  const p1 = baselineRate;
  const p2 = Math.min(1, baselineRate + mde);
  const diff = p2 - p1;

  if (diff <= 0) {
    return { sampleSize: Infinity, treatmentRate: p2, effectSize: 0 };
  }

  const zAlpha = normalPPF(1 - alpha / 2);
  const zBeta = normalPPF(power);

  const variance = p1 * (1 - p1) + p2 * (1 - p2);
  const n = Math.ceil(((zAlpha + zBeta) ** 2 * variance) / (diff ** 2));

  return {
    sampleSize: n,
    treatmentRate: p2,
    effectSize: diff,
  };
}

/**
 * Calculate power for a given sample size.
 *
 * @param {Object} params
 * @param {number} params.baselineRate
 * @param {number} params.mde
 * @param {number} params.sampleSize — per group
 * @param {number} [params.alpha=0.05]
 * @returns {number} power (0-1)
 */
export function calculatePower(params) {
  const { baselineRate, mde, sampleSize, alpha = 0.05 } = params;

  if (!mde || mde <= 0 || sampleSize <= 0) return 0;

  const p1 = baselineRate;
  const p2 = Math.min(1, baselineRate + mde);
  const diff = p2 - p1;

  if (diff <= 0) return 0;

  const zAlpha = normalPPF(1 - alpha / 2);
  const se = Math.sqrt((p1 * (1 - p1) + p2 * (1 - p2)) / sampleSize);

  if (se <= 0) return 1;

  const zStat = diff / se - zAlpha;
  return normalCDF(zStat);
}

/**
 * Simulate retention curve with improvement at target week + exponential decay propagation.
 *
 * @param {Object} params
 * @param {Array<{week: number, retention: number}>} params.retentionCurve — 0-100 scale
 * @param {number} params.targetWeek
 * @param {number} params.delta — %p (e.g. 10)
 * @param {number} [params.decayRate=0.5]
 * @returns {Array<{week: number, retention: number}>} simulated curve (0-100 scale)
 */
export function simulateRetention(params) {
  const { retentionCurve, targetWeek, delta, decayRate = 0.5 } = params;

  if (!retentionCurve || retentionCurve.length === 0) return [];

  return retentionCurve.map((point) => {
    if (point.week < targetWeek) {
      return { ...point };
    }

    const weekDiff = point.week - targetWeek;
    const effect = delta * Math.exp(-decayRate * weekDiff);
    const newRetention = Math.min(100, Math.max(0, point.retention + effect));

    return {
      week: point.week,
      retention: Math.round(newRetention * 100) / 100,
    };
  });
}

/**
 * Generate power curve data points for visualization.
 * @param {number} baselineRate
 * @param {number} mde
 * @param {number} alpha
 * @returns {Array<{n: number, power: number}>}
 */
function generatePowerCurve(baselineRate, mde, alpha) {
  const points = [];
  const nValues = [
    10, 20, 30, 50, 75, 100, 150, 200, 300, 400, 500, 750, 1000, 1500, 2000,
  ];

  for (const n of nValues) {
    const pw = calculatePower({ baselineRate, mde, sampleSize: n, alpha });
    points.push({ n, power: Math.round(pw * 1000) / 1000 });
  }

  return points;
}

/**
 * Run full A/B test simulation.
 *
 * @param {Object} params
 * @param {Array<{week: number, retention: number}>} params.retentionCurve — average retention (0-100)
 * @param {number} params.targetWeek
 * @param {number} params.delta — %p
 * @param {number} [params.alpha=0.05]
 * @param {number} [params.power=0.80]
 * @param {number} [params.arpu=1]
 * @param {number} [params.decayRate=0.5]
 * @returns {Object} ABTestResult
 */
export function runABTestSimulation(params) {
  const {
    retentionCurve,
    targetWeek,
    delta,
    alpha = 0.05,
    power = 0.80,
    arpu = 1,
    decayRate = 0.5,
  } = params;

  if (!retentionCurve || retentionCurve.length === 0) {
    return null;
  }

  // Find baseline rate at target week
  const targetPoint = retentionCurve.find((p) => p.week === targetWeek);
  const baselineRate = targetPoint ? targetPoint.retention / 100 : 0.5;
  const mde = delta / 100;

  // Power Analysis
  const sampleResult = requiredSampleSize({
    baselineRate,
    mde,
    alpha,
    power,
  });

  const powerCurve = generatePowerCurve(baselineRate, mde, alpha);

  const powerAnalysis = {
    sampleSize: sampleResult.sampleSize,
    totalSampleSize: sampleResult.sampleSize * 2,
    mde,
    baselineRate,
    treatmentRate: sampleResult.treatmentRate,
    alpha,
    power,
    powerCurve,
  };

  // Retention Simulation
  const control = retentionCurve.map((p) => ({ ...p }));
  const treatment = simulateRetention({
    retentionCurve,
    targetWeek,
    delta,
    decayRate,
  });

  const retention = { control, treatment, targetWeek, delta };

  // LTV Impact
  const controlLTV = calculateCohortLTV(control, arpu).projectedLTV;
  const treatmentLTV = calculateCohortLTV(treatment, arpu).projectedLTV;
  const ltvDelta = Math.round((treatmentLTV - controlLTV) * 100) / 100;
  const ltvDeltaPct =
    controlLTV > 0
      ? Math.round(((treatmentLTV - controlLTV) / controlLTV) * 10000) / 100
      : 0;

  const monthlyRevenueImpact = Math.round(ltvDelta * 1000);

  const ltvImpact = {
    controlLTV,
    treatmentLTV,
    ltvDelta,
    ltvDeltaPct,
    monthlyRevenueImpact,
  };

  // Scenario Comparison
  const scenarioFactors = [
    { name: 'abtest.conservative', factor: 0.5 },
    { name: 'abtest.baseline', factor: 1.0 },
    { name: 'abtest.aggressive', factor: 1.5 },
    { name: 'abtest.optimal', factor: 2.0 },
  ];

  const scenarios = scenarioFactors.map((sf) => {
    const sDelta = delta * sf.factor;
    const sMde = sDelta / 100;
    const sSample = requiredSampleSize({
      baselineRate,
      mde: sMde,
      alpha,
      power,
    });
    const sTreatment = simulateRetention({
      retentionCurve,
      targetWeek,
      delta: sDelta,
      decayRate,
    });
    const sLTV = calculateCohortLTV(sTreatment, arpu).projectedLTV;
    const sLtvDelta = Math.round((sLTV - controlLTV) * 100) / 100;

    return {
      name: sf.name,
      delta: sDelta,
      sampleSize: sSample.sampleSize,
      ltvDelta: sLtvDelta,
      monthlyROI: Math.round(sLtvDelta * 1000),
    };
  });

  return { powerAnalysis, retention, ltvImpact, scenarios };
}
