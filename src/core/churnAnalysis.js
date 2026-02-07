// churnAnalysis.js - Churn 위험 세그먼트 식별 엔진
import { differenceInWeeks } from 'date-fns';

/**
 * 사용자별 활동 패턴 분석
 * @param {Array} validatedData - 검증된 데이터
 * @param {Object} cohortInfo - groupByCohort 결과
 * @returns {Map} 사용자 ID -> 활동 정보
 */
export function analyzeUserActivity(validatedData, cohortInfo) {
    const { userCohortMap } = cohortInfo;
    const userActivity = new Map();

    validatedData.forEach(row => {
        const userId = row.user_id;
        const userInfo = userCohortMap.get(userId);

        if (!userInfo) return;

        // 사용자별 활동 데이터 초기화
        if (!userActivity.has(userId)) {
            userActivity.set(userId, {
                cohort: userInfo.cohort,
                signup_date: userInfo.signup_date,
                events: [],
                lastEventDate: null,
                totalEvents: 0,
                activeWeeks: new Set()
            });
        }

        const activity = userActivity.get(userId);

        // 이벤트 추가
        activity.events.push(row.event_date);
        activity.totalEvents++;

        // 마지막 이벤트 날짜 업데이트
        if (!activity.lastEventDate || row.event_date > activity.lastEventDate) {
            activity.lastEventDate = row.event_date;
        }

        // 활동 주차 추적
        const weeksSinceSignup = differenceInWeeks(
            row.event_date,
            userInfo.signup_date,
            { weekStartsOn: 1 }
        );
        activity.activeWeeks.add(weeksSinceSignup);
    });

    return userActivity;
}

/**
 * Churn 위험 스코어 계산
 * @param {Map} userActivity - analyzeUserActivity 결과
 * @param {Date} currentDate - 현재 날짜 (기준점)
 * @returns {Array} 사용자별 위험 스코어
 */
export function calculateChurnRisk(userActivity, currentDate = new Date()) {
    const churnRiskData = [];

    userActivity.forEach((activity, userId) => {
        // 1. 마지막 활동 이후 경과 주차 (Recency)
        const weeksSinceLastActivity = activity.lastEventDate
            ? differenceInWeeks(currentDate, activity.lastEventDate, { weekStartsOn: 1 })
            : 999; // 활동 기록 없음

        // 2. 총 활동 주차 수 (Frequency)
        const totalActiveWeeks = activity.activeWeeks.size;

        // 3. 가입 후 경과 주차 (Tenure)
        const weeksSinceSignup = differenceInWeeks(
            currentDate,
            activity.signup_date,
            { weekStartsOn: 1 }
        );

        // 4. 활동 밀도 (Active Weeks / Total Weeks)
        // 가입 주차(0)인 경우 활동이 있다면 100%, 없다면 0%
        let activityDensity = 0;
        if (weeksSinceSignup === 0) {
            activityDensity = totalActiveWeeks > 0 ? 100 : 0;
        } else {
            activityDensity = Math.min(100, Math.max(0, (totalActiveWeeks / weeksSinceSignup) * 100));
        }

        // 5. 연속 미활동 주차 계산
        let consecutiveInactiveWeeks = 0;
        const sortedWeeks = Array.from(activity.activeWeeks).sort((a, b) => a - b);
        const maxWeek = Math.max(...sortedWeeks, 0);

        for (let week = maxWeek; week >= 0; week--) {
            if (!activity.activeWeeks.has(week)) {
                consecutiveInactiveWeeks++;
            } else {
                break;
            }
        }

        // 6. Churn 위험 스코어 계산 (0-100)
        // 높을수록 위험
        let riskScore = 0;

        // Recency 점수 (0-40점): 최근 활동이 오래될수록 높음
        if (weeksSinceLastActivity >= 4) riskScore += 40;
        else if (weeksSinceLastActivity >= 3) riskScore += 30;
        else if (weeksSinceLastActivity >= 2) riskScore += 20;
        else if (weeksSinceLastActivity >= 1) riskScore += 10;

        // Frequency 점수 (0-30점): 활동 밀도가 낮을수록 높음
        if (activityDensity < 25) riskScore += 30;
        else if (activityDensity < 50) riskScore += 20;
        else if (activityDensity < 75) riskScore += 10;

        // Consecutive Inactivity 점수 (0-30점): 연속 미활동이 길수록 높음
        if (consecutiveInactiveWeeks >= 4) riskScore += 30;
        else if (consecutiveInactiveWeeks >= 3) riskScore += 20;
        else if (consecutiveInactiveWeeks >= 2) riskScore += 10;

        // 7. 위험 레벨 분류
        let riskLevel;
        if (riskScore >= 70) riskLevel = 'CRITICAL';
        else if (riskScore >= 50) riskLevel = 'HIGH';
        else if (riskScore >= 30) riskLevel = 'MEDIUM';
        else riskLevel = 'LOW';

        churnRiskData.push({
            userId,
            cohort: activity.cohort,
            riskScore,
            riskLevel,
            metrics: {
                weeksSinceLastActivity,
                totalActiveWeeks,
                weeksSinceSignup,
                activityDensity: Math.round(activityDensity * 10) / 10,
                consecutiveInactiveWeeks,
                totalEvents: activity.totalEvents
            },
            lastEventDate: activity.lastEventDate
        });
    });

    // 위험 스코어가 높은 순으로 정렬
    return churnRiskData.sort((a, b) => b.riskScore - a.riskScore);
}

/**
 * 위험 세그먼트 그룹화
 * @param {Array} churnRiskData - calculateChurnRisk 결과
 * @returns {Object} 위험 레벨별 통계
 */
