// statisticsRenderer.js — Survival curve + statistical test result cards
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

const SURVIVAL_COLOR = 'rgba(16, 185, 129, 0.9)';
const SURVIVAL_FILL = 'rgba(16, 185, 129, 0.08)';

/**
 * Render Kaplan-Meier survival curve as a Chart.js step-line chart.
 * @param {HTMLCanvasElement} canvas
 * @param {Object} kmData - { survivalFunction, medianSurvival }
 * @returns {Chart}
 */
export function renderSurvivalCurve(canvas, kmData) {
  const ctx = canvas.getContext('2d');
  const sf = kmData.survivalFunction;

  const labels = sf.map((p) => p.time);
  const data = sf.map((p) => Math.round(p.survival * 1000) / 10); // percentage

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: t('stats.survivalRate'),
          data,
          borderColor: SURVIVAL_COLOR,
          backgroundColor: SURVIVAL_FILL,
          fill: true,
          stepped: 'before',
          tension: 0,
          pointRadius: 3,
          pointBackgroundColor: SURVIVAL_COLOR,
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
        tooltip: {
          ...tooltip,
          callbacks: {
            label: (context) => {
              const idx = context.dataIndex;
              const point = sf[idx];
              return [
                `${t('stats.survivalRate')}: ${data[idx]}%`,
                `${t('stats.atRisk')}: ${point.nRisk}`,
                `${t('stats.events')}: ${point.nEvent}`,
              ];
            },
          },
        },
        annotation:
          kmData.medianSurvival !== null
            ? {
                annotations: {
                  medianLine: {
                    type: 'line',
                    yMin: 50,
                    yMax: 50,
                    borderColor: 'rgba(107, 114, 128, 0.4)',
                    borderWidth: 1,
                    borderDash: [4, 4],
                  },
                },
              }
            : undefined,
      },
      scales: {
        x: {
          grid: { display: false },
          title: {
            display: true,
            text: t('stats.weeksFromSignup'),
            color: '#6b7280',
            font: { size: 11 },
          },
          ticks: {
            color: '#6b7280',
            font: { family: "'JetBrains Mono', monospace", size: 10 },
          },
        },
        y: {
          min: 0,
          max: 100,
          grid: { color: '#f3f4f6' },
          title: {
            display: true,
            text: t('stats.survivalPct'),
            color: '#6b7280',
            font: { size: 11 },
          },
          ticks: {
            color: '#6b7280',
            callback: (v) => `${v}%`,
            font: { family: "'JetBrains Mono', monospace", size: 10 },
          },
        },
      },
    },
  });

  return chart;
}

/**
 * Render statistics result cards (Chi-Square, Log-Rank, median survival).
 * @param {Object} statsResult - { chiSquare, kaplanMeier, logRank }
 * @returns {string} HTML
 */
export function renderStatisticsCards(statsResult) {
  const { chiSquare, kaplanMeier: km, logRank } = statsResult;

  const significantBadge = (sig) =>
    sig
      ? `<span class="stats-badge stats-badge-sig">${t('stats.significant')}</span>`
      : `<span class="stats-badge stats-badge-ns">${t('stats.notSignificant')}</span>`;

  const chiCard = `
    <div class="stats-test-card">
      <div class="stats-test-header">
        <h4 class="stats-test-name">${t('stats.chiSquare')}</h4>
        ${significantBadge(chiSquare.significant)}
      </div>
      <p class="stats-test-desc">${t('stats.chiSquareDesc')}</p>
      <div class="stats-test-metrics">
        <div class="stats-metric">
          <span class="stats-metric-label">&chi;&sup2;</span>
          <span class="stats-metric-value">${chiSquare.chi2}</span>
        </div>
        <div class="stats-metric">
          <span class="stats-metric-label">df</span>
          <span class="stats-metric-value">${chiSquare.df}</span>
        </div>
        <div class="stats-metric">
          <span class="stats-metric-label">p-value</span>
          <span class="stats-metric-value ${chiSquare.significant ? 'stats-sig' : ''}">${chiSquare.pValue < 0.001 ? '<0.001' : chiSquare.pValue}</span>
        </div>
      </div>
      <p class="stats-test-conclusion">${chiSquare.significant ? t('stats.chiSquareSig') : t('stats.chiSquareNs')}</p>
    </div>`;

  const lrCard = `
    <div class="stats-test-card">
      <div class="stats-test-header">
        <h4 class="stats-test-name">${t('stats.logRank')}</h4>
        ${significantBadge(logRank.significant)}
      </div>
      <p class="stats-test-desc">${t('stats.logRankDesc')}</p>
      <div class="stats-test-metrics">
        <div class="stats-metric">
          <span class="stats-metric-label">${t('stats.testStat')}</span>
          <span class="stats-metric-value">${logRank.testStatistic}</span>
        </div>
        <div class="stats-metric">
          <span class="stats-metric-label">p-value</span>
          <span class="stats-metric-value ${logRank.significant ? 'stats-sig' : ''}">${logRank.pValue < 0.001 ? '<0.001' : logRank.pValue}</span>
        </div>
      </div>
      <p class="stats-test-conclusion">
        ${logRank.group1Label && logRank.group2Label ? t('stats.logRankGroups', { g1: logRank.group1Label, g2: logRank.group2Label }) : ''}
        ${logRank.significant ? t('stats.logRankSig') : t('stats.logRankNs')}
      </p>
    </div>`;

  const medianCard =
    km.medianSurvival !== null
      ? `
    <div class="stats-test-card stats-test-card-accent">
      <div class="stats-test-header">
        <h4 class="stats-test-name">${t('stats.medianSurvival')}</h4>
      </div>
      <div class="stats-test-metrics">
        <div class="stats-metric">
          <span class="stats-metric-label">${t('stats.medianWeeks')}</span>
          <span class="stats-metric-value stats-metric-lg">${km.medianSurvival}</span>
        </div>
      </div>
      <p class="stats-test-conclusion">${t('stats.medianDesc', { weeks: km.medianSurvival })}</p>
    </div>`
      : '';

  return chiCard + lrCard + medianCard;
}
