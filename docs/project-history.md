# CohortIQ - 프로젝트 진행 기록 (Archive)

이 파일은 CLAUDE.md에서 분리된 상세 프로젝트 기록입니다.
최신 규칙은 CLAUDE.md를 참조하세요.

---

## 프로젝트 목표

### Primary Target
**데이터 분석가 취업 포트폴리오용 전문적 분석 도구**
- CSV 업로드 3초 만에 코호트 리텐션 분석
- 취업 포트폴리오용 1-page 리포트 자동 생성
- Amplitude/Mixpanel 대비 10배 저렴, 100배 빠른 분석

### Secondary Target
**초기 스타트업(Seed~Series A)의 빠른 데이터 기반 의사결정 지원**

### Tertiary Target
**데이터 분석 학습자의 코호트 개념 실습 도구**

---

## 경쟁 분석

### CohortIQ 차별점
1. **가격**: 완전 무료 vs $89~995/월
2. **속도**: 3초 vs 수 시간 (Jupyter) / 수 분 (툴 설정)
3. **접근성**: CSV 드래그&드롭 vs SDK 설치
4. **결과물**: 1-page 리포트 vs Raw 차트

### 경쟁사
- **Amplitude**: Free~$995/월, AI 인사이트, 높은 학습 곡선
- **Mixpanel**: Free~$89/월, 직관적 UI, CSV 업로드 불가
- **Lifetimes (Python)**: 무료, BG/NBD 모델, UI 없음

---

## 기술 스택 리서치

### 라이브러리 선택 이유
- **Vanilla JS (ES6+)**: 포트폴리오 순수 JS 역량 어필
- **Vite**: HMR + 빠른 빌드
- **PapaParse**: 브라우저 내 CSV 파싱 (스트리밍 지원)
- **date-fns**: Moment.js 대비 가벼움 (tree-shakable)
- **Chart.js + matrix**: Canvas 기반 성능 + 히트맵
- **html2canvas-pro**: oklch 색상 지원 (Tailwind v4)
- **jsPDF**: A4 PDF 생성 + 한글 폰트 임베딩

### API/라이브러리 제한사항
- PapaParse: 권장 10MB/100만 행
- Chart.js: 최대 10,000 데이터 포인트
- Vercel 무료: 100GB/월 대역폭

---

## 개발 기록

### Integrate 단계 (완료)
- 모든 라이브러리 연결 성공
- 경로 이슈: 한글/특수문자 → 수동 설정 파일로 우회

### Develop Priority 1: 코호트 리텐션 분석 (완료)
- dataValidator.js, cohortAnalysis.js, heatmapRenderer.js
- 처리 시간: 15ms (목표 3초 대비 200배 빠름)

### Develop Priority 2: Churn 위험 세그먼트 (완료)
- churnAnalysis.js, churnVisualization.js
- RFM 기반 스코어링 (0-100), 4단계 레벨 분류
- 처리 시간: 5ms

### Develop Priority 3: Executive Summary (완료)
- summaryGenerator.js, pdfExporter.js
- 건강도 점수 (0-100, A~D 등급)
- HTML → Canvas → PDF 파이프라인

### 이후 기능 추가 (모두 완료)
- **Portfolio Upgrade**: Match Rate 96%
- **i18n**: 142 번역 키 (ko/en), Match Rate 98%
- **LTV Prediction**: BG/NBD + Gamma-Gamma, Match Rate 97%
- **Statistical Tests**: Chi-squared, KM, Log-Rank, Match Rate 97%
- **A/B Test Simulation**: Power analysis + simulation, Match Rate 97%

---

## 레퍼런스 자료

- [Amplitude Cohort Analysis](https://amplitude.com/blog/saas-cohort-analysis)
- [Mixpanel LTV](https://mixpanel.com/blog/how-to-calculate-lifetime-value/)
- [Lifetimes Python](https://github.com/CamDavidsonPilon/lifetimes)
- [Chart.js Matrix Heatmap](https://chartjs-chart-matrix.pages.dev/)
- [Kaggle Customer LTV](https://www.kaggle.com/code/shailaja4247/customer-lifetime-value-prediction)
