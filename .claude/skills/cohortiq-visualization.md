---
name: cohortiq-visualization
description: Chart.js 히트맵, 트렌드 차트, 도넛 차트, 생존 곡선, LTV/A/B 차트 등 시각화 모듈. Use when working with charts, heatmaps, visualizations, Chart.js configuration, or canvas rendering.
---

# CohortIQ Visualization

## Chart Library
- **Chart.js 4.5.1**: Line, doughnut, bar charts
- **chartjs-chart-matrix 3.0.0**: Heatmap matrix

## Renderer Files

### `heatmapRenderer.js` — Retention Analysis
- `renderRetentionHeatmap(canvas, heatmapData)`: Matrix chart (cohort x week)
  - Colors: Green (#10b981) >= 75%, Orange (#f59e0b) >= 50%, Red (#ef4444) >= 25%
- `renderTrendChart(canvas, retentionData)`: Line chart per cohort

### `churnVisualization.js` — Churn Risk
- `renderRiskSegmentChart(canvas, riskSegments)`: Doughnut (CRITICAL/HIGH/MEDIUM/LOW)
- `renderRiskUsersTable(container, risks)`: Top 20 high-risk users table
- `renderInsightsCards(container, insights)`: Priority-based insight cards

### `ltvVisualization.js` — LTV Prediction
- LTV distribution charts, prediction curves
- BG/NBD + Gamma-Gamma model visualization

### `statisticsRenderer.js` — Statistical Tests
- Kaplan-Meier survival curves
- Chi-squared / Log-Rank test result cards

### `abTestRenderer.js` — A/B Test Simulation
- Retention comparison chart (control vs variant)
- Power curve visualization
- Sample size / effect size cards
- Simulation results table

## Chart.js Usage Pattern

```javascript
import { Chart } from 'chart.js/auto';
import { MatrixController, MatrixElement } from 'chartjs-chart-matrix';

// Register plugins (once)
Chart.register(MatrixController, MatrixElement);

// Create chart — pass canvas ELEMENT (not 2d context)
const chart = new Chart(canvas, {
  type: 'matrix', // or 'line', 'doughnut', 'bar'
  data: { datasets: [...] },
  options: { responsive: true, ... }
});

// Update
chart.data = newData;
chart.update();

// Destroy before recreation (prevent memory leak)
chart.destroy();
```

## Rules
1. Always `destroy()` before recreating Chart.js instances
2. Canvas elements are passed in (visualization modules don't create DOM)
3. Colors follow Tailwind palette (emerald, amber, red, gray)
4. `responsive: true` is always enabled
5. Import `chart.js/auto` (NOT `chart.js`)
6. A/B test renderer runs on main thread (slider interactivity <1ms)
