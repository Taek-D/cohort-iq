import './style.css';
import Papa from 'papaparse';
import {
  validateCohortData,
  validateFileSize,
} from './core/dataValidator.js';
import {
  renderRetentionHeatmap,
  renderRetentionTrend,
} from './visualization/heatmapRenderer.js';
import {
  renderRiskSegmentChart,
  renderRiskUsersTable,
  renderInsightsCards,
  destroyChart,
} from './visualization/churnVisualization.js';
import {
  prepareSummaryData,
  generateSummaryHTML,
} from './export/summaryGenerator.js';
import { showPDFPreview } from './export/pdfExporter.js';

// 전역 차트 변수
let charts = {
  heatmap: null,
  trend: null,
  risk: null,
};

// 분석 결과 저장소
let analysisResults = {
  cohort: null,
  churn: null,
};

// Web Worker 초기화
const analysisWorker = new Worker(
  new URL('./core/analysisWorker.js', import.meta.url),
  { type: 'module' }
);

analysisWorker.onmessage = (e) => {
  const { type, payload, error } = e.data;

  if (type === 'SUCCESS') {
    const { cohortResult, churnResult } = payload;
    handleAnalysisSuccess(cohortResult, churnResult);
  } else if (type === 'ERROR') {
    showStatus(`분석 중 오류가 발생했습니다: ${error}`, 'error');
  }
};

analysisWorker.onerror = () => {
  showStatus('분석 워커에서 심각한 오류가 발생했습니다.', 'error');
};

// ─── UI 템플릿 ───

document.querySelector('#app').innerHTML = `
  <div class="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">

      <!-- Header -->
      <header class="flex items-center justify-between mb-10 anim-fade">
        <div>
          <h1 class="text-3xl font-bold tracking-tight" style="font-family: var(--font-display)">
            <span class="gradient-text">CohortIQ</span>
          </h1>
          <p class="text-xs mt-1" style="color: var(--text-label); font-family: var(--font-mono); letter-spacing: 0.04em;">
            Cohort Retention & Churn Analysis
          </p>
        </div>
        <a href="https://github.com/Taek-D/cohort-iq" target="_blank" rel="noopener" class="btn-ghost">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          GitHub
        </a>
      </header>

      <!-- Upload Section -->
      <section class="card p-7 mb-8 anim-fade-up delay-1">
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-base font-semibold" style="color: var(--text-primary)">데이터 업로드</h2>
          <span class="section-label" style="background: var(--bg-inset); padding: 0.2rem 0.6rem; border-radius: 6px;">.csv</span>
        </div>

        <div class="drop-zone p-8 text-center">
          <input type="file" id="csvUpload" accept=".csv" class="hidden" />
          <label for="csvUpload" class="cursor-pointer flex flex-col items-center">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style="background: var(--accent-light); color: var(--accent-dim);">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <span class="text-sm font-medium" style="color: var(--text-primary)">CSV 파일을 드래그하거나 클릭하여 업로드</span>
            <span class="text-xs mt-1.5" style="color: var(--text-label); font-family: var(--font-mono);">user_id &middot; signup_date &middot; event_date</span>
          </label>
        </div>

        <div class="flex justify-center mt-4">
          <button id="loadSample" class="btn-ghost">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
            샘플 데이터로 체험
          </button>
        </div>

        <div id="uploadStatus" class="mt-4"></div>
      </section>

      <!-- Results Area -->
      <div id="resultsArea" class="hidden">

        <!-- Stats Row -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div class="card stat-card p-4 anim-fade-up delay-1">
            <p class="section-label mb-1.5">Cohorts</p>
            <p id="statCohorts" class="text-2xl font-bold" style="font-family: var(--font-mono); color: var(--text-primary);">-</p>
          </div>
          <div class="card stat-card p-4 anim-fade-up delay-2">
            <p class="section-label mb-1.5">Users</p>
            <p id="statUsers" class="text-2xl font-bold" style="font-family: var(--font-mono); color: var(--text-primary);">-</p>
          </div>
          <div class="card stat-card p-4 anim-fade-up delay-3">
            <p class="section-label mb-1.5">Data Points</p>
            <p id="statDataPoints" class="text-2xl font-bold" style="font-family: var(--font-mono); color: var(--text-primary);">-</p>
          </div>
          <div class="card stat-card p-4 anim-fade-up delay-4">
            <p class="section-label mb-1.5">Speed</p>
            <p id="statDuration" class="text-2xl font-bold" style="font-family: var(--font-mono); color: var(--accent);">-</p>
          </div>
        </div>

        <!-- Charts Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div class="card p-5 anim-fade-up delay-2">
            <p class="section-label mb-4">Retention Heatmap</p>
            <div class="relative h-[380px]">
              <canvas id="heatmapChart"></canvas>
            </div>
          </div>
          <div class="card p-5 anim-fade-up delay-3">
            <p class="section-label mb-4">Retention Trend</p>
            <div class="relative h-[380px]">
              <canvas id="trendChart"></canvas>
            </div>
          </div>
        </div>

        <!-- Churn Risk Section -->
        <div class="card p-5 mb-6 anim-fade-up delay-4">
          <div class="flex items-center justify-between mb-5">
            <p class="section-label">Churn Risk Analysis</p>
            <button id="generateReportBtn" class="btn-primary">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              PDF Report
            </button>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <!-- Risk Chart -->
            <div class="lg:col-span-1">
              <div class="relative h-[260px]">
                <canvas id="riskChart"></canvas>
              </div>
            </div>
            <!-- Insights -->
            <div class="lg:col-span-2">
              <p class="section-label mb-3">Insights & Actions</p>
              <div id="insightsContainer" class="space-y-2.5"></div>
            </div>
          </div>

          <!-- Risk Users Table -->
          <div class="mt-6 pt-5" style="border-top: 1px solid var(--border);">
            <p class="section-label mb-3">High-Risk Users (Top 20)</p>
            <div id="riskTableContainer" class="overflow-hidden rounded-lg" style="border: 1px solid var(--border);"></div>
          </div>
        </div>

      </div>
    </div>
  </div>
`;

