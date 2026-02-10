# Changelog

CohortIQ의 모든 주요 변경사항을 기록합니다.

---

## [1.6.1] - 2026-02-10

### 프로젝트 정리 및 Claude Code 설정 업그레이드

#### Claude Code 설정
- Status Line 추가 (context%, cost, branch, model)
- PreToolUse 훅 추가 (파괴적 명령 차단)
- Notification 훅 추가 (터미널 벨)
- CLAUDE.md 경량화 (963줄 → 60줄, 상세 → `docs/project-history.md`)
- Agent/Command/Skill 메타데이터 최신화

#### 정리
- `UPGRADE-PLAN.md` 삭제 (모든 작업 완료)
- `.claude/settings.local.json` git 추적 해제 (머신별 경로 포함)
- 부모 디렉토리 레거시 문서 삭제 (Bridge.md, PRD.md 등)
- `package.json` 버전 1.1.0 → 1.6.1

---

## [1.6.0] - 2026-02-10

### A/B 테스트 시뮬레이션

#### 새 기능
- **A/B 테스트 시뮬레이터** — 리텐션 기반 A/B 테스트 설계 도구
  - 필요 샘플 사이즈 계산 (unpooled two-proportion formula)
  - 파워 분석 커브 시각화
  - 몬테카를로 시뮬레이션 (1,000회 반복)
  - 슬라이더 인터랙션 (<1ms 반응, 메인 스레드)

#### 새 파일
- `src/core/abTestSimulation.js` — normalCDF, normalPPF, power analysis, simulation
- `src/visualization/abTestRenderer.js` — retention comparison, power curve, cards, table
- `src/core/abTestSimulation.test.js` — 22개 테스트

#### 수정
- `appLayout.js` — A/B 테스트 탭 추가
- `main.js`, `ko.js`, `en.js`, `style.css` — A/B 탭 연동

---

## [1.5.0] - 2026-02-10

### 통계적 검정

#### 새 기능
- **Chi-squared 독립성 검정** — 코호트 간 리텐션 독립성 검증
- **Kaplan-Meier 생존 분석** — 코호트별 생존 확률 추정
- **Log-Rank 검정** — 코호트 간 생존 곡선 비교 (p-value)
- 생존 곡선 차트 + 검정 결과 카드 UI

#### 새 파일
- `src/core/statisticalTests.js` — Chi², KM, Log-Rank (순수 JS, 외부 의존성 없음)
- `src/visualization/statisticsRenderer.js` — 생존 곡선 차트 + 검정 결과 카드
- `src/core/statisticalTests.test.js` — 17개 테스트

#### 수정
- `analysisWorker.js` — 4단계 추가 (통계 검정)
- 샘플 데이터 확장: 200 → 1,010명, 871 → 2,306행

---

## [1.4.0] - 2026-02-10

### LTV 예측

#### 새 기능
- **BG/NBD 모델** — 기대 거래 횟수 예측
- **Gamma-Gamma 모델** — 기대 금전 가치 예측
- **CLV 계산** — E[transactions] × E[monetary] × margin
- LTV 분포 차트 + 세그먼트 테이블 UI

#### 새 파일
- `src/core/ltvPrediction.js` — BG/NBD + Gamma-Gamma 모델
- `src/visualization/ltvVisualization.js` — LTV 분포 차트 + 세그먼트 카드
- `src/core/ltvPrediction.test.js` — 18개 테스트
- `src/ui/helpers.js` + `helpers.test.js` — gamma, beta, incomplete gamma 함수 (20개 테스트)

#### 수정
- `analysisWorker.js` — 3단계 추가 (LTV 예측)

---

## [1.3.0] - 2026-02-09

### 다국어 지원 (i18n)

#### 새 기능
- **한국어/영어 전환** — 헤더에 KO|EN 토글 버튼
- 142개 번역 키 (ko/en)
- localStorage 기반 언어 설정 저장
- Web Worker / Node.js 환경에서도 안전한 try/catch 패턴

