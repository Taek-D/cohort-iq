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
import {
  validateCSVFile,
  formatStatusHTML,
  formatValidationErrorsHTML,
  formatValidationWarningsHTML,
  extractDisplayStats,
} from './ui/helpers.js';

// ─── State ───

let charts = { heatmap: null, trend: null, risk: null };
let analysisResults = { cohort: null, churn: null };
let churnRendered = false;

// ─── Web Worker ───

const analysisWorker = new Worker(
  new URL('./core/analysisWorker.js', import.meta.url),
  { type: 'module' }
);

analysisWorker.onmessage = (e) => {
  const { type, payload, error } = e.data;
  if (type === 'SUCCESS') {
    handleAnalysisSuccess(payload.cohortResult, payload.churnResult);
  } else if (type === 'ERROR') {
    showStatus(`분석 중 오류가 발생했습니다: ${error}`, 'error');
  }
};

analysisWorker.onerror = () => {
  showStatus('분석 워커에서 심각한 오류가 발생했습니다.', 'error');
};

// ─── UI ───

document.querySelector('#app').innerHTML = `
  <header class="topbar">
    <div class="topbar-left">
      <h1 class="logo">CohortIQ</h1>
      <span class="version-badge">v1.1</span>
    </div>
    <a href="https://github.com/Taek-D/cohort-iq" target="_blank" rel="noopener" class="topbar-link">
      <svg viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
      </svg>
      Source
    </a>
  </header>

  <main class="content">
    <!-- Upload -->
    <div class="upload-card">
      <div class="drop-zone" id="dropZone">
        <input type="file" id="csvUpload" accept=".csv" class="sr-only" />
        <div class="drop-zone-inner">
          <label for="csvUpload" class="upload-left">
            <svg class="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span class="upload-text"><strong>Upload CSV</strong> or drag and drop</span>
          </label>
          <div class="upload-right">
            <span class="upload-cols">user_id · signup_date · event_date</span>
            <button type="button" id="loadSample" class="sample-btn">Try sample</button>
          </div>
        </div>
      </div>
      <div id="uploadStatus"></div>
    </div>

    <!-- Results -->
    <div id="resultsArea" class="results hidden">

      <!-- Stats -->
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-val" id="statCohorts">&mdash;</span>
          <span class="stat-lbl">cohorts</span>
        </div>
        <span class="stat-sep">&middot;</span>
        <div class="stat-item">
          <span class="stat-val" id="statUsers">&mdash;</span>
          <span class="stat-lbl">users</span>
        </div>
        <span class="stat-sep">&middot;</span>
        <div class="stat-item">
          <span class="stat-val" id="statDataPoints">&mdash;</span>
          <span class="stat-lbl">data points</span>
        </div>
        <span class="stat-sep">&middot;</span>
        <div class="stat-item">
          <span class="stat-val stat-accent" id="statDuration">&mdash;</span>
          <span class="stat-lbl">processed</span>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tab-bar">
        <button class="tab-btn active" data-tab="retention">Retention</button>
        <button class="tab-btn" data-tab="churn">Churn Risk</button>
      </div>

      <!-- Retention Panel -->
      <div class="tab-panel active" id="panel-retention">
        <div class="panel-grid">
          <div class="panel-card">
            <div class="panel-header">
              <h3 class="panel-title">Retention Heatmap</h3>
            </div>
            <div class="chart-area" style="height: 380px;">
              <canvas id="heatmapChart"></canvas>
            </div>
          </div>
          <div class="panel-card">
            <div class="panel-header">
              <h3 class="panel-title">Cohort Trend</h3>
            </div>
            <div class="chart-area" style="height: 380px;">
              <canvas id="trendChart"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Churn Panel -->
      <div class="tab-panel" id="panel-churn">
        <div class="churn-top">
          <div class="panel-card">
            <div class="panel-header">
              <h3 class="panel-title">Risk Segments</h3>
            </div>
            <div class="chart-area" style="height: 260px;">
              <canvas id="riskChart"></canvas>
            </div>
          </div>
          <div class="panel-card">
            <div class="panel-header">
              <h3 class="panel-title">Insights</h3>
            </div>
            <div id="insightsContainer" class="insights-wrap"></div>
          </div>
        </div>
        <div class="panel-card">
          <div class="panel-header">
            <h3 class="panel-title">High-Risk Users</h3>
            <button id="generateReportBtn" class="btn-outline">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Export PDF
            </button>
          </div>
          <div id="riskTableContainer"></div>
        </div>
      </div>

    </div>
  </main>
`;

// Global Error Handler
window.onerror = function (message) {
  showStatus(`시스템 오류 발생: ${message}`, 'error');
  return false;
};

