// summaryGenerator.js - Executive Summary 생성
import { format } from 'date-fns';
import { t } from '../i18n/index.js';

/**
 * Executive Summary 데이터 준비
 * @param {Object} cohortResult - analyzeCohort 결과
 * @param {Object} churnResult - analyzeChurn 결과
 * @param {Object} [ltvResult] - predictLTV 결과 (선택적)
 * @returns {Object} Summary 데이터
 */
export function prepareSummaryData(cohortResult, churnResult, ltvResult) {
  if (!cohortResult || !churnResult) {
    return {
      metadata: {
        generatedAt: new Date(),
        analysisDate: format(new Date(), 'yyyy-MM-dd'),
        totalCohorts: 0,
        dateRange: { from: '-', to: '-' },
      },
      keyMetrics: {
        week1Retention: 0,
        week2Retention: 0,
        week3Retention: 0,
        week4Retention: 0,
        healthScore: 0,
      },
      churnRisk: {
        critical: 0,
        criticalPercentage: 0,
        high: 0,
        highPercentage: 0,
        total: 0,
      },
      insights: [],
      performance: { cohortAnalysis: 0, churnAnalysis: 0, totalDuration: 0 },
    };
  }

  const { cohorts, retentionMatrix, performance: cohortPerf } = cohortResult;
  const { riskSegments, insights, performance: churnPerf } = churnResult;

  // 핵심 메트릭 계산
  const totalCohorts = cohorts.length;
  if (totalCohorts === 0) {
    return {
      metadata: {
        generatedAt: new Date(),
        analysisDate: format(new Date(), 'yyyy-MM-dd'),
        totalCohorts: 0,
        dateRange: { from: '-', to: '-' },
      },
      keyMetrics: {
        week1Retention: 0,
        week2Retention: 0,
        week3Retention: 0,
        week4Retention: 0,
        healthScore: 0,
      },
      churnRisk: {
        critical: 0,
        criticalPercentage: 0,
        high: 0,
        highPercentage: 0,
        total: 0,
      },
      insights: [],
      performance: {
        cohortAnalysis: cohortPerf.duration,
        churnAnalysis: churnPerf.duration,
        totalDuration: cohortPerf.duration + churnPerf.duration,
      },
    };
  }
  const latestCohort = cohorts[cohorts.length - 1];
  const oldestCohort = cohorts[0];

  // 평균 리텐션 계산 (Week 1-4)
  const week1Retention = calculateAverageRetention(retentionMatrix, 1);
  const week2Retention = calculateAverageRetention(retentionMatrix, 2);
  const week3Retention = calculateAverageRetention(retentionMatrix, 3);
  const week4Retention = calculateAverageRetention(retentionMatrix, 4);

  // Churn 위험도 요약
  const { summary: riskSummary } = riskSegments;
  const criticalRatio =
    riskSummary.total > 0
      ? Math.round((riskSummary.critical / riskSummary.total) * 100)
      : 0;

  // 건강도 점수 (0-100)
  const healthScore = calculateHealthScore(
    week4Retention,
    criticalRatio,
    riskSummary
  );

  // Top 3 인사이트
  const topInsights = insights.slice(0, 3);

  return {
    metadata: {
      generatedAt: new Date(),
      analysisDate: format(new Date(), 'yyyy-MM-dd'),
      totalCohorts,
      dateRange: {
        from: oldestCohort,
        to: latestCohort,
      },
    },
    keyMetrics: {
      week1Retention,
      week2Retention,
      week3Retention,
      week4Retention,
      healthScore,
    },
    churnRisk: {
      critical: riskSummary.critical,
      criticalPercentage: riskSummary.criticalPercentage,
      high: riskSummary.high,
      highPercentage: riskSummary.highPercentage,
      total: riskSummary.total,
    },
    insights: topInsights,
    ltv: ltvResult
      ? {
          averageLTV: ltvResult.summary.averageLTV,
          bestCohort: ltvResult.summary.bestCohort,
          worstCohort: ltvResult.summary.worstCohort,
          trend: ltvResult.summary.ltvTrend,
          arpu: ltvResult.arpu,
        }
      : null,
    performance: {
      cohortAnalysis: cohortPerf.duration,
      churnAnalysis: churnPerf.duration,
      totalDuration: cohortPerf.duration + churnPerf.duration,
    },
  };
}

/**
 * 평균 리텐션 계산
 */
function calculateAverageRetention(retentionMatrix, weekIndex) {
  const weekData = retentionMatrix.filter((item) => item.week === weekIndex);
  if (weekData.length === 0) return 0;

  const sum = weekData.reduce((acc, item) => acc + item.retention, 0);
  return Math.round(sum / weekData.length);
}

