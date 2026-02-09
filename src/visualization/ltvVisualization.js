// ltvVisualization.js — LTV 시각화 (Chart.js)
import { Chart } from 'chart.js/auto';

const tooltip = {
  backgroundColor: '#111827',
  titleColor: '#f9fafb',
  bodyColor: '#d1d5db',
  borderColor: '#374151',
  borderWidth: 1,
  cornerRadius: 4,
  padding: 8,
  bodyFont: { family: "'Pretendard', sans-serif", size: 12 },
};

const OBSERVED_COLOR = 'rgba(37, 99, 235, 0.75)';
const PROJECTED_COLOR = 'rgba(37, 99, 235, 0.25)';
const TREND_SOLID = 'rgba(37, 99, 235, 0.90)';
const TREND_DASHED = 'rgba(37, 99, 235, 0.50)';

const CONFIDENCE_BADGE = {
  high: { bg: '#dcfce7', text: '#166534', label: 'High' },
  medium: { bg: '#fef9c3', text: '#854d0e', label: 'Med' },
  low: { bg: '#fee2e2', text: '#991b1b', label: 'Low' },
};

/**
 * 코호트별 LTV 바 차트
 * @param {HTMLCanvasElement} canvas
 * @param {Array} cohortLTVs
 * @returns {Chart}
 */
export function renderLTVBarChart(canvas, cohortLTVs) {
  const ctx = canvas.getContext('2d');
  const labels = cohortLTVs.map((c) => c.cohort);

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Observed LTV',
          data: cohortLTVs.map((c) => c.observedLTV),
          backgroundColor: OBSERVED_COLOR,
          borderRadius: 4,
          barPercentage: 0.6,
        },
        {
          label: 'Projected LTV',
          data: cohortLTVs.map((c) => c.projectedLTV),
          backgroundColor: PROJECTED_COLOR,
          borderColor: 'rgba(37, 99, 235, 0.50)',
          borderWidth: 1,
          borderDash: [4, 4],
          borderRadius: 4,
          barPercentage: 0.6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { display: false },
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            color: '#4b5563',
            boxWidth: 8,
            boxHeight: 8,
            borderRadius: 2,
            padding: 10,
            font: { family: "'JetBrains Mono', monospace", size: 10 },
          },
        },
        tooltip: {
          ...tooltip,
          callbacks: {
            afterBody: (items) => {
              const idx = items[0].dataIndex;
              const c = cohortLTVs[idx];
              return [
                `Confidence: ${c.confidence}`,
                `Observed: ${c.observedWeeks}w / Total: ${c.totalWeeks}w`,
                `Cohort size: ${c.cohortSize}`,
              ];
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: '#6b7280',
            font: { family: "'JetBrains Mono', monospace", size: 10 },
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: '#f3f4f6' },
          ticks: {
            color: '#6b7280',
            font: { family: "'JetBrains Mono', monospace", size: 10 },
          },
          title: {
            display: true,
            text: 'LTV',
            color: '#6b7280',
            font: { size: 11 },
          },
        },
      },
    },
  });
}

/**
 * LTV 트렌드 라인 차트
 * @param {HTMLCanvasElement} canvas
 * @param {Array} cohortLTVs
 * @returns {Chart}
 */
export function renderLTVTrendChart(canvas, cohortLTVs) {
  const ctx = canvas.getContext('2d');
  const labels = cohortLTVs.map((c) => c.cohort);

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Observed LTV',
          data: cohortLTVs.map((c) => c.observedLTV),
          borderColor: TREND_SOLID,
          backgroundColor: 'rgba(37, 99, 235, 0.08)',
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: TREND_SOLID,
          borderWidth: 2,
        },
        {
          label: 'Projected LTV',
          data: cohortLTVs.map((c) => c.projectedLTV),
          borderColor: TREND_DASHED,
          borderDash: [6, 3],
          fill: false,
          tension: 0.3,
          pointRadius: 4,
          pointStyle: 'rectRot',
          pointBackgroundColor: TREND_DASHED,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { display: false },
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            color: '#4b5563',
            boxWidth: 8,
            boxHeight: 8,
            borderRadius: 2,
            padding: 10,
            font: { family: "'JetBrains Mono', monospace", size: 10 },
          },
        },
        tooltip,
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: '#6b7280',
            font: { family: "'JetBrains Mono', monospace", size: 10 },
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: '#f3f4f6' },
          ticks: {
            color: '#6b7280',
            font: { family: "'JetBrains Mono', monospace", size: 10 },
          },
          title: {
            display: true,
            text: 'LTV',
            color: '#6b7280',
            font: { size: 11 },
          },
        },
      },
    },
  });
}

/**
 * LTV 비교 테이블 HTML
 * @param {Array} cohortLTVs
 * @param {Object} summary
 * @returns {string}
 */
export function renderLTVComparisonTable(cohortLTVs, summary) {
  if (!cohortLTVs || cohortLTVs.length === 0) {
    return '<p class="empty-msg">No LTV data available.</p>';
  }

  const trendLabel = {
    improving: '↑ Improving',
    declining: '↓ Declining',
    stable: '→ Stable',
  };
  const trendClass = {
    improving: 'trend-up',
    declining: 'trend-down',
    stable: 'trend-flat',
  };

  const rows = cohortLTVs
    .map((c) => {
      const badge = CONFIDENCE_BADGE[c.confidence];
      const isBest =
        summary.bestCohort && c.cohort === summary.bestCohort.cohort;
      const isWorst =
        summary.worstCohort && c.cohort === summary.worstCohort.cohort;
      const tag = isBest
        ? '<span class="ltv-tag best">Best</span>'
        : isWorst
          ? '<span class="ltv-tag worst">Worst</span>'
          : '';

      return `<tr>
      <td class="cell-cohort">${c.cohort} ${tag}</td>
      <td class="cell-num">${c.cohortSize}</td>
      <td class="cell-num">${c.observedLTV.toFixed(2)}</td>
      <td class="cell-num cell-bold">${c.projectedLTV.toFixed(2)}</td>
      <td class="cell-num">${c.observedWeeks}w / ${c.totalWeeks}w</td>
      <td><span class="conf-badge" style="background:${badge.bg};color:${badge.text}">${badge.label}</span></td>
    </tr>`;
    })
    .join('');

  return `
    <div class="ltv-summary-bar">
      <span>Avg LTV: <strong>${summary.averageLTV.toFixed(2)}</strong></span>
      <span>Median: <strong>${summary.medianLTV.toFixed(2)}</strong></span>
      <span>Revenue: <strong>${summary.totalProjectedRevenue.toFixed(0)}</strong></span>
      <span class="${trendClass[summary.ltvTrend]}">${trendLabel[summary.ltvTrend]}</span>
    </div>
    <table class="ltv-table">
      <thead>
        <tr>
          <th>Cohort</th>
          <th>Size</th>
          <th>Observed</th>
          <th>Projected</th>
          <th>Weeks</th>
          <th>Conf.</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}
