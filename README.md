# CohortIQ

**3초 만에 구독 비즈니스의 건강을 진단하는 코호트 분석 도구**

CSV 파일 업로드만으로 코호트 리텐션을 분석하고, RFM 기반 알고리즘으로 이탈 위험 사용자를 식별하여 1-Page Executive Summary PDF를 자동 생성합니다.

[![Live Demo](https://img.shields.io/badge/demo-cohort--iq.vercel.app-blue)](https://cohort-iq.vercel.app)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Tests](https://img.shields.io/badge/tests-14%20passing-brightgreen)

> **[Live Demo](https://cohort-iq.vercel.app)** - 샘플 데이터로 즉시 체험해보세요

<p align="center">
  <img src="docs/demo.gif" alt="CohortIQ Demo" width="720">
</p>

---

## 주요 기능

### 1. 코호트 리텐션 분석
- 가입일 기준 주간(Weekly) 코호트 자동 생성
- 리텐션 히트맵 + 트렌드 라인 차트 시각화
- 처리 속도: 10,000행 기준 3초 이내

<img src="docs/screenshot-heatmap.png" alt="코호트 리텐션 히트맵" width="720">

### 2. Churn 위험 예측
- RFM(Recency, Frequency, Monetary) 기반 위험 스코어링 (0-100)
- CRITICAL / HIGH / MEDIUM / LOW 4단계 세그먼트 분류
- 실행 가능한 인사이트 및 추천 조치 자동 생성

<img src="docs/screenshot-churn.png" alt="Churn 위험 분석" width="720">

### 3. Executive Summary PDF
- 건강도 점수 (A/B/C/D 등급)
- 리텐션 추이 + Churn 위험 요약
- 1-Page PDF 다운로드

<img src="docs/screenshot-summary.png" alt="Executive Summary" width="720">

---

## 빠른 시작

### 온라인 (권장)
1. [https://cohort-iq.vercel.app](https://cohort-iq.vercel.app) 접속
2. "샘플 데이터로 체험해보기" 클릭
3. 분석 결과 확인 후 PDF 리포트 다운로드

### 로컬 실행
```bash
git clone https://github.com/Taek-D/cohort-iq.git
cd cohort-iq
npm install
npm run dev
```

### 테스트
```bash
npm run test     # 단위 테스트 (14개)
npm run build    # 프로덕션 빌드
```

---

## CSV 데이터 형식

필수 컬럼 3개:

| 컬럼명 | 설명 | 예시 |
|--------|------|------|
| `user_id` | 사용자 고유 식별자 | U001 |
| `signup_date` | 가입일 (YYYY-MM-DD) | 2025-01-06 |
| `event_date` | 활동 발생일 (YYYY-MM-DD) | 2025-01-13 |

```csv
user_id,signup_date,event_date
U001,2025-01-06,2025-01-06
U001,2025-01-06,2025-01-13
U002,2025-01-06,2025-01-06
```

- 파일 크기: 최대 10,000행
- 모든 데이터는 브라우저 내에서만 처리 (서버 전송 없음)

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| Core | Vanilla JavaScript (ES6+ Module) |
| Build | Vite 7 |
| Test | Vitest |
| Data | PapaParse, date-fns |
| Visualization | Chart.js + chartjs-chart-matrix |
| Export | jsPDF, html2canvas-pro |
| Styling | Tailwind CSS 4 |
| Performance | Web Worker |
| Hosting | Vercel |

---

## 프로젝트 구조

```
cohort-iq/
├── src/
│   ├── core/
│   │   ├── dataValidator.js      # CSV 검증 + 컬럼 자동 매칭
│   │   ├── cohortAnalysis.js     # 코호트 그룹화 + 리텐션 계산
│   │   ├── churnAnalysis.js      # RFM 위험 스코어링
│   │   ├── analysisWorker.js     # Web Worker (분석 오프로딩)
│   │   └── *.test.js             # 단위 테스트 (14개)
│   ├── visualization/
│   │   ├── heatmapRenderer.js    # 히트맵 + 트렌드 차트
│   │   └── churnVisualization.js # 위험 도넛 차트 + 테이블
│   ├── export/
│   │   ├── summaryGenerator.js   # Executive Summary HTML
│   │   └── pdfExporter.js        # HTML → PDF 변환
│   ├── main.js                   # 앱 진입점
│   └── style.css                 # Tailwind CSS
├── public/
│   └── sample_cohort_data.csv    # 샘플 데이터
├── index.html
├── vite.config.js
└── package.json
```

### 모듈 의존 관계
```
dataValidator → cohortAnalysis → heatmapRenderer
              → churnAnalysis  → churnVisualization
              → summaryGenerator → pdfExporter
              → analysisWorker (Web Worker)
```

---

## 성능

| 메트릭 | 목표 | 실측 |
|--------|------|------|
| 코호트 분석 (17행) | 3초 | 1ms |
| Churn 스코어링 (10명) | 3초 | 5ms |
| Summary 생성 | 3초 | 10ms |
| PDF 다운로드 | 5초 | ~3초 |

---

## 라이선스

MIT
