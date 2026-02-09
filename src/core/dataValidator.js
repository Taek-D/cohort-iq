// dataValidator.js - CSV 데이터 검증
import { parseISO, isValid, isAfter, startOfToday } from 'date-fns';
import { t } from '../i18n/index.js';

/**
 * CSV 데이터 검증 및 정제
 * @param {Array} data - PapaParse로 파싱된 데이터
 * @returns {Object} { valid: boolean, data: Array, errors: Array, warnings: Array }
 */
export function validateCohortData(data) {
  const errors = [];
  const warnings = [];
  const validData = [];
  const userSet = new Set();

  // 1. 필수 컬럼 확인
  const requiredColumns = ['user_id', 'signup_date', 'event_date'];
  if (!data || data.length === 0) {
    return {
      valid: false,
      data: [],
      errors: [t('validation.emptyData')],
      warnings: [],
    };
  }

  const firstRow = data[0];
  const missingColumns = requiredColumns.filter((col) => !(col in firstRow));

  if (missingColumns.length > 0) {
    errors.push(
      t('validation.missingColumns', { columns: missingColumns.join(', ') })
    );
    return { valid: false, data: [], errors, warnings: [] };
  }

  const today = startOfToday();

  // 2. 각 행 검증
  data.forEach((row, index) => {
    const rowErrors = [];

    // user_id 검증
    if (!row.user_id || row.user_id.trim() === '') {
      rowErrors.push(t('validation.missingUserId'));
    } else {
      userSet.add(row.user_id.trim());
    }

    // signup_date 검증
    const signupDate = parseISO(row.signup_date);
    if (!isValid(signupDate)) {
      rowErrors.push(
        t('validation.invalidSignupDate', { value: row.signup_date })
      );
    } else if (isAfter(signupDate, today)) {
      rowErrors.push(
        t('validation.futureSignupDate', { value: row.signup_date })
      );
    }

    // event_date 검증
    const eventDate = parseISO(row.event_date);
    if (!isValid(eventDate)) {
      rowErrors.push(
        t('validation.invalidEventDate', { value: row.event_date })
      );
    } else if (isAfter(eventDate, today)) {
      rowErrors.push(
        t('validation.futureEventDate', { value: row.event_date })
      );
    }

    // 날짜 순서 검증 (signup_date <= event_date)
    if (
      isValid(signupDate) &&
      isValid(eventDate) &&
      isAfter(signupDate, eventDate)
    ) {
      rowErrors.push(
        t('validation.eventBeforeSignup', {
          signup: row.signup_date,
          event: row.event_date,
        })
      );
    }

    if (rowErrors.length > 0) {
      errors.push(
        t('validation.row', {
          index: index + 2,
          errors: rowErrors.join(', '),
        })
      );
    } else {
      validData.push({
        user_id: row.user_id.trim(),
        signup_date: signupDate,
        event_date: eventDate,
      });
    }
  });

  // 3. 데이터셋 레벨 경고 (Warnings)
  if (validData.length > 0) {
    if (userSet.size < 10) {
      warnings.push(t('validation.tooFewUsers', { count: userSet.size }));
    }
    if (userSet.size === 1) {
      warnings.push(t('validation.singleUser'));
    }
  }

  // 4. 최종 검증 결과
  if (validData.length === 0) {
    return { valid: false, data: [], errors, warnings };
  }

  return {
    valid: errors.length === 0,
    data: validData,
    errors,
    warnings,
    stats: {
      total: data.length,
      valid: validData.length,
      invalid: data.length - validData.length,
      uniqueUsers: userSet.size,
    },
  };
}

/**
 * 파일 크기 검증 (10,000행 제한)
 */
export function validateFileSize(rowCount) {
  const MAX_ROWS = 10000;
  if (rowCount > MAX_ROWS) {
    return {
      valid: false,
      error: t('validation.fileTooLarge', {
        max: MAX_ROWS.toLocaleString(),
        count: rowCount.toLocaleString(),
      }),
    };
  }
  return { valid: true };
}
