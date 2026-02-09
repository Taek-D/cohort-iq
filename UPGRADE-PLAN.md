# CohortIQ 포트폴리오 업그레이드 계획서

> **작성일**: 2026-02-09
> **목적**: 데이터분석가 취업 포트폴리오로서의 점수를 42점 → 70점+ 으로 끌어올리기
> **핵심 진단**: 현재 프론트엔드 개발 프로젝트처럼 보임. 분석 깊이, 통계 역량, Python/SQL 역량 증명 부족.

---

## 현재 상태 (2026-02-09 검증 완료)

### 파일 구조
```
cohort-iq/
├── src/
│   ├── core/
│   │   ├── dataValidator.js          # CSV 검증 (116행)
│   │   ├── dataValidator.test.js     # 9 tests
│   │   ├── cohortAnalysis.js         # 코호트 그룹화 + 리텐션 (181행)
│   │   ├── cohortAnalysis.test.js    # 4 tests
│   │   ├── churnAnalysis.js          # RFM 스코어링 (350행)
│   │   ├── churnAnalysis.test.js     # 4 tests
│   │   └── analysisWorker.js         # Web Worker (34행)
│   ├── visualization/
│   │   ├── heatmapRenderer.js        # Chart.js 히트맵+트렌드 (286행)
│   │   └── churnVisualization.js     # 도넛+테이블+인사이트 (223행)
│   ├── export/
│   │   ├── summaryGenerator.js       # Executive Summary HTML (310행)
│   │   ├── summaryGenerator.test.js  # 8 tests
│   │   └── pdfExporter.js            # HTML→PDF (152행)
│   ├── ui/
│   │   ├── appLayout.js              # 레이아웃 HTML (138행)
│   │   ├── helpers.js                # UI 헬퍼 함수
│   │   └── helpers.test.js           # 20 tests
│   ├── main.js                       # 앱 진입점 (322행)
│   └── style.css                     # 디자인 시스템 (704행)
├── public/
│   └── sample_cohort_data.csv        # 200명 872행 샘플
├── index.html                        # SPA 엔트리 (35행)
├── package.json                      # deps + scripts
├── vite.config.js                    # 빌드 + 코드 스플리팅
└── README.md                         # 177행 (이미지 깨짐)
```

### 빌드/테스트 상태
- `npm run build`: 성공 (2.17s)
- `npm run test`: 45 tests passing (812ms)
- 배포: https://cohort-iq.vercel.app (Vercel)
- GitHub: Taek-D/cohort-iq (main branch)

### 핵심 문제점
1. **docs/ 디렉토리 없음** → README 이미지 4개 전부 깨짐 (demo.gif, screenshot x3)
2. **docs/METHODOLOGY.md 없음** → README에서 링크하지만 404
3. **docs/CASE_STUDY.md 없음** → README에서 링크하지만 404
4. **Python/SQL 역량 증명 없음** → DA 필수 역량 미시연
5. **통계 분석 없음** → 모든 분석이 단순 비율/임계값 기반
6. **README 배지 불일치** → "25 passing" 표시, 실제 45개
7. **og-image.png 없음** → SNS 공유 시 미리보기 깨짐

---

## 작업 목록 (5개)

### Task 1: docs/ 디렉토리 채우기 (가장 시급)

**왜**: GitHub 첫인상. README에서 이미지 4개가 깨져있으면 "미완성 프로젝트"로 보임.

**할 일:**
1. 앱을 로컬에서 실행 (`npm run dev`)
2. Playwright MCP 또는 수동으로 스크린샷 캡처:
   - `docs/screenshot-heatmap.png` — 리텐션 히트맵 + 트렌드 차트 (Retention 탭)
   - `docs/screenshot-churn.png` — Churn Risk 탭 (도넛 차트 + 테이블)
   - `docs/screenshot-summary.png` — PDF 미리보기 모달 (Executive Summary)
3. `docs/demo.gif` — 샘플 데이터 로드 → 분석 완료 → 탭 전환 과정 녹화
   - 대안: 스크린샷 3개로 대체하고 README에서 GIF 참조 제거
4. README 배지 수정: `25 passing` → `45 passing`
5. `public/og-image.png` 생성 (1200x630, 앱 스크린샷 기반)

**완료 기준**: GitHub에서 README 열었을 때 이미지 전부 정상 렌더링