// 건강도 점수 기준값
// 근거: docs/METHODOLOGY.md 3-2절 참조
const RETENTION_BENCHMARK = 80; // SaaS 상위 10% D28 리텐션 → 만점 기준
const LOW_RISK_BENCHMARK = 60; // 건강한 서비스의 Low Risk 최소 비율 → 만점 기준
const HEALTH_RETENTION_WEIGHT = 50; // 리텐션 배점
const HEALTH_CHURN_WEIGHT = 50; // Churn Risk 배점

/**
 * 건강도 점수 계산 (0-100)
 * - Week 4 Retention: HEALTH_RETENTION_WEIGHT점
 * - Churn Risk: HEALTH_CHURN_WEIGHT점
 */
function calculateHealthScore(week4Retention, criticalRatio, riskSummary) {
  const retentionScore = Math.min(
    HEALTH_RETENTION_WEIGHT,
    (week4Retention / RETENTION_BENCHMARK) * HEALTH_RETENTION_WEIGHT
  );

  const lowRatio =
    riskSummary.total > 0
      ? (riskSummary.low / riskSummary.total) * 100
      : 0;
  const churnScore = Math.min(
    HEALTH_CHURN_WEIGHT,
    (lowRatio / LOW_RISK_BENCHMARK) * HEALTH_CHURN_WEIGHT
  );

  return Math.min(100, Math.max(0, Math.round(retentionScore + churnScore)));
}

// 건강도 등급 경계값
const GRADE_A = 80;
const GRADE_B = 60;
const GRADE_C = 40;

/**
 * 건강도 등급
 */
export function getHealthGrade(score) {
  if (score >= GRADE_A)
    return { grade: 'A', color: '#10b981', label: t('summary.gradeA') };
  if (score >= GRADE_B)
    return { grade: 'B', color: '#3b82f6', label: t('summary.gradeB') };
  if (score >= GRADE_C)
    return { grade: 'C', color: '#f59e0b', label: t('summary.gradeC') };
  return { grade: 'D', color: '#ef4444', label: t('summary.gradeD') };
}

/**
 * HTML Summary 템플릿
 */
