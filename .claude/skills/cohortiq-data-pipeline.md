---
name: cohortiq-data-pipeline
description: CSV 파싱, 데이터 검증, 코호트/Churn/LTV/통계/A/B 분석, Web Worker 등 데이터 처리 파이프라인. Use when working with CSV parsing, data validation, cohort grouping, retention, churn, LTV, statistical tests, A/B simulation, or worker communication.
---

# CohortIQ Data Pipeline

## Pipeline Overview
```
CSV → PapaParse → Validator → Worker → Cohort → Churn → LTV → Stats → Summary
                                     ↘ A/B Simulation (main thread)
```

## Stage 1: CSV Parsing (PapaParse)
```javascript
Papa.parse(file, { header: true, skipEmptyLines: true, complete, error });
```

## Stage 2: Validation (`dataValidator.js`)
- Required columns: `user_id`, `signup_date`, `event_date`
- Date format: ISO 8601 (YYYY-MM-DD)
- Date order: `signup_date <= event_date`
- Max rows: 10,000
- Output: `{ valid, data, errors }`

## Stage 3: Web Worker (`analysisWorker.js`)
4 stages running in background thread:
1. **Cohort Analysis** → retention matrix + heatmap data
2. **Churn Analysis** → risk scores + segments + insights
3. **LTV Prediction** → BG/NBD + Gamma-Gamma + CLV predictions
4. **Statistical Tests** → Chi-squared + KM + Log-Rank

```javascript
const worker = new Worker(new URL('./core/analysisWorker.js', import.meta.url), { type: 'module' });
worker.postMessage({ type: 'analyze', data: validatedData });
worker.onmessage = (e) => { /* render results */ };
```

## Stage 4: Cohort Grouping (`cohortAnalysis.js`)
- `groupByCohort(data)`: Group by `startOfWeek(signup_date, {weekStartsOn: 1})`
- `calculateRetention(data, cohortInfo)`: Week N active / Week 0 total * 100
- Output: `{ retentionMatrix, heatmapData, performance }`

## Stage 5: Churn Analysis (`churnAnalysis.js`)
- `analyzeUserActivity(data, cohortInfo)` → per-user activity patterns
- `calculateChurnRisk(activity)` → RFM score 0-100
  - Recency (0-40) + Frequency (0-30) + Consecutive Inactivity (0-30)
- `segmentByRisk(risks)` → CRITICAL(70+)/HIGH(50-69)/MEDIUM(30-49)/LOW(0-29)
- `generateInsights(segments)` → actionable recommendations

## Stage 6: LTV Prediction (`ltvPrediction.js`)
- BG/NBD model: expected transactions
- Gamma-Gamma model: expected monetary value
- CLV = E[transactions] * E[monetary] * margin
- Uses `helpers.js` for gamma, beta, incomplete gamma functions

## Stage 7: Statistical Tests (`statisticalTests.js`)
- `chiSquaredTest()`: Cohort independence test
- `kaplanMeier()`: Survival probability estimation
- `logRankTest()`: Cohort survival comparison (p-value)

## Stage 8: A/B Simulation (`abTestSimulation.js`) — Main Thread
- `calculateSampleSize(baseline, mde, alpha, power)`: Required N per group
- `runSimulation(params)`: Monte Carlo simulation
- `powerAnalysis(params)`: Power curve generation
- Uses unpooled two-proportion formula (N=373 for typical params)
- Runs on main thread (slider interactivity <1ms)

## Data Transformation Rules
1. `parseISO()` for string → Date conversion
2. Week starts on Monday (`weekStartsOn: 1`)
3. Use `Set` for unique user counts
4. Filter future dates
5. i18n default locale: `ko` (try/catch for localStorage → Worker/Node-safe)
