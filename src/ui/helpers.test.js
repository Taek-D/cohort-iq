import { describe, it, expect } from 'vitest';
import {
  validateCSVFile,
  formatStatusHTML,
  formatValidationErrorsHTML,
  formatValidationWarningsHTML,
  extractDisplayStats,
} from './helpers.js';

// ─── validateCSVFile ───

describe('validateCSVFile', () => {
  it('accepts .csv file by MIME type', () => {
    const result = validateCSVFile({ type: 'text/csv', name: 'data.csv' });
    expect(result).toEqual({ valid: true });
  });

  it('accepts .csv file by extension even with wrong MIME', () => {
    const result = validateCSVFile({
      type: 'application/octet-stream',
      name: 'report.csv',
    });
    expect(result).toEqual({ valid: true });
  });

  it('rejects non-CSV file', () => {
    const result = validateCSVFile({ type: 'text/plain', name: 'data.txt' });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('CSV');
  });

  it('rejects null/undefined file', () => {
    expect(validateCSVFile(null).valid).toBe(false);
    expect(validateCSVFile(undefined).valid).toBe(false);
  });

  it('rejects xlsx file', () => {
    const result = validateCSVFile({
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      name: 'data.xlsx',
    });
    expect(result.valid).toBe(false);
  });
});

// ─── formatStatusHTML ───

describe('formatStatusHTML', () => {
  it('generates info status', () => {
    const html = formatStatusHTML('테스트 메시지', 'info');
    expect(html).toContain('status-info');
    expect(html).toContain('테스트 메시지');
    expect(html).not.toContain('spinner');
  });

  it('generates loading status with spinner', () => {
    const html = formatStatusHTML('로딩 중...', 'loading');
    expect(html).toContain('status-loading');
    expect(html).toContain('spinner');
  });

  it('generates error status', () => {
    const html = formatStatusHTML('에러 발생', 'error');
    expect(html).toContain('status-error');
    expect(html).toContain('에러 발생');
  });

  it('generates success status', () => {
    const html = formatStatusHTML('완료!', 'success');
    expect(html).toContain('status-success');
  });

  it('defaults to info type', () => {
    const html = formatStatusHTML('기본');
    expect(html).toContain('status-info');
  });

  it('escapes HTML in message', () => {
    const html = formatStatusHTML('<img src=x onerror=alert(1)>', 'error');
    expect(html).toContain('&lt;img');
    expect(html).not.toContain('<img');
  });
});

// ─── formatValidationErrorsHTML ───

describe('formatValidationErrorsHTML', () => {
  it('returns empty string for no errors', () => {
    expect(formatValidationErrorsHTML([])).toBe('');
    expect(formatValidationErrorsHTML(null)).toBe('');
    expect(formatValidationErrorsHTML(undefined)).toBe('');
  });

  it('renders up to 3 errors', () => {
    const html = formatValidationErrorsHTML(['에러1', '에러2', '에러3']);
    expect(html).toContain('에러1');
    expect(html).toContain('에러2');
    expect(html).toContain('에러3');
    expect(html).toContain('데이터 오류');
    expect(html).not.toContain('외');
  });

  it('truncates beyond 3 errors with count', () => {
    const errors = ['a', 'b', 'c', 'd', 'e'];
    const html = formatValidationErrorsHTML(errors);
    expect(html).toContain('a');
    expect(html).toContain('b');
    expect(html).toContain('c');
    expect(html).not.toContain('>d<');
    expect(html).toContain('외 2건');
  });

  it('shows status-error class', () => {
    const html = formatValidationErrorsHTML(['에러']);
    expect(html).toContain('status-error');
  });

  it('escapes HTML in error items', () => {
    const html = formatValidationErrorsHTML(['<script>alert(1)</script>']);
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>');
  });
});

// ─── formatValidationWarningsHTML ───

describe('formatValidationWarningsHTML', () => {
  it('returns empty string for no warnings', () => {
    expect(formatValidationWarningsHTML([])).toBe('');
    expect(formatValidationWarningsHTML(null)).toBe('');
  });

  it('renders warnings with amber styling', () => {
    const html = formatValidationWarningsHTML(['경고1']);
    expect(html).toContain('경고1');
    expect(html).toContain('데이터 경고');
    expect(html).toContain('amber');
  });

  it('truncates beyond 3 warnings', () => {
    const warnings = ['w1', 'w2', 'w3', 'w4'];
    const html = formatValidationWarningsHTML(warnings);
    expect(html).toContain('외 1건');
  });
});

// ─── extractDisplayStats ───

describe('extractDisplayStats', () => {
  const mockCohortResult = {
    cohorts: [{ name: 'C1' }, { name: 'C2' }, { name: 'C3' }],
    retentionMatrix: Array(24).fill({}),
    performance: { duration: 15.678 },
  };

  const mockChurnResult = {
    performance: { usersAnalyzed: 150 },
  };

  it('extracts formatted stats', () => {
    const stats = extractDisplayStats(mockCohortResult, mockChurnResult);
    expect(stats.cohorts).toBe('3');
    expect(stats.users).toBe('150');
    expect(stats.dataPoints).toBe('24');
    expect(stats.duration).toBe('16ms');
  });

  it('formats large numbers with locale separators', () => {
    const big = {
      cohorts: Array(1200).fill({}),
      retentionMatrix: Array(50000).fill({}),
      performance: { duration: 1234.5 },
    };
    const bigChurn = { performance: { usersAnalyzed: 10000 } };
    const stats = extractDisplayStats(big, bigChurn);
    expect(stats.duration).toBe('1235ms');
  });

  it('rounds duration correctly', () => {
    const result = {
      cohorts: [{}],
      retentionMatrix: [{}],
      performance: { duration: 0.4 },
    };
    const churn = { performance: { usersAnalyzed: 1 } };
    const stats = extractDisplayStats(result, churn);
    expect(stats.duration).toBe('0ms');
  });
});