export function generateSummaryHTML(summaryData) {
  const { metadata, keyMetrics, churnRisk, insights, ltv } = summaryData;
  const healthGrade = getHealthGrade(keyMetrics.healthScore);

  return `
    <div id="executiveSummary" class="bg-white p-12" style="width: 210mm; min-height: 297mm; font-family: 'Arial', sans-serif;">
      <!-- 헤더 -->
      <div class="border-b-4 border-blue-600 pb-6 mb-8">
        <h1 class="text-4xl font-bold text-gray-900 mb-2">
          ${t('summary.title')}
        </h1>
        <p class="text-gray-600 text-lg">
          ${t('summary.subtitle')}
        </p>
        <p class="text-sm text-gray-500 mt-2">
          ${t('summary.generatedAt', { date: format(metadata.generatedAt, 'yyyy-MM-dd HH:mm:ss') })}
        </p>
      </div>

      <!-- 분석 기간 -->
      <div class="bg-gray-50 rounded-lg p-6 mb-8">
        <h2 class="text-xl font-bold text-gray-800 mb-3">${t('summary.analysisPeriod')}</h2>
        <div class="grid grid-cols-3 gap-4 text-center">
          <div>
            <p class="text-sm text-gray-600 mb-1">${t('summary.totalCohorts')}</p>
            <p class="text-3xl font-bold text-blue-600">${metadata.totalCohorts}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600 mb-1">${t('summary.startDate')}</p>
            <p class="text-2xl font-bold text-gray-800">${metadata.dateRange.from}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600 mb-1">${t('summary.endDate')}</p>
            <p class="text-2xl font-bold text-gray-800">${metadata.dateRange.to}</p>
          </div>
        </div>
      </div>

      <!-- 건강도 스코어 -->
      <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8 mb-8 text-center">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">${t('summary.overallHealth')}</h2>
        <div class="flex items-center justify-center gap-8">
          <div class="text-center">
            <div class="text-7xl font-bold mb-2" style="color: ${healthGrade.color};">
              ${keyMetrics.healthScore}
            </div>
            <div class="text-2xl font-bold" style="color: ${healthGrade.color};">
              ${t('summary.grade', { grade: healthGrade.grade })}
            </div>
            <p class="text-gray-600 mt-2">${healthGrade.label}</p>
          </div>
        </div>
      </div>

      <!-- 핵심 메트릭 -->
      <div class="grid grid-cols-2 gap-6 mb-8">
        <div>
          <h2 class="text-xl font-bold text-gray-800 mb-4">${t('summary.retentionTrend')}</h2>
          <div class="space-y-3">
            ${generateRetentionBar('Week 1', keyMetrics.week1Retention)}
            ${generateRetentionBar('Week 2', keyMetrics.week2Retention)}
            ${generateRetentionBar('Week 3', keyMetrics.week3Retention)}
            ${generateRetentionBar('Week 4', keyMetrics.week4Retention)}
          </div>
        </div>

        <div>
          <h2 class="text-xl font-bold text-gray-800 mb-4">${t('summary.churnRisk')}</h2>
          <div class="space-y-4">
            <div class="bg-red-50 rounded p-4 border-l-4 border-red-500">
              <p class="text-sm text-gray-600 mb-1">${t('summary.criticalRisk')}</p>
              <p class="text-3xl font-bold text-red-600">
                ${t('summary.persons', { count: churnRisk.critical })} <span class="text-lg">(${churnRisk.criticalPercentage}%)</span>
              </p>
            </div>
            <div class="bg-orange-50 rounded p-4 border-l-4 border-orange-500">
              <p class="text-sm text-gray-600 mb-1">${t('summary.highRisk')}</p>
              <p class="text-3xl font-bold text-orange-600">
                ${t('summary.persons', { count: churnRisk.high })} <span class="text-lg">(${churnRisk.highPercentage}%)</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- LTV 예측 -->
      ${
        ltv
          ? `
      <div class="bg-indigo-50 rounded-lg p-6 mb-8">
        <h2 class="text-xl font-bold text-gray-800 mb-3">${t('summary.ltvPrediction')}</h2>
        <div class="grid grid-cols-3 gap-4 text-center">
          <div>
            <p class="text-sm text-gray-600 mb-1">${t('summary.avgLtv')}</p>
            <p class="text-3xl font-bold text-indigo-600">${ltv.averageLTV.toFixed(2)}</p>
            <p class="text-xs text-gray-500">ARPU: ${ltv.arpu}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600 mb-1">${t('summary.bestCohort')}</p>
            <p class="text-2xl font-bold text-green-600">${ltv.bestCohort ? ltv.bestCohort.ltv.toFixed(2) : '-'}</p>
            <p class="text-xs text-gray-500">${ltv.bestCohort ? ltv.bestCohort.cohort : '-'}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600 mb-1">${t('summary.worstCohort')}</p>
            <p class="text-2xl font-bold text-red-600">${ltv.worstCohort ? ltv.worstCohort.ltv.toFixed(2) : '-'}</p>
            <p class="text-xs text-gray-500">${ltv.worstCohort ? ltv.worstCohort.cohort : '-'}</p>
          </div>
        </div>
      </div>
      `
          : ''
      }

      <!-- Top 3 인사이트 -->
      <div class="mb-8">
        <h2 class="text-xl font-bold text-gray-800 mb-4">${t('summary.keyInsights')}</h2>
        <div class="space-y-4">
          ${insights
            .map(
              (insight, index) => `
            <div class="bg-white border-2 border-gray-200 rounded-lg p-5">
              <div class="flex items-start gap-3">
                <span class="text-2xl">${getInsightIcon(insight.severity)}</span>
                <div class="flex-1">
                  <h3 class="font-bold text-gray-800 text-lg mb-2">
                    ${index + 1}. ${insight.title}
                  </h3>
                  <p class="text-gray-700 mb-3">
                    ${insight.description}
                  </p>
                  <div class="bg-blue-50 rounded p-3">
                    <p class="text-sm font-medium text-blue-900">
                      ${t('summary.recommendedAction', { action: insight.action })}
                    </p>
                  </div>
                  <p class="text-xs text-gray-500 mt-2">
                    ${t('summary.affected', { count: insight.affectedUsers })}
                  </p>
                </div>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>

      <!-- 푸터 -->
      <div class="border-t-2 border-gray-200 pt-4 mt-8 text-center">
        <p class="text-sm text-gray-500">
          Generated by <span class="font-bold text-blue-600">CohortIQ</span> &bull;
          ${t('summary.footer', { duration: summaryData.performance.totalDuration })}
        </p>
      </div>
    </div>
  `;
}

/**
 * 리텐션 바 차트
 */
function generateRetentionBar(label, percentage) {
  const color =
    percentage >= 60 ? '#10b981' : percentage >= 40 ? '#f59e0b' : '#ef4444';

  return `
    <div>
      <div class="flex justify-between items-center mb-1">
        <span class="text-sm font-medium text-gray-700">${label}</span>
        <span class="text-sm font-bold" style="color: ${color};">${percentage}%</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-3">
        <div class="h-3 rounded-full transition-all" style="width: ${percentage}%; background-color: ${color};"></div>
      </div>
    </div>
  `;
}

/**
 * 인사이트 아이콘
 */
function getInsightIcon(severity) {
  const icons = {
    CRITICAL: '\ud83d\udea8',
    HIGH: '\u26a0\ufe0f',
    MEDIUM: '\ud83d\udca1',
    LOW: '\u2139\ufe0f',
  };
  return icons[severity] || '\ud83d\udca1';
}