// Global Error Handler
window.onerror = function (message) {
  showStatus(`시스템 오류 발생: ${message}`, 'error');
  return false;
};

// ─── DOM Elements ───

const dropZone =
  document.querySelector('label[for="csvUpload"]').parentElement;
const fileInput = document.getElementById('csvUpload');
const loadSampleBtn = document.getElementById('loadSample');

// ─── Event Listeners ───

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-active');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drag-active');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-active');
  const files = e.dataTransfer.files;
  if (files.length) handleFile(files[0]);
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files.length) handleFile(e.target.files[0]);
});

loadSampleBtn.addEventListener('click', () => {
  loadSampleData();
});

// ─── File Processing ───

function handleFile(file) {
  if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
    showStatus('CSV 파일만 업로드 가능합니다.', 'error');
    return;
  }

  showStatus('파일 읽는 중...', 'loading');

  const reader = new FileReader();
  reader.onload = (e) => processCSV(e.target.result);
  reader.onerror = () => showStatus('파일 읽기 실패', 'error');
  reader.readAsText(file);
}

async function loadSampleData() {
  try {
    showStatus('샘플 데이터 로딩 중...', 'loading');
    const response = await fetch('/sample_cohort_data.csv');
    if (!response.ok) throw new Error('샘플 데이터를 불러올 수 없습니다.');
    const csvText = await response.text();
    processCSV(csvText);
  } catch (error) {
    showStatus(`오류: ${error.message}`, 'error');
  }
}

function processCSV(csvText) {
  Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      const sizeCheck = validateFileSize(results.data.length);
      const validation = validateCohortData(results.data);

      if (!sizeCheck.valid) {
        showStatus(sizeCheck.error, 'error');
        return;
      }

      const statusDiv = document.getElementById('uploadStatus');
      let hasError = false;

      if (validation.errors.length > 0) {
        renderValidationErrors(statusDiv, validation.errors);
        hasError = true;
      }

      if (validation.warnings && validation.warnings.length > 0) {
        renderValidationWarnings(statusDiv, validation.warnings);
      }

      if (!validation.valid || validation.data.length === 0) {
        if (validation.errors.length === 0 && !hasError) {
          showStatus(
            '유효한 데이터가 없습니다. CSV 파일을 확인해주세요.',
            'error'
          );
        }
        return;
      }

      const uniqueUsers = validation.stats?.uniqueUsers
        ? ` (사용자: ${validation.stats.uniqueUsers}명)`
        : '';
      showStatus(
        `데이터 검증 완료! (유효: ${validation.stats.valid.toLocaleString()}행${uniqueUsers})`,
        'success'
      );

      setTimeout(() => analyzeAndVisualize(validation.data), 100);
    },
    error: (error) => {
      showStatus(`CSV 파싱 오류: ${error.message}`, 'error');
    },
  });
}

// ─── Analysis ───

function analyzeAndVisualize(validatedData) {
  showStatus(
    '데이터 분석 중... (대용량 데이터도 끊김 없이 처리됩니다)',
    'loading'
  );

  analysisWorker.postMessage({
    type: 'ANALYZE',
    data: validatedData,
  });
}

