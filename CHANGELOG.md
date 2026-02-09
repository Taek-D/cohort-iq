# Changelog

CohortIQ의 모든 주요 변경사항을 기록합니다.

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
| Build | Vite 7 |
| Test | Vitest (25 tests) |
| Data | PapaParse, date-fns |
| Visualization | Chart.js + chartjs-chart-matrix |
| Export | jsPDF, html2canvas-pro |
| Styling | Tailwind CSS 4 |
| Performance | Web Worker |
| Hosting | Vercel |

---

## 향후 계획

### P1: 분석 깊이 강화
- [x] 스코어링 임계값에 산업 벤치마크 근거 추가 → `docs/METHODOLOGY.md`
- [ ] 코호트 간 비교 인사이트 — "3주차 코호트가 1주차 대비 리텐션 20%p 하락" 등
- [x] 통계적 disclaimer 추가 → `docs/METHODOLOGY.md` 4절 "방법론의 한계"
- [ ] 매직넘버를 명명된 상수로 추출 + 근거 주석 추가

### P2: 테스트 및 문서
- [ ] 엣지케이스 테스트 추가 — 빈 데이터, 단일 사용자, 중복 이벤트, 윤년
- [x] METHODOLOGY.md 작성 → `docs/METHODOLOGY.md`
- [x] CASE_STUDY.md 작성 → `docs/CASE_STUDY.md` (샘플 데이터 200명 분석 사례)
- [ ] Churn 스코어링 경계값 테스트 (30/50/70점 경계)

### P3: 기능 확장
- [ ] Monthly 코호트 그룹화 옵션
- [ ] 다크 모드 지원
- [ ] CSV 외 Excel(.xlsx) 파일 지원
- [ ] 코호트별 드릴다운 (클릭 시 상세 사용자 목록)
- [ ] 한국어/영어 언어 전환
