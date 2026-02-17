// cohortAnalysis.js - 코호트 리텐션 분석 엔진
import { format, differenceInWeeks, startOfWeek, parseISO } from 'date-fns';

/**
 * 코호트 그룹화 (주 단위)
 * @param {Array} validatedData - 검증된 데이터
 * @returns {Object} { cohorts: Map, userCohortMap: Map }
 */
export function groupByCohort(validatedData) {
    const cohorts = new Map(); // 코호트별 사용자 목록
    const userCohortMap = new Map(); // 사용자 -> 코호트 매핑

    validatedData.forEach(row => {
        // signup_date를 주의 시작일로 변환 (월요일 기준)
        const cohortWeek = startOfWeek(row.signup_date, { weekStartsOn: 1 });
        const cohortKey = format(cohortWeek, 'yyyy-MM-dd');

        // 코호트에 사용자 추가
        if (!cohorts.has(cohortKey)) {
            cohorts.set(cohortKey, new Set());
        }
        cohorts.get(cohortKey).add(row.user_id);

        // 사용자 -> 코호트 매핑
        if (!userCohortMap.has(row.user_id)) {
            userCohortMap.set(row.user_id, {
                cohort: cohortKey,
                signup_date: row.signup_date
            });
        }
    });

    return { cohorts, userCohortMap };
}

/**
 * 리텐션 계산 (주 단위)
 * @param {Array} validatedData - 검증된 데이터
 * @param {Object} cohortInfo - groupByCohort 결과
 * @returns {Array} 리텐션 매트릭스 데이터
 */
export function calculateRetention(validatedData, cohortInfo) {
    const { cohorts, userCohortMap } = cohortInfo;
    const retentionMatrix = [];

    // 각 코호트별 리텐션 계산
    cohorts.forEach((users, cohortKey) => {
        // Avoid UTC parsing drift from `new Date('yyyy-MM-dd')` in some timezones.
        const cohortDate = parseISO(cohortKey);
        const weeklyRetention = new Map(); // Week N -> Set<user_id>

        // Week 0 초기화 (가입 주 — 코호트 전원 활성)
        weeklyRetention.set(0, new Set(users));

        // 각 이벤트를 주차별로 분류
        validatedData.forEach(row => {
            const userInfo = userCohortMap.get(row.user_id);

            // 이 사용자가 현재 코호트에 속하는지 확인
            if (userInfo && userInfo.cohort === cohortKey) {
                const weeksSinceSignup = differenceInWeeks(
                    row.event_date,
                    cohortDate,
                    { weekStartsOn: 1 }
                );

                // 주차별 활성 사용자 추적
                if (weeksSinceSignup > 0) {
                    if (!weeklyRetention.has(weeksSinceSignup)) {
                        weeklyRetention.set(weeksSinceSignup, new Set());
                    }
                    weeklyRetention.get(weeksSinceSignup).add(row.user_id);
                }
            }
        });

        // 리텐션율 계산
        const cohortSize = users.size;
        const maxWeek = weeklyRetention.size > 0 ? Math.max(...weeklyRetention.keys()) : 0;

        for (let week = 0; week <= maxWeek; week++) {
            const activeUsers = weeklyRetention.has(week)
                ? weeklyRetention.get(week).size
                : 0;

            const retentionRate = cohortSize > 0
                ? (activeUsers / cohortSize) * 100
                : 0;

            retentionMatrix.push({
                cohort: cohortKey,
                week: week,
                users: activeUsers,
                total: cohortSize,
                retention: Math.round(retentionRate * 10) / 10 // 소수점 1자리
            });
        }
    });

    return retentionMatrix;
}

/**
 * 히트맵용 데이터 변환
 * @param {Array} retentionMatrix - calculateRetention 결과
 * @returns {Array} Chart.js Matrix 플러그인 형식 데이터
 */
export function formatForHeatmap(retentionMatrix) {
    // 코호트 목록 (y축)
    const cohortList = [...new Set(retentionMatrix.map(r => r.cohort))].sort();

    // 최대 주차 (x축)
    const maxWeek = retentionMatrix.length > 0 ? Math.max(...retentionMatrix.map(r => r.week)) : 0;

    // Chart.js Matrix 형식으로 변환
    const heatmapData = retentionMatrix.map(item => {
        const cohortIndex = cohortList.indexOf(item.cohort);

        return {
            x: item.week,
            y: cohortIndex,
            v: item.retention, // 리텐션율 (%)
            label: `${item.cohort} - Week ${item.week}`,
            users: item.users,
            total: item.total
        };
    });

    return {
        data: heatmapData,
        cohortList,
        maxWeek,
        summary: {
            totalCohorts: cohortList.length,
            totalWeeks: maxWeek + 1
        }
    };
}

/**
 * 전체 코호트 분석 실행
 * @param {Array} validatedData - 검증된 데이터
 * @returns {Object} 완전한 분석 결과
 */
export function analyzeCohort(validatedData) {
    if (!validatedData || validatedData.length === 0) {
        return {
            cohorts: [],
            retentionMatrix: [],
            heatmapData: { data: [], cohortList: [], maxWeek: 0, summary: { totalCohorts: 0, totalWeeks: 0 } },
            cohortInfo: { cohorts: new Map(), userCohortMap: new Map() },
            performance: { duration: 0, rowsProcessed: 0, cohortsCreated: 0 },
        };
    }

    const startTime = performance.now();

    // 1. 코호트 그룹화
    const cohortInfo = groupByCohort(validatedData);

    // 2. 리텐션 계산
    const retentionMatrix = calculateRetention(validatedData, cohortInfo);

    // 3. 히트맵 데이터 변환
    const heatmapData = formatForHeatmap(retentionMatrix);

    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    return {
        cohorts: Array.from(cohortInfo.cohorts.keys()),
        retentionMatrix,
        heatmapData,
        cohortInfo, // Churn 분석을 위해 추가
        performance: {
            duration,
            rowsProcessed: validatedData.length,
            cohortsCreated: cohortInfo.cohorts.size
        }
    };
}