function handleAnalysisSuccess(cohortResult, churnResult) {
  try {
    analysisResults.cohort = cohortResult;
    analysisResults.churn = churnResult;

    const resultsArea = document.getElementById('resultsArea');
    resultsArea.classList.remove('hidden');

    // Re-trigger animations by cloning
    resultsArea.querySelectorAll('.anim-fade-up').forEach((el) => {
      el.style.animation = 'none';
      void el.offsetHeight;
      el.style.animation = '';
    });

    updateStats(cohortResult);
    document.getElementById('statUsers').textContent =
      churnResult.performance.usersAnalyzed.toLocaleString();

    destroyCharts();

    const heatmapCanvas = document.getElementById('heatmapChart');
    charts.heatmap = renderRetentionHeatmap(
      heatmapCanvas,
      cohortResult.heatmapData
    );

    const trendCanvas = document.getElementById('trendChart');
    charts.trend = renderRetentionTrend(
      trendCanvas,
      cohortResult.retentionMatrix
    );

    const riskCanvas = document.getElementById('riskChart');
    charts.risk = renderRiskSegmentChart(riskCanvas, churnResult.riskSegments);

    const insightsContainer = document.getElementById('insightsContainer');
    insightsContainer.innerHTML = renderInsightsCards(churnResult.insights);

    const riskTableContainer = document.getElementById('riskTableContainer');
    riskTableContainer.innerHTML = renderRiskUsersTable(
      churnResult.churnRiskData
    );

    const reportBtn = document.getElementById('generateReportBtn');
    const newBtn = reportBtn.cloneNode(true);
    reportBtn.parentNode.replaceChild(newBtn, reportBtn);

    newBtn.addEventListener('click', () => {
      generateAndShowReport();
    });

    showStatus(
      '모든 분석이 성공적으로 완료되었습니다. 아래에서 상세 내용을 확인하세요.',
      'success'
    );

    setTimeout(() => {
      document
        .getElementById('resultsArea')
        .scrollIntoView({ behavior: 'smooth' });
    }, 100);
  } catch (error) {
    showStatus(
      `결과 렌더링 중 오류가 발생했습니다: ${error.message}`,
      'error'
    );
  }
}

function updateStats(result) {
  document.getElementById('statCohorts').textContent =
    result.cohorts.length.toLocaleString();
  document.getElementById('statDataPoints').textContent =
    result.retentionMatrix.length.toLocaleString();
  document.getElementById('statDuration').textContent = `${Math.round(
    result.performance.duration
  )}ms`;
}

function destroyCharts() {
  destroyChart(charts.heatmap);
  destroyChart(charts.trend);
  destroyChart(charts.risk);
}

// ─── Report ───

async function generateAndShowReport() {
  if (!analysisResults.cohort || !analysisResults.churn) {
    showStatus(
      '분석 결과가 없습니다. 먼저 데이터를 업로드해주세요.',
      'error'
    );
    return;
  }

  const btn = document.getElementById('generateReportBtn');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<span style="color: var(--text-secondary)">생성 중...</span>';
  btn.disabled = true;

  try {
    const summaryData = prepareSummaryData(
      analysisResults.cohort,
      analysisResults.churn
    );
    const htmlContent = generateSummaryHTML(summaryData);
    showPDFPreview(htmlContent);
  } catch (error) {
    showStatus(
      '리포트 생성 중 오류가 발생했습니다: ' + error.message,
      'error'
    );
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// ─── Status Display ───

function showStatus(message, type = 'info') {
  const statusDiv = document.getElementById('uploadStatus');
  const styleClass = {
    info: 'status-info',
    success: 'status-success',
    error: 'status-error',
    loading: 'status-loading',
  };

  const spinner =
    type === 'loading'
      ? '<svg class="animate-spin h-4 w-4" style="color: var(--text-muted);" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>'
      : '';

  statusDiv.innerHTML = `
    <div class="status-msg ${styleClass[type]}">
      <span>${message}</span>
      ${spinner}
    </div>
  `;
}

function renderValidationErrors(container, errors) {
  const errorList = errors
    .slice(0, 3)
    .map((e) => `<li>${e}</li>`)
    .join('');
  const html = `
    <div class="status-msg status-error mt-3" style="flex-direction: column; align-items: flex-start; gap: 0.5rem;">
      <p class="font-semibold" style="font-size: 0.8125rem;">데이터 오류 (수정 필요)</p>
      <ul style="font-size: 0.75rem; list-style: disc; padding-left: 1.25rem; opacity: 0.85; display: flex; flex-direction: column; gap: 0.25rem;">
        ${errorList}
        ${errors.length > 3 ? `<li>... 외 ${errors.length - 3}건의 이슈</li>` : ''}
      </ul>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', html);
}

function renderValidationWarnings(container, warnings) {
  const warningList = warnings
    .slice(0, 3)
    .map((w) => `<li>${w}</li>`)
    .join('');
  const html = `
    <div class="status-msg mt-3" style="background: var(--amber-bg); color: var(--amber); border: 1px solid rgba(251,191,36,0.2); flex-direction: column; align-items: flex-start; gap: 0.5rem;">
      <p class="font-semibold" style="font-size: 0.8125rem;">데이터 경고 (확인 요망)</p>
      <ul style="font-size: 0.75rem; list-style: disc; padding-left: 1.25rem; opacity: 0.85; display: flex; flex-direction: column; gap: 0.25rem;">
        ${warningList}
        ${warnings.length > 3 ? `<li>... 외 ${warnings.length - 3}건의 이슈</li>` : ''}
      </ul>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', html);
}
