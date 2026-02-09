import { describe, it, expect } from 'vitest';
import {
  getRetentionCurves,
  estimateDecayRate,
  extrapolateRetention,
  calculateCohortLTV,
  predictLTV,
} from './ltvPrediction.js';

// 테스트용 리텐션 매트릭스
const sampleMatrix = [
  { cohort: '2025-01-06', week: 0, users: 5, total: 5, retention: 100 },
  { cohort: '2025-01-06', week: 1, users: 4, total: 5, retention: 80 },
  { cohort: '2025-01-06', week: 2, users: 3, total: 5, retention: 60 },
  { cohort: '2025-01-06', week: 3, users: 2, total: 5, retention: 40 },
  { cohort: '2025-01-13', week: 0, users: 3, total: 3, retention: 100 },
  { cohort: '2025-01-13', week: 1, users: 2, total: 3, retention: 66.7 },
  { cohort: '2025-01-13', week: 2, users: 1, total: 3, retention: 33.3 },
];

describe('getRetentionCurves', () => {
  it('코호트별 리텐션 커브를 올바르게 추출한다', () => {
    const curves = getRetentionCurves(sampleMatrix);
    expect(curves.size).toBe(2);
    expect(curves.get('2025-01-06')).toHaveLength(4);
    expect(curves.get('2025-01-13')).toHaveLength(3);
    expect(curves.get('2025-01-06')[0].week).toBe(0);
    expect(curves.get('2025-01-06')[3].week).toBe(3);
  });

  it('빈 retentionMatrix → 빈 Map 반환', () => {
    expect(getRetentionCurves([]).size).toBe(0);
    expect(getRetentionCurves(null).size).toBe(0);
  });
});

describe('estimateDecayRate', () => {
  it('리텐션 감소 커브에서 양의 λ를 반환한다', () => {
    const curve = [
      { week: 0, retention: 100 },
      { week: 1, retention: 80 },
      { week: 2, retention: 60 },
      { week: 3, retention: 40 },
    ];
    const decay = estimateDecayRate(curve);
    expect(decay.lambda).toBeGreaterThan(0);
    expect(decay.lastWeek).toBe(3);
    expect(decay.lastRetention).toBeCloseTo(0.4, 2);
  });

  it('1개 이하 포인트 → lambda=0 반환', () => {
    const single = [{ week: 0, retention: 100 }];
    expect(estimateDecayRate(single).lambda).toBe(0);
    expect(estimateDecayRate([]).lambda).toBe(0);
    expect(estimateDecayRate(null).lambda).toBe(0);
  });

  it('리텐션이 0인 포인트는 제외한다', () => {
    const curve = [
      { week: 0, retention: 100 },
      { week: 1, retention: 50 },
      { week: 2, retention: 0 },
    ];
    const decay = estimateDecayRate(curve);
    // week 2는 제외되므로 포인트 1개만 남음 → lambda=0
    expect(decay.lastWeek).toBe(1);
  });
});

describe('extrapolateRetention', () => {
  it('감쇠율에 따라 리텐션이 점진적으로 감소한다', () => {
    const decay = { lambda: 0.2, lastWeek: 4, lastRetention: 0.5 };
    const result = extrapolateRetention(decay);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].week).toBe(5);
    expect(result[0].retention).toBeLessThan(0.5);
    // 감소 확인
    for (let i = 1; i < result.length; i++) {
      expect(result[i].retention).toBeLessThan(result[i - 1].retention);
    }
  });

  it('minRetention 이하에서 외삽을 중단한다', () => {
    const decay = { lambda: 1.0, lastWeek: 2, lastRetention: 0.5 };
    const result = extrapolateRetention(decay, 52, 0.01);
    const lastRetention = result[result.length - 1].retention;
    expect(lastRetention).toBeGreaterThanOrEqual(0.01);
  });

  it('maxWeek을 초과하지 않는다', () => {
    const decay = { lambda: 0.01, lastWeek: 50, lastRetention: 0.9 };
    const result = extrapolateRetention(decay, 52);
    result.forEach((p) => expect(p.week).toBeLessThanOrEqual(52));
  });

  it('lambda=0 → 빈 배열 반환', () => {
    const decay = { lambda: 0, lastWeek: 4, lastRetention: 0.5 };
    expect(extrapolateRetention(decay)).toHaveLength(0);
  });
});

describe('calculateCohortLTV', () => {
  const curve = [
    { week: 0, retention: 100 },
    { week: 1, retention: 80 },
    { week: 2, retention: 60 },
  ];

  it('관측 리텐션만으로 LTV를 계산한다', () => {
    const result = calculateCohortLTV(curve, 1.0);
    // (100+80+60)/100 = 2.4
    expect(result.observedLTV).toBeCloseTo(2.4, 1);
    expect(result.observedWeeks).toBe(3);
  });

  it('ARPU 적용이 올바르다', () => {
    const result = calculateCohortLTV(curve, 10);
    expect(result.observedLTV).toBeCloseTo(24, 0);
  });

  it('관측 주차에 따른 confidence를 올바르게 판정한다', () => {
    expect(calculateCohortLTV(curve).confidence).toBe('low');

    const longCurve = Array.from({ length: 5 }, (_, i) => ({
      week: i,
      retention: 100 - i * 10,
    }));
    expect(calculateCohortLTV(longCurve).confidence).toBe('medium');

    const veryLongCurve = Array.from({ length: 9 }, (_, i) => ({
      week: i,
      retention: 100 - i * 5,
    }));
    expect(calculateCohortLTV(veryLongCurve).confidence).toBe('high');
  });

  it('외삽 포함 LTV >= 관측 LTV', () => {
    const result = calculateCohortLTV(curve);
    expect(result.projectedLTV).toBeGreaterThanOrEqual(result.observedLTV);
  });

  it('빈 커브 → 기본값 반환', () => {
    const result = calculateCohortLTV([]);
    expect(result.observedLTV).toBe(0);
    expect(result.projectedLTV).toBe(0);
    expect(result.confidence).toBe('low');
  });
});

describe('predictLTV', () => {
  it('전체 파이프라인이 올바른 구조를 반환한다', () => {
    const result = predictLTV(sampleMatrix);
    expect(result).toHaveProperty('cohortLTVs');
    expect(result).toHaveProperty('summary');
    expect(result).toHaveProperty('arpu');
    expect(result).toHaveProperty('performance');
    expect(result.cohortLTVs).toHaveLength(2);
    expect(result.summary).toHaveProperty('averageLTV');
    expect(result.summary).toHaveProperty('medianLTV');
    expect(result.summary).toHaveProperty('bestCohort');
    expect(result.summary).toHaveProperty('worstCohort');
    expect(result.summary).toHaveProperty('ltvTrend');
  });

  it('빈 retentionMatrix → 기본값 반환', () => {
    const result = predictLTV([]);
    expect(result.cohortLTVs).toHaveLength(0);
    expect(result.summary.averageLTV).toBe(0);
    expect(result.summary.bestCohort).toBeNull();
  });

  it('summary.bestCohort가 가장 높은 LTV 코호트이다', () => {
    const result = predictLTV(sampleMatrix);
    const maxLTV = Math.max(...result.cohortLTVs.map((c) => c.projectedLTV));
    expect(result.summary.bestCohort.ltv).toBe(maxLTV);
  });

  it('ARPU 옵션이 적용된다', () => {
    const r1 = predictLTV(sampleMatrix, { arpu: 1 });
    const r10 = predictLTV(sampleMatrix, { arpu: 10 });
    expect(r10.summary.averageLTV).toBeCloseTo(r1.summary.averageLTV * 10, 0);
  });
});
