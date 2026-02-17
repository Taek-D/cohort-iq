import { describe, it, expect } from 'vitest';
import {
  normalCDF,
  normalPPF,
  requiredSampleSize,
  calculatePower,
  simulateRetention,
  runABTestSimulation,
} from './abTestSimulation.js';

describe('normalCDF', () => {
  it('Phi(0) = 0.5', () => {
    expect(normalCDF(0)).toBe(0.5);
  });

  it('Phi(-6) is near 0', () => {
    expect(normalCDF(-6)).toBeLessThan(1e-6);
  });

  it('Phi(6) is near 1', () => {
    expect(normalCDF(6)).toBeGreaterThan(1 - 1e-6);
  });

  it('Phi(1.96) approx 0.975', () => {
    expect(normalCDF(1.96)).toBeCloseTo(0.97500, 3);
  });

  it('Phi(-1.96) approx 0.025', () => {
    expect(normalCDF(-1.96)).toBeCloseTo(0.02500, 3);
  });

  it('symmetry: Phi(x) + Phi(-x) = 1', () => {
    for (const x of [0.5, 1.0, 2.0, 3.0]) {
      expect(normalCDF(x) + normalCDF(-x)).toBeCloseTo(1, 10);
    }
  });
});

describe('normalPPF', () => {
  it('PPF(0.5) = 0', () => {
    expect(normalPPF(0.5)).toBe(0);
  });

  it('PPF(0.975) approx 1.96', () => {
    expect(normalPPF(0.975)).toBeCloseTo(1.96, 2);
  });

  it('PPF(0.025) approx -1.96', () => {
    expect(normalPPF(0.025)).toBeCloseTo(-1.96, 2);
  });

  it('roundtrip: normalCDF(normalPPF(p)) approx p', () => {
    for (const p of [0.1, 0.25, 0.5, 0.75, 0.9, 0.95, 0.99]) {
      expect(normalCDF(normalPPF(p))).toBeCloseTo(p, 6);
    }
  });
});

describe('requiredSampleSize', () => {
  it('baseline=0.35, mde=0.10 returns ~373/group', () => {
    const result = requiredSampleSize({
      baselineRate: 0.35,
      mde: 0.10,
    });
    // Unpooled two-proportion formula: N = ((z_a/2 + z_b)^2 * (p1(1-p1)+p2(1-p2))) / delta^2
    expect(result.sampleSize).toBeGreaterThan(350);
    expect(result.sampleSize).toBeLessThan(400);
    expect(result.treatmentRate).toBeCloseTo(0.45, 4);
  });

  it('larger mde requires smaller N', () => {
    const small = requiredSampleSize({ baselineRate: 0.35, mde: 0.05 });
    const large = requiredSampleSize({ baselineRate: 0.35, mde: 0.20 });
    expect(large.sampleSize).toBeLessThan(small.sampleSize);
  });

  it('higher power requires larger N', () => {
    const low = requiredSampleSize({
      baselineRate: 0.35,
      mde: 0.10,
      power: 0.70,
    });
    const high = requiredSampleSize({
      baselineRate: 0.35,
      mde: 0.10,
      power: 0.95,
    });
    expect(high.sampleSize).toBeGreaterThan(low.sampleSize);
  });

  it('mde=0 returns Infinity', () => {
    const result = requiredSampleSize({ baselineRate: 0.35, mde: 0 });
    expect(result.sampleSize).toBe(Infinity);
  });
});

describe('calculatePower', () => {
  it('N=373, baseline=0.35, mde=0.10 gives power near 0.80', () => {
    const pw = calculatePower({
      baselineRate: 0.35,
      mde: 0.10,
      sampleSize: 373,
    });
    expect(pw).toBeGreaterThan(0.78);
    expect(pw).toBeLessThan(0.85);
  });

  it('larger N gives higher power', () => {
    const pw100 = calculatePower({
      baselineRate: 0.35,
      mde: 0.10,
      sampleSize: 100,
    });
    const pw500 = calculatePower({
      baselineRate: 0.35,
      mde: 0.10,
      sampleSize: 500,
    });
    expect(pw500).toBeGreaterThan(pw100);
  });
});

describe('simulateRetention', () => {
  const curve = [
    { week: 0, retention: 100 },
    { week: 1, retention: 70 },
    { week: 2, retention: 50 },
    { week: 3, retention: 35 },
    { week: 4, retention: 25 },
  ];

  it('weeks before target remain unchanged', () => {
    const result = simulateRetention({
      retentionCurve: curve,
      targetWeek: 2,
      delta: 10,
    });
    expect(result[0].retention).toBe(100);
    expect(result[1].retention).toBe(70);
  });

  it('target week gets delta applied, later weeks decay', () => {
    const result = simulateRetention({
      retentionCurve: curve,
      targetWeek: 2,
      delta: 10,
    });
    expect(result[2].retention).toBe(60); // 50 + 10
    expect(result[3].retention).toBeGreaterThan(35); // improved
    expect(result[3].retention).toBeLessThan(45); // but decayed
  });

  it('retention does not exceed 100', () => {
    const result = simulateRetention({
      retentionCurve: [{ week: 0, retention: 95 }],
      targetWeek: 0,
      delta: 20,
    });
    expect(result[0].retention).toBeLessThanOrEqual(100);
  });
});

describe('runABTestSimulation', () => {
  const curve = [
    { week: 0, retention: 100 },
    { week: 1, retention: 70 },
    { week: 2, retention: 50 },
    { week: 3, retention: 35 },
    { week: 4, retention: 25 },
  ];

  it('returns complete result structure', () => {
    const result = runABTestSimulation({
      retentionCurve: curve,
      targetWeek: 2,
      delta: 10,
    });
    expect(result).toHaveProperty('powerAnalysis');
    expect(result).toHaveProperty('retention');
    expect(result).toHaveProperty('ltvImpact');
    expect(result).toHaveProperty('scenarios');
    expect(result.powerAnalysis).toHaveProperty('sampleSize');
    expect(result.powerAnalysis).toHaveProperty('powerCurve');
    expect(result.retention).toHaveProperty('control');
    expect(result.retention).toHaveProperty('treatment');
  });

  it('generates 4 scenarios', () => {
    const result = runABTestSimulation({
      retentionCurve: curve,
      targetWeek: 2,
      delta: 10,
    });
    expect(result.scenarios).toHaveLength(4);
    expect(result.scenarios[0].delta).toBe(5); // conservative
    expect(result.scenarios[1].delta).toBe(10); // baseline
  });

  it('treatment LTV > control LTV for positive delta', () => {
    const result = runABTestSimulation({
      retentionCurve: curve,
      targetWeek: 2,
      delta: 10,
      arpu: 100,
    });
    expect(result.ltvImpact.treatmentLTV).toBeGreaterThan(
      result.ltvImpact.controlLTV
    );
    expect(result.ltvImpact.ltvDelta).toBeGreaterThan(0);
  });

  it('returns null for invalid target week', () => {
    const result = runABTestSimulation({
      retentionCurve: curve,
      targetWeek: Number.NaN,
      delta: 10,
    });
    expect(result).toBeNull();
  });
});
