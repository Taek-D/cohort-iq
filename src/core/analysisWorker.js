// analysisWorker.js - 계산 집약적 분석 작업을 수행하는 Web Worker
import { analyzeCohort } from './cohortAnalysis.js';
import { analyzeChurn, analyzeUserActivity } from './churnAnalysis.js';
import { predictLTV } from './ltvPrediction.js';
import { runStatisticalTests } from './statisticalTests.js';
import { setLocale } from '../i18n/index.js';

self.onmessage = (e) => {
  const { type, data } = e.data;

  if (type === 'SET_LOCALE') {
    if (data?.locale) setLocale(data.locale);
    return;
  }

  if (type === 'ANALYZE') {
    try {
      if (data?.locale) setLocale(data.locale);
      const rows = Array.isArray(data) ? data : data?.rows;
      if (!Array.isArray(rows)) {
        throw new Error('Invalid analysis payload');
      }

      // 1. 코호트 분석
      const cohortResult = analyzeCohort(rows);

      // 2. Churn 분석
      const churnResult = analyzeChurn(rows, cohortResult.cohortInfo);

      // 3. LTV 예측
      const ltvResult = predictLTV(cohortResult.retentionMatrix);

      // 4. 통계 검정 (Chi-Square, Kaplan-Meier, Log-Rank)
      const userActivity = analyzeUserActivity(rows, cohortResult.cohortInfo);
      const statsResult = runStatisticalTests(
        rows,
        cohortResult.cohortInfo,
        churnResult,
        userActivity
      );

      // 결과 전송
      self.postMessage({
        type: 'SUCCESS',
        payload: {
          cohortResult,
          churnResult,
          ltvResult,
          statsResult,
        },
      });
    } catch (error) {
      self.postMessage({
        type: 'ERROR',
        error: error.message,
      });
    }
  }
};
