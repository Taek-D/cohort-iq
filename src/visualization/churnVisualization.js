// churnVisualization.js - Churn 위험 시각화 (Light Theme)
import { Chart } from 'chart.js/auto';

const tooltip = {
  backgroundColor: '#1e293b',
  titleColor: '#f8fafc',
  bodyColor: '#cbd5e1',
  borderColor: '#334155',
  borderWidth: 1,
  cornerRadius: 6,
  padding: 10,
  bodyFont: { family: "'Pretendard', sans-serif", size: 12 },
};

/**
 * 위험 세그먼트 도넛 차트
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
      labels: ['Critical', 'High', 'Medium', 'Low'],
      datasets: [
        {
          data: [summary.critical, summary.high, summary.medium, summary.low],
          backgroundColor: [
            'rgba(220, 38, 38, 0.8)',
            'rgba(234, 88, 12, 0.8)',
            'rgba(217, 119, 6, 0.7)',
            'rgba(22, 163, 74, 0.8)',
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
            color: '#475569',
            boxWidth: 10,
            boxHeight: 10,
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
                const percentage =
                  summary.total > 0
                    ? Math.round((value / summary.total) * 100)
                    : 0;
                return {
                  text: `${label} ${value} (${percentage}%)`,
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
              const percentage =
                summary.total > 0
                  ? Math.round((value / summary.total) * 100)
                  : 0;
              return `${label}: ${value}명 (${percentage}%)`;
            },
          },
        },
      },
    },
  });

  return chart;
}

/**
 * 위험 사용자 목록 테이블
 * @param {Array} churnRiskData
 * @param {number} limit
 * @returns {string}
 */
export function renderRiskUsersTable(churnRiskData, limit = 20) {
  const topRiskUsers = churnRiskData.slice(0, limit);

  const rows = topRiskUsers
    .map((user, index) => {
      const badge = getRiskBadge(user.riskLevel);
      const lastActivity = user.metrics.weeksSinceLastActivity;
      const statusDot =
        lastActivity >= 4
          ? '#dc2626'
          : lastActivity >= 2
            ? '#d97706'
            : '#16a34a';
      const statusText =
        lastActivity >= 4
          ? '장기 미활동'
          : lastActivity >= 2
            ? '활동 감소'
            : '활성';

      return `
      <tr>
        <td style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted);">${index + 1}</td>
        <td style="font-weight: 500; color: var(--text-primary);">${user.userId}</td>
        <td style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-secondary);">${user.cohort}</td>
        <td style="text-align: center;">
          <span class="risk-badge" style="background: ${badge.bg}; color: ${badge.color};">
            <span class="dot" style="background: ${badge.color};"></span>
            ${user.riskLevel}
          </span>
        </td>
        <td style="text-align: center; font-family: var(--font-mono); font-weight: 600; color: ${badge.color};">${user.riskScore}</td>
        <td>
          <span style="display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.8125rem; color: var(--text-secondary);">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: ${statusDot};"></span>
            ${statusText}
          </span>
        </td>
        <td style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-secondary);">${user.metrics.weeksSinceLastActivity}주 전</td>
        <td style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-secondary);">${user.metrics.activityDensity}%</td>
      </tr>
    `;
    })
    .join('');

  return `
    <div style="overflow-x: auto;">
      <table class="risk-table">
        <thead>
          <tr>
            <th>#</th>
            <th>사용자 ID</th>
            <th>코호트</th>
            <th style="text-align: center;">위험 레벨</th>
            <th style="text-align: center;">점수</th>
            <th>상태</th>
            <th>마지막 활동</th>
            <th>활동 밀도</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * 인사이트 카드
 * @param {Array} insights
 * @returns {string}
 */
export function renderInsightsCards(insights) {
  const cards = insights
    .map((insight) => {
      const severity = getSeverityStyle(insight.severity);
      const typeIcon = getTypeIcon(insight.type);

      return `
      <div class="insight-card" style="border-left: 3px solid ${severity.borderColor};">
        <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
          <span style="font-size: 1.25rem; line-height: 1; flex-shrink: 0; margin-top: 2px;">${typeIcon}</span>
          <div style="flex: 1; min-width: 0;">
            <h4 style="font-size: 0.875rem; font-weight: 600; color: ${severity.textColor}; margin-bottom: 0.35rem;">
              ${insight.title}
            </h4>
            <p style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: 0.5rem; line-height: 1.5;">
              ${insight.description}
            </p>
            <div style="background: var(--bg-elevated); border: 1px solid var(--border-light); border-radius: 6px; padding: 0.5rem 0.75rem; margin-bottom: 0.5rem;">
              <p style="font-size: 0.75rem; color: var(--text-label); margin-bottom: 0.15rem;">추천 조치</p>
              <p style="font-size: 0.8125rem; color: var(--text-primary);">${insight.action}</p>
            </div>
            <p style="font-size: 0.6875rem; color: var(--text-label); font-family: var(--font-mono);">
              영향: <span style="color: ${severity.textColor}; font-weight: 600;">${insight.affectedUsers}명</span>
            </p>
          </div>
        </div>
      </div>
    `;
    })
    .join('');

  return (
    cards ||
    '<p style="text-align: center; padding: 2rem 0; color: var(--text-muted); font-size: 0.8125rem;">인사이트가 생성되지 않았습니다.</p>'
  );
}

/**
 * 위험 레벨 배지 스타일
 */
function getRiskBadge(riskLevel) {
  const badges = {
    CRITICAL: {
      color: '#dc2626',
      bg: '#fef2f2',
    },
    HIGH: {
      color: '#ea580c',
      bg: '#fff7ed',
    },
    MEDIUM: {
      color: '#d97706',
      bg: '#fffbeb',
    },
    LOW: {
      color: '#16a34a',
      bg: '#f0fdf4',
    },
  };

  return badges[riskLevel] || badges.LOW;
}

/**
 * 심각도 스타일
 */
function getSeverityStyle(severity) {
  const styles = {
    CRITICAL: {
      borderColor: '#dc2626',
      textColor: '#dc2626',
    },
    HIGH: {
      borderColor: '#ea580c',
      textColor: '#ea580c',
    },
    MEDIUM: {
      borderColor: '#d97706',
      textColor: '#d97706',
    },
    LOW: {
      borderColor: '#16a34a',
      textColor: '#16a34a',
    },
  };

  return styles[severity] || styles.LOW;
}

/**
 * 인사이트 타입 아이콘
 */
function getTypeIcon(type) {
  const icons = {
    ALERT: '🚨',
    WARNING: '⚠️',
    SUCCESS: '✅',
    INFO: 'ℹ️',
  };

  return icons[type] || icons.INFO;
}

/**
 * 기존 차트 파괴
 */
export function destroyChart(chart) {
  if (chart) {
    chart.destroy();
  }
}
