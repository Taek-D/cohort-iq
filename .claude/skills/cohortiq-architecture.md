---
name: cohortiq-architecture
description: CohortIQ 전체 아키텍처, 폴더 구조, 모듈 의존성, Web Worker 구조. Use when working with project structure, module dependencies, or architectural decisions.
---

# CohortIQ Architecture

## Overview
순수 클라이언트 사이드 코호트 분석 SPA. 서버 없이 브라우저에서 CSV -> 분석 -> 시각화 -> PDF Export.

## Tech Stack
- **Language**: Vanilla JavaScript (ES6+, ES Module)
- **Build**: Vite 7.2.4 | **Test**: Vitest 4.0.18
- **CSS**: Tailwind CSS 4.1.18
- **Charts**: Chart.js 4.5.1 + chartjs-chart-matrix 3.0.0
- **Dates**: date-fns 4.1.0 | **CSV**: PapaParse 5.5.3
- **PDF**: jsPDF 4.1.0 + html2canvas-pro
- **i18n**: Custom (ko/en, 142 keys)

## Module Dependency Graph
```
dataValidator → cohortAnalysis → heatmapRenderer
              → churnAnalysis  → churnVisualization
              → ltvPrediction  → ltvVisualization
              → statisticalTests → statisticsRenderer
              → summaryGenerator → pdfExporter
              → analysisWorker (Web Worker, stages 1-4)
abTestSimulation → abTestRenderer (main thread)
i18n (ko/en) → all UI modules
```

## Folder Structure
```
cohort-iq/src/
├── core/                     # Business logic (DOM-independent)
│   ├── dataValidator.js          # CSV validation
│   ├── cohortAnalysis.js         # Cohort grouping + retention
│   ├── churnAnalysis.js          # RFM risk scoring
│   ├── ltvPrediction.js          # BG/NBD + Gamma-Gamma LTV
│   ├── statisticalTests.js       # Chi², KM, Log-Rank
│   ├── abTestSimulation.js       # Power analysis + simulation
│   ├── helpers.js                # Shared utilities (gamma, beta, etc.)
│   ├── analysisWorker.js         # Web Worker (4 stages)
│   └── *.test.js                 # Vitest tests (102 total)
├── visualization/            # Chart.js renderers (DOM-dependent)
│   ├── heatmapRenderer.js       # Retention heatmap + trend line
│   ├── churnVisualization.js     # Risk donut + table + insights
│   ├── ltvVisualization.js       # LTV prediction charts
│   ├── statisticsRenderer.js     # Survival curve + test cards
│   └── abTestRenderer.js        # A/B comparison + power curve
├── export/                   # PDF/HTML export
│   ├── summaryGenerator.js       # Executive Summary HTML
│   ├── pdfExporter.js            # HTML → Canvas → PDF
│   └── summaryGenerator.test.js  # Summary tests (8)
├── i18n/                     # Internationalization
│   ├── index.js                  # t(), setLocale(), getLocale()
│   ├── ko.js                     # Korean (142 keys)
│   └── en.js                     # English (142 keys)
├── ui/
│   └── appLayout.js              # Tab layout (5 tabs)
├── data/samples/
│   └── sample-cohort.csv         # 1,010 users / 2,306 rows / 16 cohorts
├── main.js                   # App entry (UI + Worker communication)
└── style.css                 # Tailwind CSS directives
```

## Web Worker Architecture
- **Main thread** (`main.js`): UI events, file upload, chart rendering, A/B sliders
- **Worker thread** (`analysisWorker.js`): Cohort + Churn + LTV + Stats (4 stages)
- **Communication**: `postMessage` / `onmessage`
- **Rule**: <1ms operations (A/B sliders) stay on main thread

## Core Rules
1. `core/` modules never access DOM — pure data processing only
2. `visualization/` receives canvas elements and returns Chart.js instances
3. `export/` combines core + visualization results into final output
4. All dates via `date-fns` — no native Date manipulation
5. CSV via `PapaParse` — no manual string parsing
6. Chart.js instances must `destroy()` before recreation
7. Import `chart.js/auto` (not `chart.js`)
8. Pass canvas element (not 2d context) to Chart.js
