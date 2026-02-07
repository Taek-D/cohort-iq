// analysisWorker.js - 계산 집약적 분석 작업을 수행하는 Web Worker
import { analyzeCohort } from './cohortAnalysis.js';
import { analyzeChurn } from './churnAnalysis.js';

self.onmessage = (e) => {
    const { type, data } = e.data;

    if (type === 'ANALYZE') {
        try {
            // 1. 코호트 분석
            const cohortResult = analyzeCohort(data);

            // 2. Churn 분석
            // cohortResult에 cohortInfo가 포함되어 있음
            const churnResult = analyzeChurn(data, cohortResult.cohortInfo);

            // 결과 전송
            self.postMessage({
                type: 'SUCCESS',
                payload: {
                    cohortResult,
                    churnResult
                }
            });

        } catch (error) {
            console.error('Worker Error:', error);
            self.postMessage({
                type: 'ERROR',
                error: error.message
            });
        }
    }
};
