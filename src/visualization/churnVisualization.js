// churnVisualization.js - Churn 위험 시각화
import { Chart } from 'chart.js';

/**
 * 위험 세그먼트 파이 차트
 * @param {HTMLCanvasElement} canvas - 캔버스 엘리먼트
 * @param {Object} riskSegments - segmentByRisk 결과
 * @returns {Chart} Chart.js 인스턴스
 */
export function renderRiskSegmentChart(canvas, riskSegments) {
    const ctx = canvas.getContext('2d');
    const { summary } = riskSegments;

    const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Critical', 'High', 'Medium', 'Low'],
            datasets: [{
                data: [
                    summary.critical,
                    summary.high,
                    summary.medium,
                    summary.low
                ],
                backgroundColor: [
                    '#dc2626', // Red (Critical)
                    '#f59e0b', // Orange (High)
                    '#fbbf24', // Yellow (Medium)
                    '#10b981'  // Green (Low)
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Churn 위험 세그먼트 분포',
                    font: {
                        size: 18,
                        weight: 'bold'
                    }
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            size: 12
                        },
                        generateLabels: (chart) => {
                            const data = chart.data;
                            return data.labels.map((label, i) => {
                                const value = data.datasets[0].data[i];
                                const percentage = summary.total > 0
                                    ? Math.round((value / summary.total) * 100)
                                    : 0;
                                return {
                                    text: `${label}: ${value}명 (${percentage}%)`,
                                    fillStyle: data.datasets[0].backgroundColor[i],
                                    hidden: false,
                                    index: i
                                };
                            });
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const label = context.label || '';
                            const value = context.parsed;
                            const percentage = summary.total > 0
                                ? Math.round((value / summary.total) * 100)
                                : 0;
                            return `${label}: ${value}명 (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    return chart;
}

/**
 * 위험 사용자 목록 테이블 생성
 * @param {Array} churnRiskData - calculateChurnRisk 결과
 * @param {number} limit - 표시할 최대 사용자 수
 * @returns {string} HTML 테이블
 */
export function renderRiskUsersTable(churnRiskData, limit = 20) {
    const topRiskUsers = churnRiskData.slice(0, limit);

    const rows = topRiskUsers.map((user, index) => {
        const riskBadge = getRiskBadge(user.riskLevel);
        const lastActivity = user.metrics.weeksSinceLastActivity;
        const activityStatus = lastActivity >= 4 ? '🔴 장기 미활동'
            : lastActivity >= 2 ? '🟡 활동 감소'
                : '🟢 활성';

        return `
      <tr class="border-b hover:bg-gray-50">
        <td class="px-4 py-3 text-sm">${index + 1}</td>
        <td class="px-4 py-3 text-sm font-medium">${user.userId}</td>
        <td class="px-4 py-3 text-sm">${user.cohort}</td>
        <td class="px-4 py-3 text-center">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${riskBadge.class}">
            ${riskBadge.icon} ${user.riskLevel}
          </span>
        </td>
        <td class="px-4 py-3 text-center text-sm font-semibold">${user.riskScore}</td>
        <td class="px-4 py-3 text-sm">${activityStatus}</td>
        <td class="px-4 py-3 text-sm text-gray-600">
          ${user.metrics.weeksSinceLastActivity}주 전
        </td>
        <td class="px-4 py-3 text-sm text-gray-600">
          ${user.metrics.activityDensity}%
        </td>
      </tr>
    `;
    }).join('');

    return `
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용자 ID</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">코호트</th>
            <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">위험 레벨</th>
            <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">위험점수</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">마지막 활동</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">활동 밀도</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * 인사이트 카드 생성
 * @param {Array} insights - generateInsights 결과
 * @returns {string} HTML 인사이트 카드
 */
export function renderInsightsCards(insights) {
    const cards = insights.map(insight => {
        const severityStyle = getSeverityStyle(insight.severity);
        const typeIcon = getTypeIcon(insight.type);

        return `
      <div class="bg-white rounded-lg shadow-md p-6 border-l-4 ${severityStyle.borderClass}">
        <div class="flex items-start">
          <span class="text-2xl mr-3">${typeIcon}</span>
          <div class="flex-1">
            <h3 class="text-lg font-bold ${severityStyle.textClass} mb-2">
              ${insight.title}
            </h3>
            <p class="text-gray-700 mb-3">
              ${insight.description}
            </p>
            <div class="bg-gray-50 rounded p-3 mb-3">
              <p class="text-sm font-medium text-gray-800">
                💡 추천 조치:
              </p>
              <p class="text-sm text-gray-600 mt-1">
                ${insight.action}
              </p>
            </div>
            <p class="text-xs text-gray-500">
              영향받는 사용자: <span class="font-semibold">${insight.affectedUsers}명</span>
            </p>
          </div>
        </div>
      </div>
    `;
    }).join('');

    return cards || '<p class="text-gray-500 text-center py-8">인사이트가 생성되지 않았습니다.</p>';
}

/**
 * 위험 레벨 배지 스타일
 */
function getRiskBadge(riskLevel) {
    const badges = {
        CRITICAL: {
            icon: '🔴',
            class: 'bg-red-100 text-red-800'
        },
        HIGH: {
            icon: '🟠',
            class: 'bg-orange-100 text-orange-800'
        },
        MEDIUM: {
            icon: '🟡',
            class: 'bg-yellow-100 text-yellow-800'
        },
        LOW: {
            icon: '🟢',
            class: 'bg-green-100 text-green-800'
        }
    };

    return badges[riskLevel] || badges.LOW;
}

/**
 * 심각도 스타일
 */
function getSeverityStyle(severity) {
    const styles = {
        CRITICAL: {
            borderClass: 'border-red-500',
            textClass: 'text-red-700'
        },
        HIGH: {
            borderClass: 'border-orange-500',
            textClass: 'text-orange-700'
        },
        MEDIUM: {
            borderClass: 'border-yellow-500',
            textClass: 'text-yellow-700'
        },
        LOW: {
            borderClass: 'border-green-500',
            textClass: 'text-green-700'
        }
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
        INFO: 'ℹ️'
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
