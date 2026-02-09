# CohortIQ 분석 - SQL 구현

> 아래 쿼리는 **PostgreSQL** 기준이며, CohortIQ 웹앱의 JavaScript 분석 로직을 SQL로 재구현합니다.
> 테이블 스키마는 `schema.sql`을 참조하세요.

---

## 테이블 스키마

```sql
CREATE TABLE user_events (
    id          SERIAL PRIMARY KEY,
    user_id     VARCHAR(10) NOT NULL,
    signup_date DATE        NOT NULL,
    event_date  DATE        NOT NULL,
    CONSTRAINT chk_event_after_signup CHECK (event_date >= signup_date)
);
```

---

## 1. 주간 코호트 리텐션 매트릭스

코호트 배정 → 주차 계산 → 코호트별 리텐션율을 산출합니다.
이 쿼리는 `cohortAnalysis.js`의 `groupByCohort()` + `calculateRetention()`에 대응합니다.

```sql
-- 1단계: 사용자별 코호트(가입 주 월요일) 배정
WITH cohorts AS (
    SELECT DISTINCT
        user_id,
        -- signup_date를 해당 주의 월요일로 정규화 (ISO 주차)
        DATE_TRUNC('week', signup_date)::DATE AS cohort_week
    FROM user_events
),

-- 2단계: 이벤트별 가입 후 경과 주차 계산
weekly_activity AS (
    SELECT
        c.cohort_week,
        e.user_id,
        -- event_date와 cohort_week 간 주 차이
        EXTRACT(DAY FROM (e.event_date - c.cohort_week))::INT / 7 AS week_number
    FROM user_events e
    JOIN cohorts c ON e.user_id = c.user_id
),

-- 3단계: 코호트 크기 (Week 0 사용자 수)
cohort_sizes AS (
    SELECT
        cohort_week,
        COUNT(DISTINCT user_id) AS cohort_size
    FROM cohorts
    GROUP BY cohort_week
)

-- 4단계: 주차별 활성 사용자 수 + 리텐션율
SELECT
    wa.cohort_week,
    wa.week_number,
    COUNT(DISTINCT wa.user_id)                                 AS active_users,
    cs.cohort_size,
    ROUND(
        COUNT(DISTINCT wa.user_id) * 100.0 / cs.cohort_size,
        1
    )                                                          AS retention_pct
FROM weekly_activity wa
JOIN cohort_sizes cs ON wa.cohort_week = cs.cohort_week
WHERE wa.week_number >= 0
GROUP BY wa.cohort_week, wa.week_number, cs.cohort_size
ORDER BY wa.cohort_week, wa.week_number;
```

**예상 결과**:

| cohort_week | week_number | active_users | cohort_size | retention_pct |
|-------------|-------------|--------------|-------------|---------------|
| 2025-01-06  | 0           | 50           | 50          | 100.0         |
| 2025-01-06  | 1           | 38           | 50          | 76.0          |
| 2025-01-06  | 2           | 30           | 50          | 60.0          |

---

## 2. Churn Risk 스코어 (SQL 버전)

`churnAnalysis.js`의 RFM 변형 스코어링을 SQL CASE WHEN으로 재구현합니다.

