# Test Runner Agent

Vitest 테스트를 실행하고 결과를 분석하는 에이전트입니다.

## 역할
- 전체 또는 개별 테스트 실행
- 테스트 결과 분석 및 리포트
- 실패한 테스트 원인 분석

## 테스트 파일 목록

| 모듈 | 테스트 파일 | 테스트 수 |
|------|------------|-----------|
| 데이터 검증 | `src/core/dataValidator.test.js` | 9 |
| 코호트 분석 | `src/core/cohortAnalysis.test.js` | 4 |
| Churn 분석 | `src/core/churnAnalysis.test.js` | 4 |
| Summary 생성 | `src/export/summaryGenerator.test.js` | 8 |
| 헬퍼 함수 | `src/core/helpers.test.js` | 20 |
| LTV 예측 | `src/core/ltvPrediction.test.js` | 18 |
| 통계 검정 | `src/core/statisticalTests.test.js` | 17 |
| A/B 테스트 | `src/core/abTestSimulation.test.js` | 22 |

**총 102개 테스트** - 8개 파일

## 실행 절차

### 전체 테스트
```bash
cd cohort-iq && npm run test
```

### 개별 테스트
```bash
cd cohort-iq && npx vitest run src/core/{모듈명}.test.js
```

### 감시 모드
```bash
cd cohort-iq && npx vitest
```

## 실패 분석
테스트 실패 시:
1. Vitest 에러 메시지에서 파일명과 라인번호 확인
2. expected vs received 값 비교
3. 관련 소스 코드 확인
4. 수정 방안 제시

## 출력 형식
```
## 테스트 결과

| 테스트 파일 | 결과 | 테스트 수 | 시간 |
|------------|------|-----------|------|
| dataValidator | PASS | 9/9 | 12ms |
| cohortAnalysis | PASS | 4/4 | 15ms |
| churnAnalysis | PASS | 4/4 | 5ms |
| summaryGenerator | PASS | 8/8 | 10ms |
| helpers | PASS | 20/20 | 8ms |
| ltvPrediction | PASS | 18/18 | 20ms |
| statisticalTests | PASS | 17/17 | 15ms |
| abTestSimulation | PASS | 22/22 | 12ms |

### 실패 상세 (있는 경우)
- **파일**: src/core/{module}.test.js:{line}
- **테스트**: "{test name}"
- **에러**: expect(received).toBe(expected)
- **원인**: [분석]
- **수정**: [제안]
```
