// heatmapRenderer.js - Chart.js 히트맵 시각화 (Light Theme)
import { Chart } from 'chart.js/auto';
import { MatrixController, MatrixElement } from 'chartjs-chart-matrix';

Chart.register(MatrixController, MatrixElement);

// Light theme defaults
Chart.defaults.color = '#475569';
Chart.defaults.borderColor = '#e2e8f0';

// Tooltip style (shared)
const tooltip = {
  backgroundColor: '#1e293b',
  titleColor: '#f8fafc',
  bodyColor: '#cbd5e1',
  borderColor: '#334155',
  borderWidth: 1,
  cornerRadius: 6,
  padding: 10,
  titleFont: { family: "'JetBrains Mono', monospace", size: 11 },
  bodyFont: { family: "'Pretendard', sans-serif", size: 12 },
};

/**
 * 리텐션 히트맵 렌더링
 * @param {HTMLCanvasElement} canvas
 * @param {Object} heatmapData
 * @returns {Chart}
 */
export function renderRetentionHeatmap(canvas, heatmapData) {
  const ctx = canvas.getContext('2d');

  const getColor = (value) => {
    if (value >= 80) return 'rgba(13, 148, 136, 0.85)'; // Teal
    if (value >= 60) return 'rgba(22, 163, 74, 0.75)'; // Green
    if (value >= 40) return 'rgba(217, 119, 6, 0.7)'; // Amber
    if (value >= 20) return 'rgba(234, 88, 12, 0.7)'; // Orange
    return 'rgba(220, 38, 38, 0.65)'; // Red
  };

  const chart = new Chart(ctx, {
    type: 'matrix',
    data: {
      datasets: [
        {
          label: '리텐션율 (%)',
          data: heatmapData.data,
          backgroundColor: (context) => {
            const value = context.raw?.v || 0;
            return getColor(value);
          },
          borderColor: 'rgba(255, 255, 255, 0.6)',
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
              return `${heatmapData.cohortList[data.y]} — Week ${data.x}`;
            },
            label: (context) => {
              const data = context.raw;
              return [
                `Retention: ${data.v.toFixed(1)}%`,
                `Active: ${data.users} / ${data.total}`,
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
            text: 'Week',
            color: '#64748b',
            font: {
              family: "'JetBrains Mono', monospace",
              size: 11,
              weight: '600',
            },
          },
          ticks: {
            stepSize: 1,
            callback: (value) => `W${value}`,
            color: '#64748b',
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
            text: 'Cohort',
            color: '#64748b',
            font: {
              family: "'JetBrains Mono', monospace",
              size: 11,
              weight: '600',
            },
          },
          ticks: {
            stepSize: 1,
            callback: (value) => {
              const date = heatmapData.cohortList[value];
              return date ? date.substring(5) : '';
            },
            color: '#64748b',
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
 * 리텐션 트렌드 라인 차트
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

  // Saturated but readable colors on white background
  const colors = [
    '#0d9488', // Teal
    '#6366f1', // Indigo
    '#d97706', // Amber
    '#dc2626', // Red
    '#8b5cf6', // Violet
    '#ea580c', // Orange
    '#0891b2', // Cyan
    '#db2777', // Pink
    '#2563eb', // Blue
    '#65a30d', // Lime
    '#9333ea', // Purple
    '#0284c7', // Sky
  ];

  const datasets = Array.from(cohortMap.entries()).map(
    ([cohort, data], index) => ({
      label: cohort,
      data: data.map((d) => ({ x: d.week, y: d.retention })),
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length] + '14',
      borderWidth: 2,
      tension: 0.35,
      fill: false,
      pointRadius: 3,
      pointHoverRadius: 5,
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
            color: '#475569',
            boxWidth: 10,
            boxHeight: 10,
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
            text: 'Week',
            color: '#64748b',
            font: {
              family: "'JetBrains Mono', monospace",
              size: 11,
              weight: '600',
            },
          },
          ticks: {
            stepSize: 1,
            callback: (value) => `W${value}`,
            color: '#64748b',
            font: {
              family: "'JetBrains Mono', monospace",
              size: 10,
            },
          },
          grid: {
            color: '#f1f5f9',
          },
        },
        y: {
          title: {
            display: true,
            text: 'Retention %',
            color: '#64748b',
            font: {
              family: "'JetBrains Mono', monospace",
              size: 11,
              weight: '600',
            },
          },
          beginAtZero: true,
          max: 100,
          ticks: {
            color: '#64748b',
            font: {
              family: "'JetBrains Mono', monospace",
              size: 10,
            },
          },
          grid: {
            color: '#f1f5f9',
          },
        },
      },
    },
  });

  return chart;
}