---

### Task 2: docs/METHODOLOGY.md 작성

**왜**: 분석가는 "왜 이 방법을 썼는가"를 설명할 수 있어야 함. 임계값과 가중치의 근거를 보여야 "대충 찍은 숫자"가 아니라 "의도적 설계"임을 증명.

**포함할 내용:**

```markdown
# 분석 방법론

## 1. 코호트 리텐션 분석
### 그룹화 방식
- 주간(Weekly) 코호트: signup_date 기준 ISO 주차 (월요일 시작)
- 선택 근거: 일간은 노이즈 과다, 월간은 해상도 부족. SaaS 업계 표준은 주간.
- 출처: [Amplitude 코호트 가이드](URL), [Mixpanel 리텐션 문서](URL)

### 리텐션 계산
- Retention Rate(n) = (Week n 활성 사용자 수) / (Week 0 코호트 크기) × 100
- "활성": event_date가 해당 주차에 1건 이상 존재
- 중복 제거: 같은 사용자의 같은 주차 복수 이벤트는 Set으로 1회 카운트

## 2. Churn Risk 스코어링
### 왜 RFM 변형인가
- 전통 RFM: Recency, Frequency, Monetary → 구매 금액 데이터 없으므로 Monetary 대신 Consistency(활동 연속성) 사용
- 참고: [Lifetimes 라이브러리](URL), [RFM Segmentation 논문](URL)

### 각 지표의 임계값 근거
#### Recency (0-40점)
- 4주+ 미활동 = 40점: SaaS D28 리텐션 업계 기준, 4주 미복귀 사용자의 재활성화율 <5% (출처)
- 가중치 40%: Recency가 churn 예측에 가장 강력한 단일 지표 (출처)

#### Frequency (0-30점)
- 활동 밀도 <25% = 30점: 주간 활성 비율이 1/4 미만이면 습관 형성 실패
- 출처: [Nir Eyal - Hooked 모델], [DAU/WAU 비율 벤치마크]

#### Consistency (0-30점)
- 연속 4주 미활동 = 30점: "Silent Churn" 패턴
- 출처: [연구 논문 또는 업계 보고서]

### 위험 등급 분류
| 등급 | 점수 | 근거 |
|------|------|------|
| CRITICAL | 70-100 | 재활성화 캠페인 필요 (업계 대응 기준) |
| HIGH | 50-69 | 이탈 직전, 프로모션 개입 시점 |
| MEDIUM | 30-49 | 모니터링 대상 |
| LOW | 0-29 | 건강한 사용자 |

## 3. 건강도 점수 (Health Score)
### 구성
- Retention Score (50%): Week 4 평균 리텐션 / 벤치마크(80%) × 50
- Churn Score (50%): Low Risk 비율 / 벤치마크(60%) × 50
- 벤치마크 출처: [SaaS Benchmarks 2025], [ProfitWell 데이터]

### 등급
- A (80+): 상위 20% SaaS 수준
- B (60-79): 평균 이상
- C (40-59): 개선 필요
- D (0-39): 긴급 대응

## 4. 한계점 및 향후 개선
- 통계적 유의성 미검증 (→ Task 5에서 추가)
- Monetary 지표 없이 LTV 예측 불가
- 코호트 간 외부 요인(마케팅 캠페인 등) 미반영
- 생존 분석(Kaplan-Meier) 미적용
```

**완료 기준**: 면접에서 "왜 임계값을 70으로 잡았나?"에 출처와 함께 답변 가능

**주의사항**: 출처 URL은 실제 유효한 자료로 채울 것. 없는 URL 넣지 말 것.

---

### Task 3: Jupyter Notebook EDA 추가

**왜**: 데이터 분석가의 핵심 역량은 Python + pandas + 시각화. 같은 데이터를 Python으로 분석한 노트북이 있으면 "웹앱은 결과물이고, 분석은 Python으로 할 수 있다"를 증명.

**할 일:**

1. `analysis/` 디렉토리 생성
2. `analysis/cohort_eda.ipynb` 작성:

