// abTestRenderer.js — A/B Test simulation result charts and HTML cards
import { Chart } from 'chart.js/auto';
import { t } from '../i18n/index.js';

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

const MONO_FONT = { family: "'JetBrains Mono', monospace", size: 10 };
const CONTROL_COLOR = 'rgba(107, 114, 128, 0.9)';
const TREATMENT_COLOR = 'rgba(99, 102, 241, 0.9)';
const TREATMENT_FILL = 'rgba(99, 102, 241, 0.08)';
const POWER_COLOR = 'rgba(16, 185, 129, 0.9)';
const POWER_FILL = 'rgba(16, 185, 129, 0.08)';

/**
 * Render Before vs After retention curve comparison.
 * @param {HTMLCanvasElement} canvas
 * @param {Object} retentionData — { control, treatment, targetWeek, delta }
 * @returns {Chart}
 */
export function renderRetentionComparison(canvas, retentionData) {
  const ctx = canvas.getContext('2d');
  const { control, treatment } = retentionData;

  const labels = control.map((p) => p.week);

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: t('abtest.control'),
          data: control.map((p) => p.retention),
          borderColor: CONTROL_COLOR,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [6, 3],
          pointRadius: 3,
          pointBackgroundColor: CONTROL_COLOR,
          tension: 0.3,
        },
        {
          label: t('abtest.treatment'),
          data: treatment.map((p) => p.retention),
          borderColor: TREATMENT_COLOR,
          backgroundColor: TREATMENT_FILL,
          fill: true,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: TREATMENT_COLOR,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            color: '#4b5563',
            boxWidth: 8,
            boxHeight: 8,
            borderRadius: 2,
            padding: 10,
            font: MONO_FONT,
          },
        },
        tooltip: {
          ...tooltip,
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)}%`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          title: {
            display: true,
            text: t('chart.week'),
            color: '#6b7280',
            font: { size: 11 },
          },
          ticks: { color: '#6b7280', font: MONO_FONT },
        },
        y: {
          min: 0,
          max: 100,
          grid: { color: '#f3f4f6' },
          title: {
            display: true,
            text: t('chart.retentionPct'),
            color: '#6b7280',
            font: { size: 11 },
          },
          ticks: {
            color: '#6b7280',
            callback: (v) => `${v}%`,
            font: MONO_FONT,
          },
        },
      },
    },
  });
}

/**
 * Render Power Curve (N vs Power).
 * @param {HTMLCanvasElement} canvas
 * @param {Array<{n: number, power: number}>} powerCurve
 * @param {number} requiredN — vertical reference line
 * @returns {Chart}
 */
export function renderPowerCurve(canvas, powerCurve, requiredN) {
  const ctx = canvas.getContext('2d');

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: powerCurve.map((p) => p.n),
      datasets: [
        {
          label: t('abtest.power'),
          data: powerCurve.map((p) => Math.round(p.power * 100)),
          borderColor: POWER_COLOR,
          backgroundColor: POWER_FILL,
          fill: true,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: POWER_COLOR,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            color: '#4b5563',
            boxWidth: 8,
            boxHeight: 8,
            borderRadius: 2,
            padding: 10,
            font: MONO_FONT,
          },
        },
        tooltip: {
          ...tooltip,
          callbacks: {
            label: (ctx) =>
              `N=${powerCurve[ctx.dataIndex].n}: ${ctx.parsed.y}%`,
          },
        },
        annotation: {
          annotations: {
            powerLine: {
              type: 'line',
              yMin: 80,
              yMax: 80,
              borderColor: 'rgba(107, 114, 128, 0.4)',
              borderWidth: 1,
              borderDash: [4, 4],
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          title: {
            display: true,
            text: t('abtest.sampleCol'),
            color: '#6b7280',
            font: { size: 11 },
          },
          ticks: { color: '#6b7280', font: MONO_FONT },
        },
        y: {
          min: 0,
          max: 100,
          grid: { color: '#f3f4f6' },
          title: {
            display: true,
            text: t('abtest.power'),
            color: '#6b7280',
            font: { size: 11 },
          },
          ticks: {
            color: '#6b7280',
            callback: (v) => `${v}%`,
            font: MONO_FONT,
          },
        },
      },
    },
  });
}

/**
 * Render result summary cards HTML.
 * @param {Object} powerAnalysis
 * @param {Object} ltvImpact
 * @returns {string} HTML
 */
export function renderResultCards(powerAnalysis, ltvImpact) {
  const fmt = (n) =>
    typeof n === 'number' && isFinite(n) ? n.toLocaleString() : '—';

  return `
    <div class="abtest-result-card">
      <span class="abtest-result-label">${t('abtest.requiredSample')}</span>
      <span class="abtest-result-value">${fmt(powerAnalysis.sampleSize)}</span>
    </div>
    <div class="abtest-result-card">
      <span class="abtest-result-label">${t('abtest.totalSample')}</span>
      <span class="abtest-result-value">${fmt(powerAnalysis.totalSampleSize)}</span>
    </div>
    <div class="abtest-result-card">
      <span class="abtest-result-label">${t('abtest.mde')}</span>
      <span class="abtest-result-value">${(powerAnalysis.mde * 100).toFixed(1)}%p</span>
    </div>
    <div class="abtest-result-card">
      <span class="abtest-result-label">${t('abtest.ltvChange')}</span>
      <span class="abtest-result-value abtest-positive">+${ltvImpact.ltvDelta}</span>
    </div>
    <div class="abtest-result-card">
      <span class="abtest-result-label">${t('abtest.ltvChangePct')}</span>
      <span class="abtest-result-value abtest-positive">+${ltvImpact.ltvDeltaPct}%</span>
    </div>
    <div class="abtest-result-card">
      <span class="abtest-result-label">${t('abtest.monthlyRevenue')}</span>
      <span class="abtest-result-value abtest-positive">${ltvImpact.monthlyRevenueImpact >= 0 ? '+' : ''}${fmt(ltvImpact.monthlyRevenueImpact)}</span>
    </div>`;
}

/**
 * Render scenario comparison table HTML.
 * @param {Array} scenarios
 * @returns {string} HTML
 */
export function renderScenarioTable(scenarios) {
  const fmt = (n) =>
    typeof n === 'number' && isFinite(n) ? n.toLocaleString() : '—';

  const rows = scenarios
    .map(
      (s) => `
      <tr>
        <td>${t(s.name)}</td>
        <td class="text-right">+${s.delta}%p</td>
        <td class="text-right">${fmt(s.sampleSize)}</td>
        <td class="text-right abtest-positive">+${s.ltvDelta}</td>
        <td class="text-right abtest-positive">${s.monthlyROI >= 0 ? '+' : ''}${fmt(s.monthlyROI)}</td>
      </tr>`
    )
    .join('');

  return `
    <table class="abtest-table">
      <thead>
        <tr>
          <th>${t('abtest.scenario')}</th>
          <th class="text-right">${t('abtest.deltaCol')}</th>
          <th class="text-right">${t('abtest.sampleCol')}</th>
          <th class="text-right">${t('abtest.ltvCol')}</th>
          <th class="text-right">${t('abtest.roiCol')}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}