```sql
-- 사용자별 활동 지표 산출
WITH user_metrics AS (
    SELECT
        e.user_id,
        DATE_TRUNC('week', e.signup_date)::DATE                     AS cohort_week,
        MAX(e.event_date)                                           AS last_event_date,
        -- Recency: 마지막 활동 이후 경과 주차
        (CURRENT_DATE - MAX(e.event_date)) / 7                      AS weeks_since_last,
        -- Tenure: 가입 이후 경과 주차
        (CURRENT_DATE - MIN(e.signup_date)) / 7                     AS weeks_since_signup,
        -- 활동한 고유 주차 수
        COUNT(DISTINCT (e.event_date - DATE_TRUNC('week', e.signup_date)::DATE) / 7)
                                                                    AS active_weeks,
        COUNT(*)                                                    AS total_events
    FROM user_events e
    GROUP BY e.user_id, DATE_TRUNC('week', e.signup_date)::DATE
),

-- Frequency(활동 밀도) 및 Consistency(연속 미활동) 계산
enriched AS (
    SELECT
        *,
        -- 활동 밀도 (%)
        CASE
            WHEN weeks_since_signup = 0 THEN
                CASE WHEN active_weeks > 0 THEN 100 ELSE 0 END
            ELSE LEAST(100, ROUND(active_weeks * 100.0 / weeks_since_signup, 1))
        END AS activity_density
    FROM user_metrics
),

-- RFM 스코어링 (가중치: Recency 40, Frequency 30, Consistency 30)
risk_scores AS (
    SELECT
        user_id,
        cohort_week,
        last_event_date,
        weeks_since_last,
        activity_density,
        total_events,
        -- Recency Score (0-40)
        CASE
            WHEN weeks_since_last >= 4 THEN 40
            WHEN weeks_since_last >= 3 THEN 30
            WHEN weeks_since_last >= 2 THEN 20
            WHEN weeks_since_last >= 1 THEN 10
            ELSE 0
        END AS recency_score,
        -- Frequency Score (0-30)
        CASE
            WHEN activity_density < 25  THEN 30
            WHEN activity_density < 50  THEN 20
            WHEN activity_density < 75  THEN 10
            ELSE 0
        END AS frequency_score,
        -- Consistency Score: 간이 버전 (연속 미활동 = weeks_since_last로 근사)
        CASE
            WHEN weeks_since_last >= 4 THEN 30
            WHEN weeks_since_last >= 3 THEN 20
            WHEN weeks_since_last >= 2 THEN 10
            ELSE 0
        END AS consistency_score
    FROM enriched
)

SELECT
    user_id,
    cohort_week,
    last_event_date,
    recency_score,
    frequency_score,
    consistency_score,
    (recency_score + frequency_score + consistency_score) AS risk_score,
    CASE
        WHEN (recency_score + frequency_score + consistency_score) >= 70 THEN 'CRITICAL'
        WHEN (recency_score + frequency_score + consistency_score) >= 50 THEN 'HIGH'
        WHEN (recency_score + frequency_score + consistency_score) >= 30 THEN 'MEDIUM'
        ELSE 'LOW'
    END AS risk_level
FROM risk_scores
ORDER BY risk_score DESC;
```

---

## 3. D7, D14, D28 마일스톤 리텐션

핵심 마일스톤 지점의 리텐션을 코호트별로 추출합니다.

```sql
WITH cohorts AS (
    SELECT DISTINCT
        user_id,
        DATE_TRUNC('week', signup_date)::DATE AS cohort_week
    FROM user_events
),
cohort_sizes AS (
    SELECT cohort_week, COUNT(DISTINCT user_id) AS cohort_size
    FROM cohorts
    GROUP BY cohort_week
),
milestones AS (
    SELECT
        c.cohort_week,
        -- D7: 가입 후 7일 이내 활동
        COUNT(DISTINCT CASE
            WHEN e.event_date BETWEEN c.cohort_week + 1 AND c.cohort_week + 7
            THEN e.user_id
        END) AS active_d7,
        -- D14: 가입 후 8-14일 활동
        COUNT(DISTINCT CASE
            WHEN e.event_date BETWEEN c.cohort_week + 8 AND c.cohort_week + 14
            THEN e.user_id
        END) AS active_d14,
        -- D28: 가입 후 22-28일 활동
        COUNT(DISTINCT CASE
            WHEN e.event_date BETWEEN c.cohort_week + 22 AND c.cohort_week + 28
            THEN e.user_id
        END) AS active_d28
    FROM cohorts c
    JOIN user_events e ON c.user_id = e.user_id
    GROUP BY c.cohort_week
)
SELECT
    m.cohort_week,
    cs.cohort_size,
    m.active_d7,
    ROUND(m.active_d7  * 100.0 / cs.cohort_size, 1) AS retention_d7,
    m.active_d14,
    ROUND(m.active_d14 * 100.0 / cs.cohort_size, 1) AS retention_d14,
    m.active_d28,
    ROUND(m.active_d28 * 100.0 / cs.cohort_size, 1) AS retention_d28
FROM milestones m
JOIN cohort_sizes cs ON m.cohort_week = cs.cohort_week
ORDER BY m.cohort_week;
```

---

## 4. 이탈 사용자 식별

최근 4주(28일) 이상 미활동 사용자를 추출합니다.
`churnAnalysis.js`에서 `RECENCY_SEVERE = 4` 주 기준과 동일합니다.

```sql
SELECT
    user_id,
    MAX(event_date)                            AS last_active_date,
    CURRENT_DATE - MAX(event_date)             AS days_inactive,
    (CURRENT_DATE - MAX(event_date)) / 7       AS weeks_inactive,
    COUNT(*)                                   AS total_events,
    COUNT(DISTINCT
        (event_date - DATE_TRUNC('week', signup_date)::DATE) / 7
    )                                          AS active_weeks
FROM user_events
GROUP BY user_id
HAVING MAX(event_date) < CURRENT_DATE - INTERVAL '28 days'
ORDER BY days_inactive DESC;
```

