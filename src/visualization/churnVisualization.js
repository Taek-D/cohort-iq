// churnVisualization.js — Churn Risk Visualization
import { Chart } from 'chart.js/auto';
import { t } from '../i18n/index.js';

function escapeHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

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

/**
 * Risk Segment Doughnut Chart
 * @param {HTMLCanvasElement} canvas
 * @param {Object} riskSegments
 * @returns {Chart}
 */
export function renderRiskSegmentChart(canvas, riskSegments) {
  const ctx = canvas.getContext('2d');
  const { summary } = riskSegments;

  const chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: [
        t('chart.critical'),
        t('chart.high'),
        t('chart.medium'),
        t('chart.low'),
      ],
      datasets: [
        {
          data: [summary.critical, summary.high, summary.medium, summary.low],
          backgroundColor: [
            'rgba(220, 38, 38, 0.80)',
            'rgba(234, 88, 12, 0.75)',
            'rgba(217, 119, 6, 0.65)',
            'rgba(5, 150, 105, 0.75)',
          ],
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverBorderColor: '#ffffff',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        title: { display: false },
        legend: {
          position: 'bottom',
          labels: {
            color: '#4b5563',
            boxWidth: 8,
            boxHeight: 8,
            borderRadius: 2,
            padding: 10,
            font: {
              family: "'JetBrains Mono', monospace",
              size: 10,
            },
            generateLabels: (chart) => {
              const data = chart.data;
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i];
                const pct =
                  summary.total > 0
                    ? Math.round((value / summary.total) * 100)
                    : 0;
                return {
                  text: `${label} ${value} (${pct}%)`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  hidden: false,
                  index: i,
                };
              });
            },
          },
        },
        tooltip: {
          ...tooltip,
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.parsed;
              const pct =
                summary.total > 0
                  ? Math.round((value / summary.total) * 100)
                  : 0;
              return `${label}: ${value} ${t('chart.users')} (${pct}%)`;
            },
          },
        },
      },
    },
  });

  return chart;
}

/**
 * Risk Users Table — right-aligned numbers
 * @param {Array} churnRiskData
 * @param {number} limit
 * @returns {string}
 */
export function renderRiskUsersTable(churnRiskData, limit = 20) {
  const topRiskUsers = churnRiskData.slice(0, limit);

  const rows = topRiskUsers
    .map((user, index) => {
      const badge = getRiskBadge(user.riskLevel);
      const safeUserId = escapeHTML(user.userId);
      const safeCohort = escapeHTML(user.cohort);
      const safeRiskLevel = escapeHTML(user.riskLevel);
      return `
      <tr>
        <td style="font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); text-align: right;">${index + 1}</td>
        <td style="font-weight: 500; color: var(--text-primary);">${safeUserId}</td>
        <td style="font-family: var(--font-mono); font-size: 12px;">${safeCohort}</td>
        <td>
          <span class="risk-badge" style="background: ${badge.bg}; color: ${badge.color};">
            <span class="dot" style="background: ${badge.color};"></span>
            ${safeRiskLevel}
          </span>
        </td>
        <td style="font-family: var(--font-mono); font-size: 12px; text-align: right; font-weight: 600; color: ${badge.color};">${user.riskScore}</td>
        <td style="font-family: var(--font-mono); font-size: 12px; text-align: right;">${user.metrics.weeksSinceLastActivity}w</td>
        <td style="font-family: var(--font-mono); font-size: 12px; text-align: right;">${user.metrics.activityDensity}%</td>
      </tr>
    `;
    })
    .join('');

  return `
    <table class="risk-table">
      <thead>
        <tr>
          <th style="width: 36px; text-align: right;">#</th>
          <th>${t('table.userId')}</th>
          <th>${t('table.cohort')}</th>
          <th>${t('table.risk')}</th>
          <th style="text-align: right;">${t('table.score')}</th>
          <th style="text-align: right;">${t('table.lastActive')}</th>
          <th style="text-align: right;">${t('table.activity')}</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

/**
 * Insight Cards — clean text, no emoji
 * @param {Array} insights
 * @returns {string}
 */
export function renderInsightsCards(insights) {
  const cards = insights
    .map((insight) => {
      const severity = getSeverityStyle(insight.severity);
      const safeTitle = escapeHTML(insight.title);
      const safeDescription = escapeHTML(insight.description);
      const safeAction = escapeHTML(insight.action);
      const safeAffectedUsers = escapeHTML(insight.affectedUsers);

      return `
      <div class="insight-card" style="border-left: 2px solid ${severity.borderColor};">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2px;">
          <h4 style="font-size: 13px; font-weight: 600; color: ${severity.textColor}; margin: 0;">
            ${safeTitle}
          </h4>
          <span style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); white-space: nowrap; margin-left: 12px;">
            ${safeAffectedUsers} ${t('insight.users')}
          </span>
        </div>
        <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.5; margin: 4px 0 6px;">
          ${safeDescription}
        </p>
        <p style="font-size: 12px; color: var(--text-label); margin: 0;">
          &rarr; ${safeAction}
        </p>
      </div>
    `;
    })
    .join('');

  return (
    cards ||
    `<p style="text-align: center; padding: 24px 0; color: var(--text-muted); font-size: 13px;">${t('insight.noInsights')}</p>`
  );
}

/**
 * Risk Badge Styles
 */
function getRiskBadge(riskLevel) {
  const badges = {
    CRITICAL: { color: '#dc2626', bg: '#fef2f2' },
    HIGH: { color: '#ea580c', bg: '#fff7ed' },
    MEDIUM: { color: '#d97706', bg: '#fffbeb' },
    LOW: { color: '#059669', bg: '#ecfdf5' },
  };
  return badges[riskLevel] || badges.LOW;
}

/**
 * Severity Styles
 */
function getSeverityStyle(severity) {
  const styles = {
    CRITICAL: { borderColor: '#dc2626', textColor: '#dc2626' },
    HIGH: { borderColor: '#ea580c', textColor: '#ea580c' },
    MEDIUM: { borderColor: '#d97706', textColor: '#d97706' },
    LOW: { borderColor: '#059669', textColor: '#059669' },
  };
  return styles[severity] || styles.LOW;
}

/**
 * Destroy chart instance
 */
export function destroyChart(chart) {
  if (chart) {
    chart.destroy();
  }
}
