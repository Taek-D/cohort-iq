import { describe, it, expect } from 'vitest';
import {
  chi2pValue,
  chiSquareTest,
  kaplanMeier,
  logRankTest,
  runStatisticalTests,
} from './statisticalTests.js';

// ─── chi2pValue ───

describe('chi2pValue', () => {
  it('df=1, chi2=3.841 → p ≈ 0.05', () => {
    const p = chi2pValue(3.841, 1);
    expect(p).toBeCloseTo(0.05, 2);
  });

  it('df=2, chi2=5.991 → p ≈ 0.05', () => {
    const p = chi2pValue(5.991, 2);
    expect(p).toBeCloseTo(0.05, 2);
  });

  it('chi2=0 → p = 1', () => {
    expect(chi2pValue(0, 1)).toBe(1);
  });

  it('very large chi2 → p ≈ 0', () => {
    const p = chi2pValue(50, 1);
    expect(p).toBeLessThan(0.0001);
  });

  it('df=0 → p = 1', () => {
    expect(chi2pValue(5, 0)).toBe(1);
  });
});

// ─── chiSquareTest ───

describe('chiSquareTest', () => {
  const cohortInfo = {
    cohorts: new Map([
      ['2025-01-06', new Set(['u1', 'u2', 'u3'])],
      ['2025-01-13', new Set(['u4', 'u5', 'u6'])],
      ['2025-01-20', new Set(['u7', 'u8', 'u9'])],
    ]),
  };

  const churnRiskData = [
    { userId: 'u1', cohort: '2025-01-06', riskLevel: 'CRITICAL' },
    { userId: 'u2', cohort: '2025-01-06', riskLevel: 'CRITICAL' },
    { userId: 'u3', cohort: '2025-01-06', riskLevel: 'HIGH' },
    { userId: 'u4', cohort: '2025-01-13', riskLevel: 'MEDIUM' },
    { userId: 'u5', cohort: '2025-01-13', riskLevel: 'LOW' },
    { userId: 'u6', cohort: '2025-01-13', riskLevel: 'LOW' },
    { userId: 'u7', cohort: '2025-01-20', riskLevel: 'LOW' },
    { userId: 'u8', cohort: '2025-01-20', riskLevel: 'LOW' },
    { userId: 'u9', cohort: '2025-01-20', riskLevel: 'LOW' },
  ];

  it('returns chi2, df, pValue, contingencyTable', () => {
    const result = chiSquareTest(cohortInfo, churnRiskData);
    expect(result).toHaveProperty('chi2');
    expect(result).toHaveProperty('df');
    expect(result).toHaveProperty('pValue');
    expect(result).toHaveProperty('contingencyTable');
    expect(result.df).toBeGreaterThan(0);
    expect(result.chi2).toBeGreaterThan(0);
    expect(result.pValue).toBeGreaterThanOrEqual(0);
    expect(result.pValue).toBeLessThanOrEqual(1);
  });

  it('contingency table sums to total users', () => {
    const result = chiSquareTest(cohortInfo, churnRiskData);
    const total = result.contingencyTable.flat().reduce((s, v) => s + v, 0);
    expect(total).toBe(9);
  });

  it('empty churnRiskData → fallback', () => {
    const result = chiSquareTest(cohortInfo, []);
    expect(result.chi2).toBe(0);
    expect(result.pValue).toBe(1);
    expect(result.significant).toBe(false);
  });

  it('single cohort → df=0, not significant', () => {
    const singleCohort = {
      cohorts: new Map([['2025-01-06', new Set(['u1'])]]),
    };
    const result = chiSquareTest(singleCohort, [
      { userId: 'u1', cohort: '2025-01-06', riskLevel: 'LOW' },
    ]);
    expect(result.df).toBe(0);
    expect(result.significant).toBe(false);
  });
});

// ─── kaplanMeier ───

describe('kaplanMeier', () => {
  it('computes survival function with correct structure', () => {
    const userActivity = new Map([
      [
        'u1',
        {
          cohort: '2025-01-06',
          signup_date: '2025-01-06',
          lastEventDate: '2025-01-13',
          activeWeeks: new Set([0, 1]),
        },
      ],
      [
        'u2',
        {
          cohort: '2025-01-06',
          signup_date: '2025-01-06',
          lastEventDate: '2025-01-27',
          activeWeeks: new Set([0, 1, 2, 3]),
        },
      ],
      [
        'u3',
        {
          cohort: '2025-01-06',
          signup_date: '2025-01-06',
          lastEventDate: '2025-01-06',
          activeWeeks: new Set([0]),
        },
      ],
    ]);

    const result = kaplanMeier(userActivity, new Date('2025-02-10'));
    expect(result.survivalFunction).toBeDefined();
    expect(result.survivalFunction.length).toBeGreaterThan(0);

    // First point should be time=0, survival=1.0
    expect(result.survivalFunction[0]).toEqual(
      expect.objectContaining({ time: 0, survival: 1.0 })
    );

    // Survival should decrease or stay the same
    for (let i = 1; i < result.survivalFunction.length; i++) {
      expect(result.survivalFunction[i].survival).toBeLessThanOrEqual(
        result.survivalFunction[i - 1].survival
      );
    }
  });

  it('empty userActivity → empty result', () => {
    const result = kaplanMeier(new Map());
    expect(result.survivalFunction).toEqual([]);
    expect(result.medianSurvival).toBeNull();
  });

  it('medianSurvival found when survival drops below 0.5', () => {
    // 5 users: 2 churn at week 1, 2 churn at week 2, 1 survives
    const users = new Map([
      ['u1', { cohort: 'c1', signup_date: '2025-01-06', lastEventDate: '2025-01-13', activeWeeks: new Set([0, 1]) }],
      ['u2', { cohort: 'c1', signup_date: '2025-01-06', lastEventDate: '2025-01-13', activeWeeks: new Set([0, 1]) }],
      ['u3', { cohort: 'c1', signup_date: '2025-01-06', lastEventDate: '2025-01-20', activeWeeks: new Set([0, 1, 2]) }],
      ['u4', { cohort: 'c1', signup_date: '2025-01-06', lastEventDate: '2025-01-20', activeWeeks: new Set([0, 1, 2]) }],
      ['u5', { cohort: 'c1', signup_date: '2025-01-06', lastEventDate: '2025-02-03', activeWeeks: new Set([0, 1, 2, 3, 4]) }],
    ]);
    const result = kaplanMeier(users, new Date('2025-03-01'));
    expect(result.medianSurvival).not.toBeNull();
    expect(typeof result.medianSurvival).toBe('number');
  });
});