// ─── DOM ───

const dropZone = document.getElementById('dropZone');
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
  if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files.length) handleFile(e.target.files[0]);
});

loadSampleBtn.addEventListener('click', () => {
  loadSampleData();
});

// Tab switching
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => switchToTab(btn.dataset.tab));
});

// ─── Tabs ───

function switchToTab(tabName) {
  document
    .querySelectorAll('.tab-btn')
    .forEach((t) => t.classList.toggle('active', t.dataset.tab === tabName));
  document
    .querySelectorAll('.tab-panel')
    .forEach((p) =>
      p.classList.toggle('active', p.id === `panel-${tabName}`)
    );

  if (tabName === 'churn' && !churnRendered && analysisResults.churn) {
    requestAnimationFrame(() => {
      renderChurnVisuals();
    });
  }
}

function renderChurnVisuals() {
  const churnResult = analysisResults.churn;
  if (!churnResult) return;

  if (charts.risk) destroyChart(charts.risk);
  charts.risk = renderRiskSegmentChart(
    document.getElementById('riskChart'),
    churnResult.riskSegments
  );

  document.getElementById('insightsContainer').innerHTML =
    renderInsightsCards(churnResult.insights);

  document.getElementById('riskTableContainer').innerHTML =
    renderRiskUsersTable(churnResult.churnRiskData);

  churnRendered = true;
}

// ─── File Processing ───

function handleFile(file) {
  const check = validateCSVFile(file);
  if (!check.valid) {
    showStatus(check.error, 'error');
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
        `데이터 검증 완료 — 유효: ${validation.stats.valid.toLocaleString()}행${uniqueUsers}`,
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
  showStatus('분석 중...', 'loading');
  analysisWorker.postMessage({ type: 'ANALYZE', data: validatedData });
}

function handleAnalysisSuccess(cohortResult, churnResult) {
  try {
    analysisResults.cohort = cohortResult;
    analysisResults.churn = churnResult;
    churnRendered = false;

    // Show results
    const resultsArea = document.getElementById('resultsArea');
    resultsArea.classList.remove('hidden');

    // Reset to retention tab
    switchToTab('retention');

    // Update stats
    const stats = extractDisplayStats(cohortResult, churnResult);
    document.getElementById('statCohorts').textContent = stats.cohorts;
    document.getElementById('statUsers').textContent = stats.users;
    document.getElementById('statDataPoints').textContent = stats.dataPoints;
    document.getElementById('statDuration').textContent = stats.duration;

    // Destroy existing charts
    destroyChart(charts.heatmap);
    destroyChart(charts.trend);
    destroyChart(charts.risk);

    // Render retention charts (visible tab)
    charts.heatmap = renderRetentionHeatmap(
      document.getElementById('heatmapChart'),
      cohortResult.heatmapData
    );
    charts.trend = renderRetentionTrend(
      document.getElementById('trendChart'),
      cohortResult.retentionMatrix
    );

    // Setup report button
    const reportBtn = document.getElementById('generateReportBtn');
    const newBtn = reportBtn.cloneNode(true);
    reportBtn.parentNode.replaceChild(newBtn, reportBtn);
    newBtn.addEventListener('click', () => generateAndShowReport());

    showStatus('분석 완료', 'success');

    setTimeout(() => {
      resultsArea.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  } catch (error) {
    showStatus(`렌더링 오류: ${error.message}`, 'error');
  }
}

// ─── Report ───

async function generateAndShowReport() {
  if (!analysisResults.cohort || !analysisResults.churn) {
    showStatus('분석 결과가 없습니다.', 'error');
    return;
  }

  const btn = document.getElementById('generateReportBtn');
  const originalHTML = btn.innerHTML;
  btn.textContent = 'Generating...';
  btn.disabled = true;

  try {
    const summaryData = prepareSummaryData(
      analysisResults.cohort,
      analysisResults.churn
    );
    const htmlContent = generateSummaryHTML(summaryData);
    showPDFPreview(htmlContent);
  } catch (error) {
    showStatus('리포트 생성 오류: ' + error.message, 'error');
  } finally {
    btn.innerHTML = originalHTML;
    btn.disabled = false;
  }
}

// ─── Status ───

function showStatus(message, type = 'info') {
  const statusDiv = document.getElementById('uploadStatus');
  statusDiv.innerHTML = formatStatusHTML(message, type);
}

function renderValidationErrors(container, errors) {
  container.insertAdjacentHTML('beforeend', formatValidationErrorsHTML(errors));
}

function renderValidationWarnings(container, warnings) {
  container.insertAdjacentHTML(
    'beforeend',
    formatValidationWarningsHTML(warnings)
  );
}