export function segmentByRisk(churnRiskData) {
    const segments = {
        CRITICAL: [],
        HIGH: [],
        MEDIUM: [],
        LOW: []
    };

    churnRiskData.forEach(user => {
        segments[user.riskLevel].push(user);
    });

    return {
        segments,
        summary: {
            total: churnRiskData.length,
            critical: segments.CRITICAL.length,
            high: segments.HIGH.length,
            medium: segments.MEDIUM.length,
            low: segments.LOW.length,
            criticalPercentage: churnRiskData.length > 0
                ? Math.round((segments.CRITICAL.length / churnRiskData.length) * 100)
                : 0,
            highPercentage: churnRiskData.length > 0
                ? Math.round((segments.HIGH.length / churnRiskData.length) * 100)
                : 0
        }
    };
}

/**
 * 실행 가능한 인사이트 생성
 * @param {Object} riskSegments - segmentByRisk 결과
 * @returns {Array} 인사이트 목록
 */
export function generateInsights(riskSegments) {
    const insights = [];
    const { summary } = riskSegments;

    // 1. Critical 사용자 알림
    if (summary.critical > 0) {
        insights.push({
            type: 'ALERT',
            severity: 'CRITICAL',
            title: `즉시 조치 필요: ${summary.critical}명의 사용자가 이탈 위험`,
            description: `전체 사용자의 ${summary.criticalPercentage}%가 높은 이탈 위험 상태입니다.`,
            action: '재참여 캠페인 (이메일, 푸시 알림) 즉시 실행을 권장합니다.',
            affectedUsers: summary.critical
        });
    }

    // 2. High Risk 경고
    if (summary.high > 0) {
        insights.push({
            type: 'WARNING',
            severity: 'HIGH',
            title: `${summary.high}명의 사용자가 이탈 가능성 높음`,
            description: `${summary.highPercentage}%의 사용자가 활동이 감소하고 있습니다.`,
            action: '타겟 프로모션 또는 기능 추천을 통해 재참여를 유도하세요.',
            affectedUsers: summary.high
        });
    }

    // 3. 전체 건강도 평가
    const healthyPercentage = 100 - summary.criticalPercentage - summary.highPercentage;
    if (healthyPercentage < 50) {
        insights.push({
            type: 'ALERT',
            severity: 'HIGH',
            title: '전체 사용자 건강도 낮음',
            description: `${100 - healthyPercentage}%의 사용자가 위험 상태입니다.`,
            action: '제품 경험 개선 및 온보딩 프로세스 점검이 필요합니다.',
            affectedUsers: summary.critical + summary.high
        });
    } else if (healthyPercentage >= 80) {
        insights.push({
            type: 'SUCCESS',
            severity: 'LOW',
            title: '사용자 건강도 양호',
            description: `${healthyPercentage}%의 사용자가 건강한 활동 패턴을 보입니다.`,
            action: '현재 전략을 유지하면서 Medium 위험 사용자에 집중하세요.',
            affectedUsers: summary.low
        });
    }

    // 4. 코호트별 패턴 분석 (추가 개선 포인트)
    const cohortRisk = new Map();
    Object.values(riskSegments.segments).flat().forEach(user => {
        if (!cohortRisk.has(user.cohort)) {
            cohortRisk.set(user.cohort, { critical: 0, high: 0, total: 0 });
        }
        const cohortStat = cohortRisk.get(user.cohort);
        cohortStat.total++;
        if (user.riskLevel === 'CRITICAL') cohortStat.critical++;
        if (user.riskLevel === 'HIGH') cohortStat.high++;
    });

    // 가장 위험한 코호트 식별
    let worstCohort = null;
    let worstRiskRate = 0;
    cohortRisk.forEach((stats, cohort) => {
        const riskRate = ((stats.critical + stats.high) / stats.total) * 100;
        if (riskRate > worstRiskRate) {
            worstRiskRate = riskRate;
            worstCohort = { cohort, stats, riskRate };
        }
    });

    if (worstCohort && worstCohort.riskRate > 50) {
        insights.push({
            type: 'WARNING',
            severity: 'MEDIUM',
            title: `${worstCohort.cohort} 코호트 집중 관리 필요`,
            description: `해당 코호트의 ${Math.round(worstCohort.riskRate)}%가 위험 상태입니다.`,
            action: '이 코호트의 온보딩 경험을 재검토하고 개선하세요.',
            affectedUsers: worstCohort.stats.critical + worstCohort.stats.high
        });
    }

    return insights;
}

/**
 * 전체 Churn 분석 실행
 * @param {Array} validatedData - 검증된 데이터
 * @param {Object} cohortInfo - groupByCohort 결과
 * @returns {Object} 완전한 Churn 분석 결과
 */
export function analyzeChurn(validatedData, cohortInfo) {
    if (!validatedData || validatedData.length === 0 || !cohortInfo) {
        return {
            churnRiskData: [],
            riskSegments: {
                segments: { CRITICAL: [], HIGH: [], MEDIUM: [], LOW: [] },
                summary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, criticalPercentage: 0, highPercentage: 0 },
            },
            insights: [],
            performance: { duration: 0, usersAnalyzed: 0 },
        };
    }

    const startTime = performance.now();

    // 1. 사용자 활동 패턴 분석
    const userActivity = analyzeUserActivity(validatedData, cohortInfo);

    // 2. Churn 위험 스코어 계산
    const churnRiskData = calculateChurnRisk(userActivity);

    // 3. 위험 세그먼트 그룹화
    const riskSegments = segmentByRisk(churnRiskData);

    // 4. 인사이트 생성
    const insights = generateInsights(riskSegments);

    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    return {
        churnRiskData,
        riskSegments,
        insights,
        performance: {
            duration,
            usersAnalyzed: userActivity.size
        }
    };
}
