// analysisWorker.js - 계산 집약적 분석 작업을 수행하는 Web Worker
import { analyzeCohort } from './cohortAnalysis.js';
import { analyzeChurn } from './churnAnalysis.js';
import { predictLTV } from './ltvPrediction.js';

self.onmessage = (e) => {
    const { type, data } = e.data;

    if (type === 'ANALYZE') {
        try {
            // 1. 코호트 분석
            const cohortResult = analyzeCohort(data);

            // 2. Churn 분석
            const churnResult = analyzeChurn(data, cohortResult.cohortInfo);

            // 3. LTV 예측
            const ltvResult = predictLTV(cohortResult.retentionMatrix);

            // 결과 전송
            self.postMessage({
                type: 'SUCCESS',
                payload: {
                    cohortResult,
                    churnResult,
                    ltvResult,
                }
            });

        } catch (error) {
            self.postMessage({
                type: 'ERROR',
                error: error.message
            });
        }
    }
};
