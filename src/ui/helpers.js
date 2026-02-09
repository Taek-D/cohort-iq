// ui/helpers.js — main.js에서 추출한 순수 함수 (테스트 가능)
import { t } from '../i18n/index.js';

/**
 * CSV 파일 여부 검증
 * @param {{ type: string, name: string }} file
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateCSVFile(file) {
  if (!file) {
    return { valid: false, error: t('validation.csvOnly') };
  }
  if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
    return { valid: false, error: t('validation.csvOnly') };
  }
  return { valid: true };
}

/**
 * 상태 메시지 HTML 생성
 * @param {string} message
 * @param {'info'|'loading'|'success'|'error'} type
 * @returns {string} HTML 문자열
 */
export function formatStatusHTML(message, type = 'info') {
  const spinner =
    type === 'loading'
      ? '<svg class="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>'
      : '';
  return `<div class="status-msg status-${type}"><span>${message}</span>${spinner}</div>`;
}

/**
 * 검증 에러 목록 HTML 생성
 * @param {string[]} errors
 * @returns {string} HTML 문자열
 */
export function formatValidationErrorsHTML(errors) {
  if (!errors || errors.length === 0) return '';
  const list = errors
    .slice(0, 3)
    .map((e) => `<li>${e}</li>`)
    .join('');
  const extra =
    errors.length > 3 ? `<li>${t('validation.andMore', { count: errors.length - 3 })}</li>` : '';
  return `<div class="status-msg status-error" style="flex-direction: column; align-items: flex-start; gap: 4px; margin-top: 8px;">
      <strong style="font-size: 13px;">${t('validation.dataError')}</strong>
      <ul style="font-size: 12px; list-style: disc; padding-left: 16px; opacity: 0.85;">
        ${list}${extra}
      </ul>
    </div>`;
}

/**
 * 검증 경고 목록 HTML 생성
 * @param {string[]} warnings
 * @returns {string} HTML 문자열
 */
export function formatValidationWarningsHTML(warnings) {
  if (!warnings || warnings.length === 0) return '';
  const list = warnings
    .slice(0, 3)
    .map((w) => `<li>${w}</li>`)
    .join('');
  const extra =
    warnings.length > 3
      ? `<li>${t('validation.andMore', { count: warnings.length - 3 })}</li>`
      : '';
  return `<div class="status-msg" style="background: var(--amber-bg); color: var(--amber); border: 1px solid var(--amber-border); flex-direction: column; align-items: flex-start; gap: 4px; margin-top: 8px;">
      <strong style="font-size: 13px;">${t('validation.dataWarning')}</strong>
      <ul style="font-size: 12px; list-style: disc; padding-left: 16px; opacity: 0.85;">
        ${list}${extra}
      </ul>
    </div>`;
}

/**
 * 분석 결과에서 대시보드 통계 추출
 * @param {object} cohortResult
 * @param {object} churnResult
 * @returns {{ cohorts: string, users: string, dataPoints: string, duration: string }}
 */
export function extractDisplayStats(cohortResult, churnResult) {
  return {
    cohorts: cohortResult.cohorts.length.toLocaleString(),
    users: churnResult.performance.usersAnalyzed.toLocaleString(),
    dataPoints: cohortResult.retentionMatrix.length.toLocaleString(),
    duration: `${Math.round(cohortResult.performance.duration)}ms`,
  };
}
