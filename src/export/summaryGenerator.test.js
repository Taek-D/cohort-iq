import { describe, it, expect } from 'vitest';
import { prepareSummaryData, getHealthGrade, generateSummaryHTML } from './summaryGenerator';

describe('Summary Generator', () => {
    const mockCohortResult = {
        cohorts: ['2024-01-01', '2024-01-08'],
        retentionMatrix: [
            { cohort: '2024-01-01', week: 0, retention: 100, users: 10, total: 10 },
            { cohort: '2024-01-01', week: 1, retention: 60, users: 6, total: 10 },
            { cohort: '2024-01-01', week: 2, retention: 40, users: 4, total: 10 },
            { cohort: '2024-01-01', week: 3, retention: 30, users: 3, total: 10 },
            { cohort: '2024-01-01', week: 4, retention: 25, users: 2.5, total: 10 },
            { cohort: '2024-01-08', week: 0, retention: 100, users: 5, total: 5 },
            { cohort: '2024-01-08', week: 1, retention: 80, users: 4, total: 5 },
            { cohort: '2024-01-08', week: 2, retention: 60, users: 3, total: 5 },
            { cohort: '2024-01-08', week: 3, retention: 40, users: 2, total: 5 },
            { cohort: '2024-01-08', week: 4, retention: 35, users: 1.75, total: 5 },
        ],
        performance: { duration: 5 },
    };

    const mockChurnResult = {
        riskSegments: {
            segments: { CRITICAL: [], HIGH: [], MEDIUM: [], LOW: [] },
            summary: { total: 15, critical: 3, high: 4, medium: 5, low: 3, criticalPercentage: 20, highPercentage: 27 },
        },
        insights: [
            { type: 'ALERT', severity: 'CRITICAL', title: 'Test insight', description: 'desc', action: 'act', affectedUsers: 3 },
        ],
        performance: { duration: 3 },
    };

    describe('prepareSummaryData', () => {
        it('should compute summary metrics from cohort and churn results', () => {
            const summary = prepareSummaryData(mockCohortResult, mockChurnResult);

            expect(summary.metadata.totalCohorts).toBe(2);
            expect(summary.metadata.dateRange.from).toBe('2024-01-01');
            expect(summary.metadata.dateRange.to).toBe('2024-01-08');

            // Week 4 평균 리텐션: (25 + 35) / 2 = 30
            expect(summary.keyMetrics.week4Retention).toBe(30);

            // 건강도 점수 > 0
            expect(summary.keyMetrics.healthScore).toBeGreaterThan(0);
            expect(summary.keyMetrics.healthScore).toBeLessThanOrEqual(100);

            expect(summary.churnRisk.critical).toBe(3);
            expect(summary.churnRisk.total).toBe(15);

            expect(summary.insights).toHaveLength(1);
            expect(summary.performance.totalDuration).toBe(8);
        });

        it('should return defaults for null inputs', () => {
            const summary = prepareSummaryData(null, null);
            expect(summary.metadata.totalCohorts).toBe(0);
            expect(summary.keyMetrics.healthScore).toBe(0);
            expect(summary.insights).toEqual([]);
        });

        it('should return defaults for empty cohorts', () => {
            const emptyCohort = { cohorts: [], retentionMatrix: [], performance: { duration: 0 } };
            const emptyChurn = { riskSegments: { segments: {}, summary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, criticalPercentage: 0, highPercentage: 0 } }, insights: [], performance: { duration: 0 } };
            const summary = prepareSummaryData(emptyCohort, emptyChurn);
            expect(summary.metadata.totalCohorts).toBe(0);
        });
    });

    describe('getHealthGrade', () => {
        it('should return grade A for score >= 80', () => {
            expect(getHealthGrade(80).grade).toBe('A');
            expect(getHealthGrade(100).grade).toBe('A');
        });

        it('should return grade B for score 60-79', () => {
            expect(getHealthGrade(60).grade).toBe('B');
            expect(getHealthGrade(79).grade).toBe('B');
        });

        it('should return grade C for score 40-59', () => {
            expect(getHealthGrade(40).grade).toBe('C');
            expect(getHealthGrade(59).grade).toBe('C');
        });

        it('should return grade D for score < 40', () => {
            expect(getHealthGrade(0).grade).toBe('D');
            expect(getHealthGrade(39).grade).toBe('D');
        });
    });

    describe('generateSummaryHTML', () => {
        it('should generate valid HTML with summary data', () => {
            const summary = prepareSummaryData(mockCohortResult, mockChurnResult);
            const html = generateSummaryHTML(summary);

            expect(html).toContain('Executive Summary');
            expect(html).toContain('CohortIQ');
            expect(html).toContain('2024-01-01');
            // 건강도 점수가 포함되어야 함
            expect(html).toContain(String(summary.keyMetrics.healthScore));
        });
    });
});