```
## 노트북 구조

### 1. 데이터 로딩 & 탐색
- pandas read_csv
- df.info(), df.describe(), df.shape
- 결측치/이상치 확인
- signup_date 분포 시각화 (bar chart)

### 2. 코호트 리텐션 분석 (pandas 구현)
- signup_date → 주간 코호트 변환 (pd.Grouper, freq='W-MON')
- 피벗 테이블로 리텐션 매트릭스 생성
- seaborn.heatmap으로 시각화
- **JS 앱 결과와 동일한 수치인지 교차 검증** ← 중요!

### 3. 코호트 간 리텐션 비교
- Week 1, 2, 4 리텐션율 코호트별 비교 (box plot)
- "어떤 코호트가 가장 건강한가?" 분석
- 가입 시기별 패턴 해석

### 4. 사용자 세그먼테이션
- 활동 패턴 기반 클러스터링 (K-Means 또는 간단한 rule-based)
- 세그먼트별 리텐션 커브 비교
- RFM 스코어 분포 시각화 (histogram, scatter)

### 5. 통계 분석 (Task 5와 연결)
- 코호트 간 리텐션 차이 chi-square 검정
- 생존 분석 (Kaplan-Meier curve) - lifelines 라이브러리
- "Week 2→3에서 이탈 급증" 패턴의 통계적 유의성

### 6. 인사이트 & 권장 사항
- 마크다운으로 비즈니스 관점 해석
- "이 데이터가 실제 SaaS라면 어떤 액션을 취할 것인가"
```

3. `analysis/requirements.txt`:
```
pandas>=2.0
matplotlib>=3.7
seaborn>=0.12
scipy>=1.11
lifelines>=0.27
jupyter>=1.0
```

4. README에 `analysis/` 섹션 추가

**완료 기준**: 노트북을 위→아래로 실행하면 모든 셀 에러 없이 완료, 시각화 10개 이상

**핵심 포인트**:
- 노트북 상단에 "이 노트북은 CohortIQ 웹앱의 분석 로직을 Python으로 재구현하고, 추가 통계 분석을 수행합니다" 명시
- 마크다운 셀에 **분석적 해석**을 풍부하게 작성 (코드만 있으면 안 됨)
- seaborn/matplotlib 시각화가 **웹앱 Chart.js와 동일 데이터에서 동일 결과**를 보여야 신뢰도 증명

---

### Task 4: SQL 쿼리 예시 추가

**왜**: DA 면접에서 SQL은 거의 100% 물어봄. "이 분석을 SQL로는 어떻게 하나요?" 에 대비.

**할 일:**

1. `analysis/sql_queries.md` 작성:

```markdown
# CohortIQ 분석 - SQL 구현

> 아래 쿼리는 PostgreSQL 기준이며, 동일한 분석을 RDBMS 환경에서 수행하는 방법을 보여줍니다.

## 테이블 스키마
CREATE TABLE user_events (
    user_id VARCHAR(10),
    signup_date DATE,
    event_date DATE
);

## 1. 주간 코호트 리텐션 매트릭스
-- 코호트 배정 + 주차 계산 + 리텐션율 피벗
WITH cohorts AS (
    SELECT user_id,
           DATE_TRUNC('week', signup_date) AS cohort_week
    FROM user_events
    GROUP BY user_id, DATE_TRUNC('week', signup_date)
),
활성_주차 AS (
    SELECT e.user_id,
           c.cohort_week,
           EXTRACT(WEEK FROM AGE(e.event_date, c.cohort_week))::int AS week_number
    FROM user_events e
    JOIN cohorts c ON e.user_id = c.user_id
)
SELECT cohort_week,
       week_number,
       COUNT(DISTINCT user_id) AS active_users,
       ROUND(COUNT(DISTINCT user_id) * 100.0 /
             MAX(COUNT(DISTINCT user_id)) OVER (PARTITION BY cohort_week), 1) AS retention_pct
FROM 활성_주차
GROUP BY cohort_week, week_number
ORDER BY cohort_week, week_number;

## 2. Churn Risk 스코어 (SQL 버전)
-- Recency + Frequency + Consistency 계산

## 3. 코호트별 D7, D14, D28 리텐션 비교
-- 핵심 마일스톤 리텐션

## 4. 이탈 사용자 식별
-- 최근 4주 미활동 사용자 추출

## 5. 코호트 건강도 랭킹
-- Week 4 리텐션 기준 코호트 순위
```

2. (선택) `analysis/schema.sql` — DDL + 샘플 데이터 INSERT

