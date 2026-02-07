import { describe, it, expect } from 'vitest';
import { validateCohortData, validateFileSize } from './dataValidator.js';
import { addDays } from 'date-fns';

describe('validateCohortData', () => {
    it('should return error for empty data', () => {
        const result = validateCohortData([]);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('데이터가 비어있습니다.');
    });

    it('should return error for missing required columns', () => {
        const data = [{ user_id: '1', signup_date: '2023-01-01' }]; // missing event_date
        const result = validateCohortData(data);
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('필수 컬럼이 누락되었습니다');
    });

    it('should validate correct data', () => {
        const data = [
            { user_id: '1', signup_date: '2023-01-01', event_date: '2023-01-01' },
            { user_id: '2', signup_date: '2023-01-02', event_date: '2023-01-05' }
        ];
        const result = validateCohortData(data);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.stats.valid).toBe(2);
    });

    it('should detect invalid date formats', () => {
        const data = [
            { user_id: '1', signup_date: 'invalid', event_date: '2023-01-01' }
        ];
        const result = validateCohortData(data);
        expect(result.valid).toBe(false); // Since strict validData check returns 0 valid rows
    });

    it('should detect when event_date is before signup_date', () => {
        const data = [
            { user_id: '1', signup_date: '2023-01-05', event_date: '2023-01-01' }
        ];
        const result = validateCohortData(data);
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('활동일이 가입일보다 빠릅니다');
    });

    it('should detect future dates', () => {
        const futureDate = addDays(new Date(), 365).toISOString().split('T')[0];
        const data = [
            { user_id: '1', signup_date: '2023-01-01', event_date: futureDate }
        ];
        const result = validateCohortData(data);
        // Expecting valid=false or specific error about future date, depending on implementation
        // Current implementation doesn't check future date, so this test might fail until implemented
        expect(result.errors.join('')).toContain('미래의 날짜');
    });

    it('should warn for small datasets', () => {
        const data = [
            { user_id: '1', signup_date: '2023-01-01', event_date: '2023-01-01' }
        ];
        const result = validateCohortData(data);
        // Expecting a warning in errors or a specific warning field if we design it that way.
        // For now, let's assume it adds to 'warnings' or 'errors' but treated as warning?
        // The plan said "Add a warning rather than an error".
        // If it's a warning, valid might still be true.
        // Let's adjust the implementation to separate warnings.

        // This test anticipates the new structure.
        expect(result.warnings).toBeDefined();
        if (result.warnings) {
            expect(result.warnings.length).toBeGreaterThan(0);
        }
    });
});

describe('validateFileSize', () => {
    it('should validate small file size', () => {
        const result = validateFileSize(100);
        expect(result.valid).toBe(true);
    });

    it('should invalidate large file size', () => {
        const result = validateFileSize(10001);
        expect(result.valid).toBe(false);
    });
});
