// heatmapRenderer.js — Chart.js Retention Heatmap & Trend
import { Chart } from 'chart.js/auto';
import { MatrixController, MatrixElement } from 'chartjs-chart-matrix';
import { t } from '../i18n/index.js';

Chart.register(MatrixController, MatrixElement);

// Match design system
Chart.defaults.color = '#4b5563';
Chart.defaults.borderColor = '#e5e7eb';

// Tooltip (dark bg for contrast on light surface)
const tooltip = {
  backgroundColor: '#111827',
  titleColor: '#f9fafb',
  bodyColor: '#d1d5db',
  borderColor: '#374151',
  borderWidth: 1,
  cornerRadius: 4,
  padding: 8,
  titleFont: { family: "'JetBrains Mono', monospace", size: 11 },
  bodyFont: { family: "'Pretendard', sans-serif", size: 12 },
};

/**
 * Retention Heatmap — single-hue blue intensity (Mixpanel-style)
 * @param {HTMLCanvasElement} canvas
 * @param {Object} heatmapData
 * @returns {Chart}
 */
export function renderRetentionHeatmap(canvas, heatmapData) {
  const ctx = canvas.getContext('2d');

  // Single-hue blue scale — darker = higher retention
  const getColor = (value) => {
    if (value >= 80) return 'rgba(37, 99, 235, 0.85)';
    if (value >= 60) return 'rgba(37, 99, 235, 0.60)';
    if (value >= 40) return 'rgba(37, 99, 235, 0.40)';
    if (value >= 20) return 'rgba(37, 99, 235, 0.20)';
    return 'rgba(37, 99, 235, 0.06)';
  };

  const chart = new Chart(ctx, {
    type: 'matrix',
    data: {
      datasets: [
        {
          label: t('chart.retentionPct'),
          data: heatmapData.data,
          backgroundColor: (context) => {
            const value = context.raw?.v || 0;
            return getColor(value);
          },
          borderColor: 'rgba(255, 255, 255, 0.7)',
          borderWidth: 1,
          width: ({ chart }) => {
            const chartWidth = chart.chartArea?.width || 400;
            return (chartWidth / (heatmapData.maxWeek + 1)) * 0.88;
          },
          height: ({ chart }) => {
            const chartHeight = chart.chartArea?.height || 400;
            return (chartHeight / heatmapData.cohortList.length) * 0.88;
          },
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { display: false },
        legend: { display: false },
        tooltip: {
          ...tooltip,
          callbacks: {
            title: (context) => {
              const data = context[0].raw;
              return `${heatmapData.cohortList[data.y]} — ${t('chart.week')} ${data.x}`;
            },
            label: (context) => {
              const data = context.raw;
              return [
                `${t('chart.retention')}: ${data.v.toFixed(1)}%`,
                `${t('chart.active')}: ${data.users} / ${data.total}`,
              ];
            },
          },
        },
      },
      scales: {
        x: {
          type: 'linear',
          title: {
            display: true,
            text: t('chart.week'),
            color: '#6b7280',
            font: {
              family: "'JetBrains Mono', monospace",
              size: 11,
              weight: '500',
            },
          },
          ticks: {
            stepSize: 1,
            callback: (value) => `W${value}`,
            color: '#6b7280',
            font: {
              family: "'JetBrains Mono', monospace",
              size: 10,
            },
          },
          grid: { display: false },
        },
        y: {
          type: 'linear',
          reverse: true,
          min: -0.5,
          max: heatmapData.cohortList.length - 0.5,
          title: {
            display: true,
            text: t('chart.cohort'),
            color: '#6b7280',
            font: {
              family: "'JetBrains Mono', monospace",
              size: 11,
              weight: '500',
            },
          },
          ticks: {
            stepSize: 1,
            callback: (value) => {
              const date = heatmapData.cohortList[value];
              return date ? date.substring(5) : '';
            },
            color: '#6b7280',
            font: {
              family: "'JetBrains Mono', monospace",
              size: 10,
            },
          },
          grid: { display: false },
        },
      },
    },
  });

  return chart;
}

/**
 * Retention Trend — line chart per cohort
 * @param {HTMLCanvasElement} canvas
 * @param {Array} retentionMatrix
 * @returns {Chart}
 */
export function renderRetentionTrend(canvas, retentionMatrix) {
  const ctx = canvas.getContext('2d');

  const cohortMap = new Map();
  retentionMatrix.forEach((item) => {
    if (!cohortMap.has(item.cohort)) {
      cohortMap.set(item.cohort, []);
    }
    cohortMap.get(item.cohort).push({
      week: item.week,
      retention: item.retention,
    });
  });

  // Professional palette — distinct but not garish
  const colors = [
    '#2563eb', // Blue
    '#7c3aed', // Violet
    '#059669', // Emerald
    '#ea580c', // Orange
    '#db2777', // Pink
    '#d97706', // Amber
    '#0891b2', // Cyan
    '#dc2626', // Red
    '#4f46e5', // Indigo
    '#65a30d', // Lime
    '#8b5cf6', // Purple
    '#0d9488', // Teal
  ];

  const datasets = Array.from(cohortMap.entries()).map(
    ([cohort, data], index) => ({
      label: cohort,
      data: data.map((d) => ({ x: d.week, y: d.retention })),
      borderColor: colors[index % colors.length],
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      tension: 0.3,
      fill: false,
      pointRadius: 2.5,
      pointHoverRadius: 4,
      pointBackgroundColor: colors[index % colors.length],
      pointBorderColor: '#ffffff',
      pointBorderWidth: 1,
    })
  );

  const chart = new Chart(ctx, {
    type: 'line',
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { display: false },
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            color: '#4b5563',
            boxWidth: 8,
            boxHeight: 8,
            borderRadius: 2,
            padding: 12,
            font: {
              family: "'JetBrains Mono', monospace",
              size: 10,
            },
          },
        },
        tooltip: {
          ...tooltip,
          callbacks: {
            label: (context) => {
              return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
            },
          },
        },
      },
      scales: {
        x: {
          type: 'linear',
          title: {
            display: true,
            text: t('chart.week'),
            color: '#6b7280',
            font: {
              family: "'JetBrains Mono', monospace",
              size: 11,
              weight: '500',
            },
          },
          ticks: {
            stepSize: 1,
            callback: (value) => `W${value}`,
            color: '#6b7280',
            font: {
              family: "'JetBrains Mono', monospace",
              size: 10,
            },
          },
          grid: { color: '#f3f4f6' },
        },
        y: {
          title: {
            display: true,
            text: t('chart.retentionPct'),
            color: '#6b7280',
            font: {
              family: "'JetBrains Mono', monospace",
              size: 11,
              weight: '500',
            },
          },
          beginAtZero: true,
          max: 100,
          ticks: {
            color: '#6b7280',
            font: {
              family: "'JetBrains Mono', monospace",
              size: 10,
            },
          },
          grid: { color: '#f3f4f6' },
        },
      },
    },
  });

  return chart;
}
