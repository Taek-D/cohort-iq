// ltvPrediction.js - 코호트 리텐션 기반 LTV 예측 엔진

const DEFAULT_ARPU = 1.0;
const MAX_EXTRAPOLATION_WEEKS = 52;
const MIN_RETENTION_THRESHOLD = 0.01;
const CONFIDENCE_HIGH_WEEKS = 8;
const CONFIDENCE_MEDIUM_WEEKS = 4;
const LTV_TREND_THRESHOLD = 0.1;

/**
 * 코호트별 리텐션 커브 추출
 * @param {Array} retentionMatrix - cohortAnalysis.calculateRetention() 결과
 * @returns {Map<string, Array<{week: number, retention: number}>>}
 */
export function getRetentionCurves(retentionMatrix) {
  const curves = new Map();

  if (!retentionMatrix || retentionMatrix.length === 0) return curves;

  retentionMatrix.forEach((item) => {
    if (!curves.has(item.cohort)) {
      curves.set(item.cohort, []);
    }
    curves.get(item.cohort).push({
      week: item.week,
      retention: item.retention,
      total: item.total,
    });
  });

  // 각 코호트 내에서 주차순 정렬
  curves.forEach((curve) => {
    curve.sort((a, b) => a.week - b.week);
  });

  return curves;
}

/**
 * 지수 감쇠율(λ) 추정
 * @param {Array<{week: number, retention: number}>} curve
 * @returns {{ lambda: number, lastWeek: number, lastRetention: number }}
 */
export function estimateDecayRate(curve) {
  if (!curve || curve.length === 0) {
    return { lambda: 0, lastWeek: 0, lastRetention: 0 };
  }

  // week 0 제외, retention > 0인 포인트만
  const validPoints = curve.filter((p) => p.week > 0 && p.retention > 0);

  if (validPoints.length < 2) {
    // 포인트가 1개면 그 값을 lastRetention으로 사용하되 외삽 불가
    if (validPoints.length === 1) {
      return {
        lambda: 0,
        lastWeek: validPoints[0].week,
        lastRetention: validPoints[0].retention / 100,
      };
    }
    return { lambda: 0, lastWeek: 0, lastRetention: 0 };
  }

  // 마지막 2개 포인트 사용
  const prev = validPoints[validPoints.length - 2];
  const last = validPoints[validPoints.length - 1];

  const rPrev = prev.retention / 100;
  const rLast = last.retention / 100;
  const deltaT = last.week - prev.week;

  // λ = -ln(R_last / R_prev) / Δt
  let lambda = 0;
  if (rPrev > 0 && rLast > 0 && deltaT > 0) {
    lambda = -Math.log(rLast / rPrev) / deltaT;
  }

  // λ가 음수면 리텐션이 증가하는 경우 → 외삽하지 않음
  if (lambda < 0) lambda = 0;

  return {
    lambda,
    lastWeek: last.week,
    lastRetention: rLast,
  };
}

/**
 * 외삽 리텐션 계산
 * @param {{ lambda: number, lastWeek: number, lastRetention: number }} decay
 * @param {number} maxWeek
 * @param {number} minRetention
 * @returns {Array<{week: number, retention: number}>}
 */
export function extrapolateRetention(
  decay,
  maxWeek = MAX_EXTRAPOLATION_WEEKS,
  minRetention = MIN_RETENTION_THRESHOLD
) {
  const { lambda, lastWeek, lastRetention } = decay;

  if (lambda <= 0 || lastRetention <= 0 || lastWeek <= 0) {
    return [];
  }

  const extrapolated = [];

  for (let t = 1; lastWeek + t <= maxWeek; t++) {
    const retention = lastRetention * Math.exp(-lambda * t);

    if (retention < minRetention) break;

    extrapolated.push({
      week: lastWeek + t,
      retention, // 0~1 스케일
    });
  }

  return extrapolated;
}

/**
 * 단일 코호트 LTV 계산
 * @param {Array<{week: number, retention: number}>} observedCurve - 0~100 스케일
 * @param {number} arpu
 * @param {number} maxWeek
 * @returns {Object}
 */
export function calculateCohortLTV(
  observedCurve,
  arpu = DEFAULT_ARPU,
  maxWeek = MAX_EXTRAPOLATION_WEEKS
) {
  if (!observedCurve || observedCurve.length === 0) {
    return {
      observedLTV: 0,
      projectedLTV: 0,
      totalWeeks: 0,
      observedWeeks: 0,
      confidence: 'low',
      retentionCurve: [],
    };
  }

  // 관측 리텐션 합산 (0~100 → 0~1로 변환)
  const observedSum = observedCurve.reduce(
    (sum, p) => sum + p.retention / 100,
    0
  );
  const observedLTV = observedSum * arpu;
  const observedWeeks = observedCurve.length;

  // 지수 감쇠 추정 + 외삽
  const decay = estimateDecayRate(observedCurve);
  const extrapolated = extrapolateRetention(decay, maxWeek);

  // 외삽 리텐션 합산 (이미 0~1 스케일)
  const extrapolatedSum = extrapolated.reduce(
    (sum, p) => sum + p.retention,
    0
  );
  const projectedLTV = (observedSum + extrapolatedSum) * arpu;

  // 통합 커브
  const retentionCurve = [
    ...observedCurve.map((p) => ({
      week: p.week,
      retention: p.retention / 100,
      type: 'observed',
    })),
    ...extrapolated.map((p) => ({
      week: p.week,
      retention: p.retention,
      type: 'projected',
    })),
  ];

  const totalWeeks = retentionCurve.length;

  // Confidence
  let confidence;
  if (observedWeeks >= CONFIDENCE_HIGH_WEEKS) confidence = 'high';
  else if (observedWeeks >= CONFIDENCE_MEDIUM_WEEKS) confidence = 'medium';
  else confidence = 'low';

  return {
    observedLTV: Math.round(observedLTV * 100) / 100,
    projectedLTV: Math.round(projectedLTV * 100) / 100,
    totalWeeks,
    observedWeeks,
    confidence,
    retentionCurve,
  };
}