#### 새 파일
- `src/i18n/index.js` — i18n 모듈 (setLocale, t, getLocale)
- `src/i18n/ko.js` — 한국어 번역
- `src/i18n/en.js` — 영어 번역

#### 수정
- 모든 UI 모듈에 `t()` 함수 적용 (10개 파일)

---

## [1.2.0] - 2026-02-09

### 포트폴리오 품질 감사 및 코드 개선

#### 버그 수정
- **`validation.uniqueUsers` 참조 오류 수정** — `main.js`에서 존재하지 않는 프로퍼티 접근 → `validation.stats?.uniqueUsers`로 수정
- **코호트 분석 Week 0 타입 불일치 수정** — Week 0만 `number`, 나머지는 `Set`이던 문제 → 전체 `Set` 통일로 타입 체크 분기 제거

#### 코드 품질 개선
- **매직넘버 → 명명된 상수 추출** — `churnAnalysis.js`에 16개 상수, `summaryGenerator.js`에 7개 상수 정의
  - `RECENCY_WEIGHT`, `FREQUENCY_WEIGHT`, `CONSISTENCY_WEIGHT`, `RISK_CRITICAL`, `RISK_HIGH`, `RISK_MEDIUM` 등
  - `RETENTION_BENCHMARK`, `LOW_RISK_BENCHMARK`, `GRADE_A`, `GRADE_B`, `GRADE_C` 등
- **`console.error` 전면 제거** — `main.js`(4개), `analysisWorker.js`(1개), `pdfExporter.js`(1개) → UI 에러 표시로 대체
- **중복 `destroyChart` 함수 제거** — `heatmapRenderer.js`에서 중복 export 삭제
- **트렌드 차트 색상 팔레트 확장** — 6색 → 12색 (8개 이상 코호트에서 색상 재사용 방지)
- **디버그 캔버스 제거** — `index.html`에서 `<canvas id="test-chart">` 제거
- **개발 메모 주석 제거** — `dataValidator.js`에서 8줄 내부 토론 주석 삭제

#### 테스트 보강 (14개 → 25개)
- **`summaryGenerator.test.js` 신규 작성** (8개 테스트)
  - `prepareSummaryData`: 메트릭 계산, null 입력, 빈 코호트 처리
  - `getHealthGrade`: A/B/C/D 등급 경계값 (80/60/40점)
  - `generateSummaryHTML`: HTML 내용 검증
- **`cohortAnalysis.test.js` 재작성** (3개 → 4개)
  - 테스트 데이터 `string` → `Date` 객체로 변경 (프로덕션 데이터 흐름과 일치)
  - 중복 이벤트 처리 테스트 추가
  - Week 1 리텐션 구체적 검증 (`users === 1, retention === 50`)
- **`churnAnalysis.test.js` 재작성** (2개 → 4개)
  - 테스트 데이터 `string` → `Date` 객체로 변경
  - 빈 데이터 + 경계값 스코어 테스트 추가
  - u2 사용자의 `riskLevel === 'CRITICAL'` 구체적 검증

#### 문서
- **`docs/METHODOLOGY.md` 신규 작성** — 분석 방법론, 스코어링 알고리즘, 임계값 근거(업계 벤치마크), 방법론 한계
- **`docs/CASE_STUDY.md` 신규 작성** — 200명 샘플 데이터 기반 비즈니스 분석 시뮬레이션
- **README.md 보강** — "분석 역량" 섹션, 문서 링크 테이블 추가

#### 프로젝트 관리
- MIT `LICENSE` 파일 추가
- `package.json` 버전 1.0.0 → 1.1.0
- 테스트 뱃지 업데이트 (14 → 25)

---

## [1.1.0] - 2026-02-07

### Groom 단계 - 포트폴리오 품질 개선

