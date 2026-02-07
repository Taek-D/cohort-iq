// heatmapRenderer.js - Chart.js 히트맵 시각화
import { Chart } from 'chart.js';
import { MatrixController, MatrixElement } from 'chartjs-chart-matrix';

// Chart.js에 Matrix 플러그인 등록
Chart.register(MatrixController, MatrixElement);

/**
 * 리텐션 히트맵 렌더링
 * @param {HTMLCanvasElement} canvas - 캔버스 엘리먼트
 * @param {Object} heatmapData - formatForHeatmap 결과
 * @returns {Chart} Chart.js 인스턴스
 */
export function renderRetentionHeatmap(canvas, heatmapData) {
    const ctx = canvas.getContext('2d');

    // 색상 매핑 함수
    const getColor = (value) => {
        if (value >= 75) return '#10b981'; // Green
        if (value >= 50) return '#f59e0b'; // Orange
        if (value >= 25) return '#ef4444'; // Red
        return '#9ca3af'; // Gray
    };

    // Chart.js 설정
    const chart = new Chart(ctx, {
        type: 'matrix',
        data: {
            datasets: [{
                label: '리텐션율 (%)',
                data: heatmapData.data,
                backgroundColor: (context) => {
                    const value = context.raw?.v || 0;
                    return getColor(value);
                },
                borderColor: '#ffffff',
                borderWidth: 2,
                width: ({ chart }) => {
                    const chartWidth = chart.chartArea?.width || 400;
                    return (chartWidth / (heatmapData.maxWeek + 1)) * 0.9;
                },
                height: ({ chart }) => {
                    const chartHeight = chart.chartArea?.height || 400;
                    return (chartHeight / heatmapData.cohortList.length) * 0.9;
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: '코호트 리텐션 히트맵',
                    font: {
                        size: 18,
                        weight: 'bold'
                    }
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        title: (context) => {
                            const data = context[0].raw;
                            return `${heatmapData.cohortList[data.y]} - Week ${data.x}`;
                        },
                        label: (context) => {
                            const data = context.raw;
                            return [
                                `리텐션: ${data.v.toFixed(1)}%`,
                                `활성 사용자: ${data.users}/${data.total}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Week',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        stepSize: 1,
                        callback: (value) => `W${value}`
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    type: 'category',
                    labels: heatmapData.cohortList,
                    title: {
                        display: true,
                        text: 'Cohort',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        callback: (value, index) => {
                            const date = heatmapData.cohortList[index];
                            return date ? date.substring(5) : value; // MM-DD 형식
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });

    return chart;
}

/**
 * 리텐션 트렌드 라인 차트
 * @param {HTMLCanvasElement} canvas - 캔버스 엘리먼트
 * @param {Array} retentionMatrix - calculateRetention 결과
 * @returns {Chart} Chart.js 인스턴스
 */
export function renderRetentionTrend(canvas, retentionMatrix) {
    const ctx = canvas.getContext('2d');

    // 코호트별 데이터 그룹화
    const cohortMap = new Map();
    retentionMatrix.forEach(item => {
        if (!cohortMap.has(item.cohort)) {
            cohortMap.set(item.cohort, []);
        }
        cohortMap.get(item.cohort).push({
            week: item.week,
            retention: item.retention
        });
    });

    // 색상 팔레트
    const colors = [
        '#3b82f6', // Blue
        '#10b981', // Green
        '#f59e0b', // Orange
        '#ef4444', // Red
        '#8b5cf6', // Purple
        '#ec4899'  // Pink
    ];

    // 데이터셋 생성
    const datasets = Array.from(cohortMap.entries()).map(([cohort, data], index) => ({
        label: cohort,
        data: data.map(d => ({ x: d.week, y: d.retention })),
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length] + '20', // 20% opacity
        borderWidth: 2,
        tension: 0.3,
        fill: false
    }));

    const chart = new Chart(ctx, {
        type: 'line',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: '코호트별 리텐션 트렌드',
                    font: {
                        size: 18,
                        weight: 'bold'
                    }
                },
                legend: {
                    display: true,
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Week',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        stepSize: 1,
                        callback: (value) => `W${value}`
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Retention Rate (%)',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });

    return chart;
}

/**
 * 기존 차트 파괴
 * @param {Chart} chart - Chart.js 인스턴스
 */
export function destroyChart(chart) {
    if (chart) {
        chart.destroy();
    }
}
