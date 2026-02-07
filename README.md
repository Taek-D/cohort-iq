# CohortIQ (코호트 분석 & 이탈 예측 솔루션)

**CohortIQ**는 구독 비즈니스와 SaaS 서비스를 위한 클라이언트 사이드 데이터 분석 도구입니다. CSV 파일 업로드만으로 코호트 리텐션(재방문율)을 분석하고, 머신러닝 없이 RFM 기반 알고리즘으로 이탈(Churn) 위험 사용자를 식별하여 실행 가능한 인사이트를 제공합니다.

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

## 🚀 주요 기능

### 1. 코호트 리텐션 분석 (Cohort Analysis)
- **주간(Weekly) 코호트 자동 생성**: 가입일(`signup_date`) 기준으로 사용자를 그룹화합니다.
- **리텐션 히트맵**: 주차별 재방문율을 직관적인 히트맵으로 시각화합니다.
- **트렌드 차트**: 리텐션율 변화 추이를 선형 그래프로 제공합니다.

### 2. 이탈 위험 예측 (Churn Risk Identification)
- **RFM 기반 스코어링**: 최근 활동(Recency), 활동 빈도(Frequency), 활동 기간(Tenure)을 종합하여 위험도를 평가합니다.
- **위험 세그먼트 분류**: 사용자를 `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` 4단계로 분류합니다.
- **AI 인사이트**: 데이터 패턴을 분석하여 즉시 실행 가능한 마케팅/운영 액션을 제안합니다.

### 3. Executive Summary 리포트
- **1-Page PDF 리포트**: 경영진 보고용 요약 리포트를 즉시 생성합니다.
- **건강도 점수(Health Score)**: 리텐션과 이탈률을 종합한 100점 만점 지표를 제공합니다.

## 🛠️ 기술 스택

- **Core**: Vanilla JavaScript (ES Module)
- **Performance**: Web Workers (Analysis Offloading)
- **Build**: Vite
- **Testing**: Vitest
- **Data Processing**: PapaParse (CSV Parsing), date-fns (Date Manipulation)
- **Visualization**: Chart.js, chartjs-chart-matrix
- **Export**: jsPDF, html2canvas
- **Styling**: Tailwind CSS

## 💻 설치 및 실행 로컬

```bash
# 1. 저장소 클론
git clone https://github.com/your-repo/cohort-iq.git
cd cohort-iq

# 2. 의존성 설치
npm install

# 3. 개발 서버 실행

npm run dev

# 4. 단위 테스트 실행
npm run test
```

## 📂 데이터 형식 (CSV)

분석을 위해 아래 3개 컬럼이 필수입니다. (`.csv` 포맷)

| 컬럼명 | 설명 | 예시 |
|--------|------|------|
| `user_id` | 사용자 고유 식별자 | u_101 |
| `signup_date` | 가입일 (YYYY-MM-DD) | 2024-01-01 |
| `event_date` | 활동/로그인 발생일 | 2024-01-03 |

*   *파일 크기 제한: 최대 10,000행 (브라우저 처리 성능 고려)*
*   *개인정보: 모든 데이터는 브라우저 내에서만 처리되며 서버로 전송되지 않습니다.*

## 🤝 기여 방법

이 프로젝트는 오픈 소스입니다. 버그 리포트나 기능 제안은 Issue를 통해 남겨주세요.

---
**CohortIQ** - Data-Driven Decisions for Subscription Growth
