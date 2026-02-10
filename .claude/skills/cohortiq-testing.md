---
name: cohortiq-testing
description: CohortIQ 테스트 패턴, Vitest 설정, 테스트 실행 방법. Use when writing tests, debugging test failures, or adding test coverage.
---

# CohortIQ Testing

## Framework
**Vitest 4.0.18** — Vite-native test runner

## Configuration
`vitest.config.js`: pattern `src/**/*.test.js`, globals: true, env: node

## Test Files (102 tests, 8 files)

| File | Target | Tests | Key Assertions |
|------|--------|:-----:|----------------|
| `dataValidator.test.js` | dataValidator | 9 | Required columns, date format, row limit |
| `cohortAnalysis.test.js` | cohortAnalysis | 4 | Cohort grouping, retention calculation |
| `churnAnalysis.test.js` | churnAnalysis | 4 | Risk score, segment classification |
| `summaryGenerator.test.js` | summaryGenerator | 8 | Summary data, health score, grades |
| `helpers.test.js` | helpers | 20 | Gamma, beta, incomplete gamma functions |
| `ltvPrediction.test.js` | ltvPrediction | 18 | BG/NBD, Gamma-Gamma, LTV values |
| `statisticalTests.test.js` | statisticalTests | 17 | Chi², KM survival, Log-Rank |
| `abTestSimulation.test.js` | abTestSimulation | 22 | normalCDF/PPF, power, sample size |

## Commands

```bash
# All tests
cd cohort-iq && npm run test

# Single module
cd cohort-iq && npx vitest run src/core/{module}.test.js

# Watch mode
cd cohort-iq && npx vitest
```

## Test Data
- Sample CSV: `src/data/samples/sample-cohort.csv`
- 1,010 users / 2,306 rows / 16 cohorts
- Required columns: `user_id`, `signup_date`, `event_date`

## Writing Tests

```javascript
import { describe, it, expect } from 'vitest';
import { targetFunction } from './targetModule.js';

describe('targetFunction', () => {
  it('should handle expected input', () => {
    const result = targetFunction(testData);
    expect(result.valid).toBe(true);
  });
});
```

## Key Patterns
1. File naming: `src/{path}/{module}.test.js`
2. Use `describe`/`it`/`expect` (Vitest globals)
3. Inline test data (minimize external dependencies)
4. Default locale `ko` for test compatibility (no test modifications needed)
5. Performance: use `performance.now()` when measuring
6. Math tests: use `toBeCloseTo()` for floating point (3-4 decimal places)