#### P0 신뢰성 수정
- **"AI Powered" 뱃지 제거** — 실제 ML 모델을 사용하지 않으므로 오해 소지 있는 라벨 제거
- **"RFM 기반" 용어 정정** — Monetary 축 부재로 "활동 패턴(Recency, Frequency, Consistency) 기반"으로 변경
- **샘플 데이터 전면 교체** — 10명 → 200명(8개 코호트), 4가지 사용자 프로필(power/regular/casual/churned)로 현실적 리텐션 패턴 구현
  - 변경 전: 전원 CRITICAL, 건강도 0점 D등급
  - 변경 후: Critical 38% / High 20% / Medium 14% / Low 29%, 건강도 44점 C등급

#### 문서화
- README에 Demo GIF + 기능별 스크린샷 4장 추가 (`docs/`)
- README 기술 스택, 프로젝트 구조, 성능 지표 섹션 작성

#### 인프라
- Tailwind CSS v4 마이그레이션 후 불필요한 v3 설정 파일 제거
- 불필요한 테스트/임시 파일 정리

---

## [1.0.0] - 2026-02-07

### Execute 단계 - MVP 완성 및 배포

#### 핵심 기능 (Priority 1: 코호트 리텐션 분석)
- CSV 파일 업로드 (드래그 앤 드롭 + 파일 선택)
- 필수 컬럼 자동 검증 (`user_id`, `signup_date`, `event_date`)
- 주간(Weekly) 코호트 자동 그룹화
- 리텐션율 계산 및 히트맵 시각화 (Chart.js Matrix)
- 코호트별 트렌드 라인 차트

#### Churn 예측 (Priority 2: 이탈 위험 식별)
- 활동 패턴 기반 위험 스코어링 (0-100점)
  - Recency: 마지막 활동 경과 시간
  - Frequency: 활동 밀도
  - Consistency: 연속 미활동 주차
- CRITICAL / HIGH / MEDIUM / LOW 4단계 세그먼트 분류
- 위험군 도넛 차트 + Top 20 위험 사용자 테이블
- 실행 가능한 인사이트 및 추천 조치 자동 생성

#### Executive Summary (Priority 3: PDF Export)
- 건강도 점수 자동 계산 (A/B/C/D 등급)
- 리텐션 추이 + Churn 위험 요약 1-Page 리포트
- html2canvas-pro → jsPDF 파이프라인으로 PDF 다운로드
- 모달 미리보기 지원

#### 성능 최적화
- Web Worker로 분석 로직 오프로딩 (UI 블로킹 방지)
- Vite 코드 스플리팅 (vendor/export 청크 분리)

#### 버그 수정
- html2canvas + Tailwind v4 oklch 색상 파싱 오류 → `html2canvas-pro`로 교체
- Chart.js 스케일 미등록 → `chart.js/auto` import로 해결
- Canvas getContext 이중 호출 방지

#### 배포
- Vercel 자동 배포 설정 (GitHub master 브랜치 연동)
- 라이브 URL: https://cohort-iq.vercel.app

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| Core | Vanilla JavaScript (ES6+ Module) |
| Build | Vite 7.2.4 |
| Test | Vitest 4.0.18 (102 tests, 8 files) |
| Data | PapaParse 5.5.3, date-fns 4.1.0 |
| Visualization | Chart.js 4.5.1 + chartjs-chart-matrix 3.0.0 |
| Export | jsPDF 4.1.0, html2canvas-pro |
| Styling | Tailwind CSS 4.1.18 |
| Analysis | Cohort, Churn, LTV (BG/NBD), Stats (Chi²/KM/Log-Rank), A/B Sim |
| i18n | Korean / English (142 keys) |
| Performance | Web Worker (4-stage pipeline) |
| Hosting | Vercel |

---

## 향후 계획

### P1: 기능 확장
- [ ] Monthly 코호트 그룹화 옵션
- [ ] 다크 모드 지원
- [ ] CSV 외 Excel(.xlsx) 파일 지원
- [ ] 코호트별 드릴다운 (클릭 시 상세 사용자 목록)
- [ ] 코호트 간 비교 인사이트 — "3주차 코호트가 1주차 대비 리텐션 20%p 하락" 등