// ─── logRankTest ───

describe('logRankTest', () => {
  it('returns test result with correct shape', () => {
    const users = new Map([
      ['u1', { cohort: '2025-01-06', signup_date: '2025-01-06', lastEventDate: '2025-01-06', activeWeeks: new Set([0]) }],
      ['u2', { cohort: '2025-01-06', signup_date: '2025-01-06', lastEventDate: '2025-01-20', activeWeeks: new Set([0, 1, 2]) }],
      ['u3', { cohort: '2025-01-13', signup_date: '2025-01-13', lastEventDate: '2025-01-27', activeWeeks: new Set([0, 1, 2]) }],
      ['u4', { cohort: '2025-01-13', signup_date: '2025-01-13', lastEventDate: '2025-02-10', activeWeeks: new Set([0, 1, 2, 3, 4]) }],
    ]);
    const labels = ['2025-01-06', '2025-01-13'];
    const result = logRankTest(users, labels, new Date('2025-03-01'));

    expect(result).toHaveProperty('testStatistic');
    expect(result).toHaveProperty('pValue');
    expect(result).toHaveProperty('significant');
    expect(result).toHaveProperty('group1Label');
    expect(result).toHaveProperty('group2Label');
    expect(result.pValue).toBeGreaterThanOrEqual(0);
    expect(result.pValue).toBeLessThanOrEqual(1);
  });

  it('empty input → fallback', () => {
    const result = logRankTest(new Map(), [], new Date());
    expect(result.testStatistic).toBe(0);
    expect(result.pValue).toBe(1);
    expect(result.significant).toBe(false);
  });

  it('single cohort → fallback', () => {
    const users = new Map([
      ['u1', { cohort: 'c1', signup_date: '2025-01-06', lastEventDate: '2025-01-06', activeWeeks: new Set([0]) }],
    ]);
    const result = logRankTest(users, ['c1'], new Date('2025-03-01'));
    expect(result.testStatistic).toBe(0);
    expect(result.pValue).toBe(1);
  });
});

// ─── runStatisticalTests (integration) ───

describe('runStatisticalTests', () => {
  it('returns all three test results', () => {
    const cohortInfo = {
      cohorts: new Map([
        ['2025-01-06', new Set(['u1', 'u2'])],
        ['2025-01-13', new Set(['u3', 'u4'])],
      ]),
    };
    const churnResult = {
      churnRiskData: [
        { userId: 'u1', cohort: '2025-01-06', riskLevel: 'CRITICAL' },
        { userId: 'u2', cohort: '2025-01-06', riskLevel: 'LOW' },
        { userId: 'u3', cohort: '2025-01-13', riskLevel: 'LOW' },
        { userId: 'u4', cohort: '2025-01-13', riskLevel: 'LOW' },
      ],
    };
    const userActivity = new Map([
      ['u1', { cohort: '2025-01-06', signup_date: '2025-01-06', lastEventDate: '2025-01-06', activeWeeks: new Set([0]) }],
      ['u2', { cohort: '2025-01-06', signup_date: '2025-01-06', lastEventDate: '2025-01-20', activeWeeks: new Set([0, 1, 2]) }],
      ['u3', { cohort: '2025-01-13', signup_date: '2025-01-13', lastEventDate: '2025-02-03', activeWeeks: new Set([0, 1, 2, 3]) }],
      ['u4', { cohort: '2025-01-13', signup_date: '2025-01-13', lastEventDate: '2025-02-10', activeWeeks: new Set([0, 1, 2, 3, 4]) }],
    ]);

    const result = runStatisticalTests([], cohortInfo, churnResult, userActivity);
    expect(result).toHaveProperty('chiSquare');
    expect(result).toHaveProperty('kaplanMeier');
    expect(result).toHaveProperty('logRank');
    expect(result.kaplanMeier.survivalFunction.length).toBeGreaterThan(0);
  });

  it('without userActivity → KM and logRank return fallbacks', () => {
    const cohortInfo = {
      cohorts: new Map([['2025-01-06', new Set(['u1'])]]),
    };
    const churnResult = {
      churnRiskData: [
        { userId: 'u1', cohort: '2025-01-06', riskLevel: 'LOW' },
      ],
    };

    const result = runStatisticalTests([], cohortInfo, churnResult);
    expect(result.kaplanMeier.survivalFunction).toEqual([]);
    expect(result.logRank.testStatistic).toBe(0);
  });
});
