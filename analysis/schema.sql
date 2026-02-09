-- CohortIQ 분석용 PostgreSQL 스키마
-- 이 DDL은 analysis/sql_queries.md의 쿼리가 참조하는 테이블 구조입니다.

CREATE TABLE user_events (
    id          SERIAL PRIMARY KEY,
    user_id     VARCHAR(10) NOT NULL,
    signup_date DATE        NOT NULL,
    event_date  DATE        NOT NULL,
    created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_event_after_signup CHECK (event_date >= signup_date)
);

-- 인덱스: 코호트 분석에서 자주 사용하는 컬럼
CREATE INDEX idx_user_events_user_id     ON user_events(user_id);
CREATE INDEX idx_user_events_signup_date ON user_events(signup_date);
CREATE INDEX idx_user_events_event_date  ON user_events(event_date);

-- 샘플 데이터 (public/sample_cohort_data.csv의 처음 10행)
INSERT INTO user_events (user_id, signup_date, event_date) VALUES
('U001', '2025-01-06', '2025-01-06'),
('U001', '2025-01-06', '2025-01-08'),
('U001', '2025-01-06', '2025-01-13'),
('U001', '2025-01-06', '2025-01-15'),
('U002', '2025-01-06', '2025-01-06'),
('U002', '2025-01-06', '2025-01-07'),
('U002', '2025-01-06', '2025-01-14'),
('U003', '2025-01-06', '2025-01-06'),
('U003', '2025-01-06', '2025-01-09'),
('U004', '2025-01-06', '2025-01-06');
