# 모듈별 테스트 실행

Vitest로 특정 모듈의 테스트를 실행합니다.

## 사용법

`$ARGUMENTS`에 테스트할 모듈명을 지정합니다.

## 테스트 파일 매핑

| 모듈 | 테스트 파일 | 테스트 수 | 검증 항목 |
|------|------------|-----------|-----------|
| dataValidator | `src/core/dataValidator.test.js` | 9 | CSV 입력 검증, 필수 컬럼, 날짜 형식 |
| cohortAnalysis | `src/core/cohortAnalysis.test.js` | 4 | 코호트 그룹화, 리텐션 계산 |
| churnAnalysis | `src/core/churnAnalysis.test.js` | 4 | 위험 스코어, 세그먼트 분류 |
| summaryGenerator | `src/export/summaryGenerator.test.js` | 8 | Summary 데이터, 건강도 점수 |
| helpers | `src/core/helpers.test.js` | 20 | 유틸리티 함수 |
| ltvPrediction | `src/core/ltvPrediction.test.js` | 18 | BG/NBD, Gamma-Gamma, LTV 계산 |
| statisticalTests | `src/core/statisticalTests.test.js` | 17 | Chi-squared, KM, Log-Rank |
| abTestSimulation | `src/core/abTestSimulation.test.js` | 22 | Power analysis, simulation |

## 실행

```bash
cd cohort-iq && npx vitest run src/core/$ARGUMENTS.test.js
```

## 전체 테스트 (102개)

```bash
cd cohort-iq && npm run test
```

## 감시 모드 (개발 중)

```bash
cd cohort-iq && npx vitest src/core/$ARGUMENTS.test.js
```
