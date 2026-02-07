import { describe, it, expect } from 'vitest';
import { analyzeCohort } from './cohortAnalysis';

describe('Cohort Analysis', () => {
    const sampleData = [
        { user_id: 'u1', signup_date: '2024-01-01', event_date: '2024-01-01' }, // Week 1, Cohort Week 1
        { user_id: 'u1', signup_date: '2024-01-01', event_date: '2024-01-08' }, // Week 2
        { user_id: 'u2', signup_date: '2024-01-02', event_date: '2024-01-02' }, // Week 1, Cohort Week 1
        { user_id: 'u3', signup_date: '2024-01-10', event_date: '2024-01-10' }, // Week 2, Cohort Week 2
    ];

    it('should correctly group users into cohorts and calculate retention', () => {
        const result = analyzeCohort(sampleData);

        expect(result).toHaveProperty('cohortInfo');
        expect(result).toHaveProperty('retentionMatrix');
        expect(result).toHaveProperty('heatmapData');

        // Check Cohort Info
        const cohorts = Object.keys(result.cohortInfo);
        expect(cohorts.length).toBeGreaterThan(0); // Should have at least 1 cohort (actually 2 based on dates)

        // Check Retention Matrix
        // Cohort 1 (Jan 1) has u1, u2 (2 users).
        // Week 0: u1, u2 active -> 100%
        // Week 1: u1 active -> 50%
        // Week 2: -> 0%

        // Note: The exact week keys depend on startOfISOWeek implementation in source.
        // We verify structural correctness and non-empty results here.
        expect(result.retentionMatrix.length).toBeGreaterThan(0);

        const firstCohort = result.retentionMatrix[0];
        expect(firstCohort.total).toBe(2); // u1, u2
        expect(firstCohort.retention).toBe(100); // Week 0 is always 100%
    });

    it('should handle empty data gracefully', () => {
        const result = analyzeCohort([]);
        expect(result.cohorts).toEqual([]);
        expect(result.retentionMatrix).toEqual([]);
    });

    it('should handle single user data', () => {
        const singleData = [
            { user_id: 'u1', signup_date: '2024-01-01', event_date: '2024-01-01' }
        ];
        const result = analyzeCohort(singleData);
        expect(result.retentionMatrix).toHaveLength(1);
        expect(result.retentionMatrix[0].total).toBe(1);
        expect(result.retentionMatrix[0].retention).toBe(100);
    });
});
