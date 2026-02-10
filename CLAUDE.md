# CohortIQ

**구독 비즈니스 코호트 분석 도구** (Vanilla JS SPA)
- Live: https://cohort-iq.vercel.app
- GitHub: https://github.com/Taek-D/cohort-iq
- 상세 기록: `docs/project-history.md`

## Tech Stack

Vite 7.2.4 | Vitest 4.0.18 | Tailwind 4.1.18 | Chart.js 4.5.1 + matrix 3.0.0 | date-fns 4.1.0 | PapaParse 5.5.3 | jsPDF 4.1.0 | html2canvas-pro

## Architecture

```
dataValidator → cohortAnalysis → heatmapRenderer
              → churnAnalysis  → churnVisualization
              → ltvPrediction  → ltvVisualization
              → statisticalTests → statisticsRenderer
              → summaryGenerator → pdfExporter
              → analysisWorker (Web Worker)
abTestSimulation → abTestRenderer (main thread)
i18n (ko/en) → all UI modules
```

## Development Workflow

- Package manager: **npm** (package-lock.json)
- All commands run from `cohort-iq/` directory
- Build: `npm run build` | Dev: `npm run dev` | Test: `npm run test`
- 102 tests across 8 files — all passing

## Coding Conventions

- Vanilla JavaScript (ES6+), no framework
- ES Modules (`import`/`export`)
- Functional programming preferred (pure functions, immutability)
- Dates: always `date-fns` | CSV: always `PapaParse` | Charts: `chart.js/auto`
- Chart.js import: `chart.js/auto` (not `chart.js`)
- Canvas: pass element (not 2d context) to Chart.js
- html2canvas: use `html2canvas-pro` (oklch support for Tailwind v4)
- i18n default locale: `ko` (for test compatibility)

## Forbidden

- `var` keyword — use `const`/`let`
- `console.log` in commits
- External API calls (pure client-side only)
- Direct `node_modules` modification
- Synchronous FileReader

## CSV Data Format

Required columns: `user_id`, `signup_date`, `event_date`
Sample: 1,010 users / 2,306 rows / 16 cohorts

## Key Path Note

Project path contains Korean characters — quote paths in shell commands:
`cd "E:/프로젝트/코호트-LTV 분석/cohort-iq"`