**비즈니스 활용**:
- 이 결과를 CRM에 연동하여 재참여 이메일 캠페인 대상 목록으로 사용
- `weeks_inactive`가 클수록 재활성화 난이도 상승 → 차등 인센티브 적용

---

## 5. 코호트 건강도 랭킹

Week 4(D28) 리텐션 기준으로 코호트를 순위 매깁니다.
`summaryGenerator.js`의 Health Score에서 Week 4 리텐션이 핵심 지표임에 대응합니다.

```sql
WITH cohorts AS (
    SELECT DISTINCT user_id, DATE_TRUNC('week', signup_date)::DATE AS cohort_week
    FROM user_events
),
cohort_sizes AS (
    SELECT cohort_week, COUNT(DISTINCT user_id) AS cohort_size
    FROM cohorts GROUP BY cohort_week
),
week4_retention AS (
    SELECT
        c.cohort_week,
        COUNT(DISTINCT CASE
            WHEN (e.event_date - c.cohort_week) / 7 = 4
            THEN e.user_id
        END) AS week4_active
    FROM cohorts c
    JOIN user_events e ON c.user_id = e.user_id
    GROUP BY c.cohort_week
)
SELECT
    w.cohort_week,
    cs.cohort_size,
    w.week4_active,
    ROUND(w.week4_active * 100.0 / cs.cohort_size, 1) AS week4_retention_pct,
    RANK() OVER (ORDER BY w.week4_active * 1.0 / cs.cohort_size DESC) AS rank,
    CASE
        WHEN w.week4_active * 100.0 / cs.cohort_size >= 50 THEN 'Healthy'
        WHEN w.week4_active * 100.0 / cs.cohort_size >= 25 THEN 'At Risk'
        ELSE 'Critical'
    END AS health_status
FROM week4_retention w
JOIN cohort_sizes cs ON w.cohort_week = cs.cohort_week
ORDER BY rank;
```

---

## 6. 위험 세그먼트별 사용자 수 집계

Query 2의 결과를 그룹화하여 전체 위험 분포를 요약합니다.
`churnAnalysis.js`의 `segmentByRisk()`에 대응합니다.

```sql
WITH risk_data AS (
    -- Query 2의 결과를 서브쿼리로 사용
    SELECT
        user_id,
        -- 간이 스코어 (Recency 기반)
        CASE WHEN (CURRENT_DATE - MAX(event_date)) / 7 >= 4 THEN 40
             WHEN (CURRENT_DATE - MAX(event_date)) / 7 >= 3 THEN 30
             WHEN (CURRENT_DATE - MAX(event_date)) / 7 >= 2 THEN 20
             WHEN (CURRENT_DATE - MAX(event_date)) / 7 >= 1 THEN 10
             ELSE 0
        END +
        CASE WHEN COUNT(DISTINCT (event_date - DATE_TRUNC('week', signup_date)::DATE) / 7)
                  * 100.0 / NULLIF((CURRENT_DATE - MIN(signup_date)) / 7, 0) < 25 THEN 30
             WHEN COUNT(DISTINCT (event_date - DATE_TRUNC('week', signup_date)::DATE) / 7)
                  * 100.0 / NULLIF((CURRENT_DATE - MIN(signup_date)) / 7, 0) < 50 THEN 20
             ELSE 0
        END AS risk_score
    FROM user_events
    GROUP BY user_id
)
SELECT
    CASE
        WHEN risk_score >= 70 THEN 'CRITICAL'
        WHEN risk_score >= 50 THEN 'HIGH'
        WHEN risk_score >= 30 THEN 'MEDIUM'
        ELSE 'LOW'
    END                                                  AS risk_level,
    COUNT(*)                                             AS user_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1)  AS percentage
FROM risk_data
GROUP BY
    CASE
        WHEN risk_score >= 70 THEN 'CRITICAL'
        WHEN risk_score >= 50 THEN 'HIGH'
        WHEN risk_score >= 30 THEN 'MEDIUM'
        ELSE 'LOW'
    END
ORDER BY
    CASE risk_level
        WHEN 'CRITICAL' THEN 1
        WHEN 'HIGH'     THEN 2
        WHEN 'MEDIUM'   THEN 3
        WHEN 'LOW'      THEN 4
    END;
```

---

## 참고

- 모든 쿼리는 PostgreSQL 14+ 문법 기준
- `DATE_TRUNC('week', ...)`: PostgreSQL에서 주의 시작일(월요일)로 절삭
- CTE(Common Table Expression)를 사용하여 가독성과 재사용성 확보
- 실제 프로덕션에서는 인덱스(`schema.sql` 참조)와 파티셔닝을 고려해야 함
