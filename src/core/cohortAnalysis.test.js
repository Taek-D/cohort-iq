import { describe, it, expect } from 'vitest';
import { analyzeCohort } from './cohortAnalysis';

describe('Cohort Analysis', () => {
    // 프로덕션과 동일하게 Date 객체 사용
    const sampleData = [
        { user_id: 'u1', signup_date: new Date('2024-01-01'), event_date: new Date('2024-01-01') },
        { user_id: 'u1', signup_date: new Date('2024-01-01'), event_date: new Date('2024-01-08') },
        { user_id: 'u2', signup_date: new Date('2024-01-02'), event_date: new Date('2024-01-02') },
        { user_id: 'u3', signup_date: new Date('2024-01-10'), event_date: new Date('2024-01-10') },
    ];

    it('should correctly group users into cohorts and calculate retention', () => {
        const result = analyzeCohort(sampleData);

        expect(result).toHaveProperty('cohortInfo');
        expect(result).toHaveProperty('retentionMatrix');
        expect(result).toHaveProperty('heatmapData');

        // u1, u2는 같은 주 → 1개 코호트, u3는 다른 주 → 총 2개
        expect(result.cohorts).toHaveLength(2);

        // 첫 번째 코호트: u1, u2 (2명)
        const firstCohort = result.retentionMatrix[0];
        expect(firstCohort.total).toBe(2);
        expect(firstCohort.retention).toBe(100); // Week 0

        // Week 1: u1만 활동 → 50%
        const week1 = result.retentionMatrix.find(
            (r) => r.cohort === firstCohort.cohort && r.week === 1
        );
        expect(week1).toBeDefined();
        expect(week1.users).toBe(1);
        expect(week1.retention).toBe(50);
    });

    it('should handle empty data gracefully', () => {
        const result = analyzeCohort([]);
        expect(result.cohorts).toEqual([]);
        expect(result.retentionMatrix).toEqual([]);
        expect(result.performance.duration).toBeDefined();
    });

    it('should handle single user data', () => {
        const singleData = [
            { user_id: 'u1', signup_date: new Date('2024-01-01'), event_date: new Date('2024-01-01') },
        ];
        const result = analyzeCohort(singleData);
        expect(result.cohorts).toHaveLength(1);
        expect(result.retentionMatrix).toHaveLength(1);
        expect(result.retentionMatrix[0].total).toBe(1);
        expect(result.retentionMatrix[0].retention).toBe(100);
    });

    it('should handle duplicate events on same day', () => {
        const dupData = [
            { user_id: 'u1', signup_date: new Date('2024-01-01'), event_date: new Date('2024-01-01') },
            { user_id: 'u1', signup_date: new Date('2024-01-01'), event_date: new Date('2024-01-01') },
            { user_id: 'u1', signup_date: new Date('2024-01-01'), event_date: new Date('2024-01-08') },
        ];
        const result = analyzeCohort(dupData);
        // 중복 이벤트가 있어도 고유 사용자 수는 1
        expect(result.retentionMatrix[0].total).toBe(1);
        expect(result.retentionMatrix[0].users).toBe(1);
    });
});
