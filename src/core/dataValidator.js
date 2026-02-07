// dataValidator.js - CSV 데이터 검증
import { parseISO, isValid, isAfter, startOfToday } from 'date-fns';

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
        return { valid: false, data: [], errors: ['데이터가 비어있습니다.'], warnings: [] };
    }

    const firstRow = data[0];
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));

    if (missingColumns.length > 0) {
        errors.push(`필수 컬럼이 누락되었습니다: ${missingColumns.join(', ')}`);
        return { valid: false, data: [], errors, warnings: [] };
    }

    const today = startOfToday();

    // 2. 각 행 검증
    data.forEach((row, index) => {
        const rowErrors = [];

        // user_id 검증
        if (!row.user_id || row.user_id.trim() === '') {
            rowErrors.push(`user_id 누락 (필수)`);
        } else {
            userSet.add(row.user_id.trim());
        }

        // signup_date 검증
        const signupDate = parseISO(row.signup_date);
        if (!isValid(signupDate)) {
            rowErrors.push(`가입일(signup_date) 형식 오류: '${row.signup_date}' (YYYY-MM-DD 형식 권장)`);
        } else if (isAfter(signupDate, today)) {
            rowErrors.push(`가입일이 미래의 날짜입니다: '${row.signup_date}'`);
        }

        // event_date 검증
        const eventDate = parseISO(row.event_date);
        if (!isValid(eventDate)) {
            rowErrors.push(`활동일(event_date) 형식 오류: '${row.event_date}' (YYYY-MM-DD 형식 권장)`);
        } else if (isAfter(eventDate, today)) {
            rowErrors.push(`활동일이 미래의 날짜입니다: '${row.event_date}'`);
        }

        // 날짜 순서 검증 (signup_date <= event_date)
        if (isValid(signupDate) && isValid(eventDate) && isAfter(signupDate, eventDate)) {
            rowErrors.push(`데이터 논리 오류: 활동일이 가입일보다 빠릅니다 (${row.signup_date} > ${row.event_date})`);
        }

        if (rowErrors.length > 0) {
            errors.push(`행 ${index + 2}: ${rowErrors.join(', ')}`);
        } else {
            validData.push({
                user_id: row.user_id.trim(),
                signup_date: signupDate,
                event_date: eventDate
            });
        }
    });

    // 3. 데이터셋 레벨 경고 (Warnings)
    if (validData.length > 0) {
        if (userSet.size < 10) {
            warnings.push(`사용자 수가 너무 적습니다 (${userSet.size}명). 코호트 분석 결과가 유의미하지 않을 수 있습니다.`);
        }
        if (userSet.size === 1) {
            warnings.push('단일 사용자의 데이터입니다. 일반적인 코호트 분석보다는 개별 활동 로그에 가깝습니다.');
        }
    }

    // 4. 최종 검증 결과
    if (validData.length === 0) {
        return { valid: false, data: [], errors, warnings };
    }

    return {
        // 에러가 있어도 유효한 데이터가 있으면 진행 가능하게 할 수도 있지만, 
        // 현재 로직은 errors.length === 0 일때만 완전한 성공으로 간주.
        // 하지만 행별 에러는 해당 행만 제외하고 진행하는 것이 일반적임.
        // 여기서는 '치명적 에러'가 아니면 valid: true로 반환하고 errors에 로그를 남기는 방식으로 감.
        // 단, 기존 로직과의 호환성을 위해 errors가 있으면 valid: false로 유지하되, 
        // 호출부에서 errors가 있어도 validData가 있으면 선택적으로 진행할 수 있게 구조 변경 고려.
        // 현재 요구사항: "에러가 있으면 중단" -> 그대로 유지.

        valid: errors.length === 0,
        data: validData,
        errors,
        warnings,
        stats: {
            total: data.length,
            valid: validData.length,
            invalid: data.length - validData.length,
            uniqueUsers: userSet.size
        }
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
            error: `파일이 너무 큽니다. 최대 ${MAX_ROWS}행까지 지원됩니다. (현재: ${rowCount}행)`
        };
    }
    return { valid: true };
}