/**
 * 전체 LTV 분석 실행
 * @param {Array} retentionMatrix
 * @param {{ arpu?: number, maxWeek?: number }} options
 * @returns {Object}
 */
export function predictLTV(retentionMatrix, options = {}) {
  const arpu = options.arpu ?? DEFAULT_ARPU;
  const maxWeek = options.maxWeek ?? MAX_EXTRAPOLATION_WEEKS;

  if (!retentionMatrix || retentionMatrix.length === 0) {
    return {
      cohortLTVs: [],
      summary: {
        averageLTV: 0,
        medianLTV: 0,
        bestCohort: null,
        worstCohort: null,
        ltvTrend: 'stable',
        totalProjectedRevenue: 0,
      },
      arpu,
      performance: { duration: 0 },
    };
  }

  const startTime = performance.now();

  // 1. 코호트별 리텐션 커브 추출
  const curves = getRetentionCurves(retentionMatrix);

  // 2. 코호트별 LTV 계산
  const cohortLTVs = [];
  curves.forEach((curve, cohort) => {
    const result = calculateCohortLTV(curve, arpu, maxWeek);
    const cohortSize = curve.length > 0 ? curve[0].total : 0;

    cohortLTVs.push({
      cohort,
      observedLTV: result.observedLTV,
      projectedLTV: result.projectedLTV,
      observedWeeks: result.observedWeeks,
      totalWeeks: result.totalWeeks,
      confidence: result.confidence,
      cohortSize,
    });
  });

  // 시간순 정렬
  cohortLTVs.sort((a, b) => a.cohort.localeCompare(b.cohort));

  // 3. Summary 계산
  const ltvValues = cohortLTVs.map((c) => c.projectedLTV);
  const averageLTV =
    ltvValues.length > 0
      ? Math.round(
          (ltvValues.reduce((a, b) => a + b, 0) / ltvValues.length) * 100
        ) / 100
      : 0;

  const sorted = [...ltvValues].sort((a, b) => a - b);
  const medianLTV =
    sorted.length > 0
      ? sorted.length % 2 === 0
        ? Math.round(
            ((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2) *
              100
          ) / 100
        : sorted[Math.floor(sorted.length / 2)]
      : 0;

  const bestCohort =
    cohortLTVs.length > 0
      ? cohortLTVs.reduce((best, c) =>
          c.projectedLTV > best.projectedLTV ? c : best
        )
      : null;

  const worstCohort =
    cohortLTVs.length > 0
      ? cohortLTVs.reduce((worst, c) =>
          c.projectedLTV < worst.projectedLTV ? c : worst
        )
      : null;

  // LTV Trend 판정
  const ltvTrend = determineTrend(cohortLTVs);

  // 총 예상 매출
  const totalProjectedRevenue =
    Math.round(
      cohortLTVs.reduce((sum, c) => sum + c.projectedLTV * c.cohortSize, 0) *
        100
    ) / 100;

  const endTime = performance.now();

  return {
    cohortLTVs,
    summary: {
      averageLTV,
      medianLTV,
      bestCohort: bestCohort
        ? { cohort: bestCohort.cohort, ltv: bestCohort.projectedLTV }
        : null,
      worstCohort: worstCohort
        ? { cohort: worstCohort.cohort, ltv: worstCohort.projectedLTV }
        : null,
      ltvTrend,
      totalProjectedRevenue,
    },
    arpu,
    performance: { duration: Math.round(endTime - startTime) },
  };
}

/**
 * LTV 트렌드 판정
 */
function determineTrend(cohortLTVs) {
  if (cohortLTVs.length < 2) return 'stable';

  const mid = Math.floor(cohortLTVs.length / 2);
  const firstHalf = cohortLTVs.slice(0, mid);
  const secondHalf = cohortLTVs.slice(mid);

  const firstAvg =
    firstHalf.reduce((s, c) => s + c.projectedLTV, 0) / firstHalf.length;
  const secondAvg =
    secondHalf.reduce((s, c) => s + c.projectedLTV, 0) / secondHalf.length;

  if (firstAvg === 0) return 'stable';

  const changeRate = (secondAvg - firstAvg) / firstAvg;

  if (changeRate > LTV_TREND_THRESHOLD) return 'improving';
  if (changeRate < -LTV_TREND_THRESHOLD) return 'declining';
  return 'stable';
}
