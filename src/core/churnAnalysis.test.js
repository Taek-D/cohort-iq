import { describe, it, expect } from 'vitest';
import { analyzeChurn, analyzeUserActivity, calculateChurnRisk } from './churnAnalysis';

describe('Churn Analysis', () => {
    // 프로덕션과 동일하게 Date 객체 사용
    const mockCohortInfo = {
        userCohortMap: new Map([
            ['u1', { cohort: '2024-01-01', signup_date: new Date('2024-01-01') }],
            ['u2', { cohort: '2024-01-01', signup_date: new Date('2024-01-01') }],
        ]),
    };

    const sampleData = [
        { user_id: 'u1', signup_date: new Date('2024-01-01'), event_date: new Date('2024-01-01') },
        { user_id: 'u1', signup_date: new Date('2024-01-01'), event_date: new Date('2024-01-08') },
        { user_id: 'u2', signup_date: new Date('2024-01-01'), event_date: new Date('2024-01-02') },
    ];

    it('should analyze churn risk and segment users', () => {
        const result = analyzeChurn(sampleData, mockCohortInfo);

        expect(result).toHaveProperty('riskSegments');
        expect(result).toHaveProperty('churnRiskData');
        expect(result).toHaveProperty('insights');

        // u2는 가입 직후 1회만 활동 → 오래 전이므로 CRITICAL
        const u2 = result.churnRiskData.find((u) => u.userId === 'u2');
        expect(u2).toBeDefined();
        expect(u2.riskLevel).toBe('CRITICAL');
        expect(u2.metrics.weeksSinceLastActivity).toBeGreaterThan(0);
        expect(u2.metrics.activityDensity).toBeLessThan(25);

        // 전체 분포 확인
        const { summary } = result.riskSegments;
        expect(summary.total).toBe(2);
        expect(summary.critical + summary.high + summary.medium + summary.low).toBe(2);
    });

    it('should generate at least one insight for high-risk data', () => {
        const result = analyzeChurn(sampleData, mockCohortInfo);
        expect(result.insights).toBeInstanceOf(Array);
        // 2024년 데이터를 2026년에 분석하면 전원 CRITICAL → 인사이트 1개 이상
        expect(result.insights.length).toBeGreaterThan(0);
        expect(result.insights[0]).toHaveProperty('severity');
        expect(result.insights[0]).toHaveProperty('action');
    });

    it('should return empty results for empty data', () => {
        const result = analyzeChurn([], null);
        expect(result.churnRiskData).toEqual([]);
        expect(result.insights).toEqual([]);
        expect(result.riskSegments.summary.total).toBe(0);
    });

    it('should classify boundary scores correctly', () => {
        // 단일 사용자: 가입 후 즉시 활동, 이후 미활동 → 시간이 지나면 CRITICAL
        const recentCohortInfo = {
            userCohortMap: new Map([
                ['active', { cohort: '2026-02-01', signup_date: new Date('2026-02-01') }],
            ]),
        };
        const recentData = [
            { user_id: 'active', signup_date: new Date('2026-02-01'), event_date: new Date('2026-02-01') },
            { user_id: 'active', signup_date: new Date('2026-02-01'), event_date: new Date('2026-02-08') },
        ];

        const result = analyzeChurn(recentData, recentCohortInfo);
        expect(result.churnRiskData).toHaveLength(1);
        // 최근 활동이 1주 전 정도 → LOW 또는 MEDIUM
        const user = result.churnRiskData[0];
        expect(['LOW', 'MEDIUM']).toContain(user.riskLevel);
        expect(user.riskScore).toBeLessThan(50);
    });

    it('should calculate trailing consecutive inactive weeks from current date', () => {
        const cohortInfo = {
            userCohortMap: new Map([
                ['u1', { cohort: '2025-01-06', signup_date: new Date('2025-01-06') }],
            ]),
        };
        const data = [
            { user_id: 'u1', signup_date: new Date('2025-01-06'), event_date: new Date('2025-01-06') },
            { user_id: 'u1', signup_date: new Date('2025-01-06'), event_date: new Date('2025-01-13') },
        ];

        const activity = analyzeUserActivity(data, cohortInfo);
        const risk = calculateChurnRisk(activity, new Date('2025-02-12'));

        expect(risk).toHaveLength(1);
        expect(risk[0].metrics.consecutiveInactiveWeeks).toBe(4);
    });
});