**완료 기준**: 각 쿼리가 PostgreSQL 문법으로 유효, 주석으로 의도 설명

---

### Task 5: 통계 검정 추가 (코드 + 노트북)

**왜**: 단순 비율 비교("60% vs 45%")는 분석이 아님. 차이가 통계적으로 유의한지 검증해야 분석가.

**할 일:**

1. **Jupyter 노트북 (Task 3)에 통계 섹션 추가:**
   - 코호트 간 Week 2 리텐션 차이: Chi-Square 검정
   - 생존 분석: Kaplan-Meier 생존 곡선 (lifelines)
   - Log-Rank 검정: 코호트 간 생존 곡선 차이 유의성
   - p-value 해석 및 비즈니스 임플리케이션

2. **웹앱에 간단한 통계 지표 추가 (선택):**
   - `src/core/cohortAnalysis.js`에 코호트 간 리텐션 분산/표준편차 계산
   - Summary에 "코호트 간 리텐션 변동계수(CV)" 표시
   - 큰 공수 들이지 말 것 — 핵심은 노트북에서 보여주는 것

3. **METHODOLOGY.md에 통계 방법론 섹션 추가:**
   - 사용한 검정 방법, 유의수준(α=0.05), 가정 명시

**완료 기준**: 노트북에서 p-value 출력, 유의/비유의 판정, 비즈니스 해석까지 작성

---

## 작업 순서 (권장)

```
Task 1 (docs/) ──→ Task 2 (METHODOLOGY.md) ──→ Task 3 (Jupyter) ──→ Task 4 (SQL) ──→ Task 5 (통계)
  30분              1-2시간                      2-3시간              1시간              1-2시간
  │                                                │                                      │
  └─ README 수정 포함                               └─ requirements.txt 포함                └─ 노트북에 통합
```

- Task 1은 가장 시급 (GitHub 첫인상)
- Task 3이 가장 임팩트 큼 (Python 역량 직접 증명)
- Task 5는 Task 3 노트북 안에 섹션으로 통합 가능

---

## README 수정 사항 (Task 1과 함께)

1. 배지: `25 passing` → `45 passing`
2. `analysis/` 섹션 추가:
```markdown
## 분석 노트북

| 문서 | 설명 |
|------|------|
| [EDA 노트북](analysis/cohort_eda.ipynb) | Python/pandas 코호트 분석 + 통계 검정 |
| [SQL 쿼리](analysis/sql_queries.md) | PostgreSQL 기반 동일 분석 구현 |
| [분석 방법론](docs/METHODOLOGY.md) | 스코어링 알고리즘, 임계값 근거, 통계 방법 |
```
3. docs/CASE_STUDY.md 링크 제거 (또는 실제로 작성)
4. 기술 스택 표에 Python, pandas, scipy, lifelines 추가 (analysis용)

---

## 최종 목표 파일 구조

```
cohort-iq/
├── src/                          # (기존 유지)
├── public/
│   ├── sample_cohort_data.csv    # (기존)
│   └── og-image.png              # NEW: SNS 공유용
├── docs/
│   ├── demo.gif                  # NEW: 또는 스크린샷으로 대체
│   ├── screenshot-heatmap.png    # NEW
│   ├── screenshot-churn.png      # NEW
│   ├── screenshot-summary.png    # NEW
│   └── METHODOLOGY.md            # NEW: 분석 방법론
├── analysis/
│   ├── cohort_eda.ipynb          # NEW: Python EDA + 통계
│   ├── sql_queries.md            # NEW: SQL 구현
│   └── requirements.txt          # NEW: Python 의존성
├── README.md                     # UPDATED: 배지, 이미지, analysis 섹션
├── CHANGELOG.md                  # (기존)
└── ...
```

---

## 주의사항

- Jupyter 노트북은 반드시 **셀 실행 결과(output)가 포함된 상태**로 커밋 — GitHub에서 렌더링됨
- SQL 쿼리는 실제 PostgreSQL에서 돌아가는 유효한 문법이어야 함
- METHODOLOGY.md의 출처 URL은 실제 접근 가능한 링크만 사용
- 스크린샷은 실제 앱 화면 캡처 — 목업이나 더미 이미지 금지
- 노트북의 분석 결과가 웹앱 결과와 일치해야 신뢰성 확보
