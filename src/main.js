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
import { predictLTV } from './core/ltvPrediction.js';
import {
  renderLTVBarChart,
  renderLTVTrendChart,
  renderLTVComparisonTable,
} from './visualization/ltvVisualization.js';
import {
  validateCSVFile,
  formatStatusHTML,
  formatValidationErrorsHTML,
  formatValidationWarningsHTML,
  extractDisplayStats,
} from './ui/helpers.js';
import { createAppLayout } from './ui/appLayout.js';

// ─── State ───

let charts = { heatmap: null, trend: null, risk: null, ltvBar: null, ltvTrend: null };
let analysisResults = { cohort: null, churn: null, ltv: null };
let churnRendered = false;
let ltvRendered = false;

// ─── Web Worker ───

const analysisWorker = new Worker(
  new URL('./core/analysisWorker.js', import.meta.url),
  { type: 'module' }
);

analysisWorker.onmessage = (e) => {
  const { type, payload, error } = e.data;
  if (type === 'SUCCESS') {
    handleAnalysisSuccess(payload.cohortResult, payload.churnResult, payload.ltvResult);
  } else if (type === 'ERROR') {
    showStatus(`분석 중 오류가 발생했습니다: ${error}`, 'error');
  }
};

analysisWorker.onerror = () => {
  showStatus('분석 워커에서 심각한 오류가 발생했습니다.', 'error');
};

// ─── UI ───

document.querySelector('#app').innerHTML = createAppLayout();

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

  if (tabName === 'ltv' && !ltvRendered && analysisResults.ltv) {
    requestAnimationFrame(() => {
      renderLTVVisuals();
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

function renderLTVVisuals() {
  const ltvResult = analysisResults.ltv;
  if (!ltvResult) return;

  if (charts.ltvBar) destroyChart(charts.ltvBar);
  if (charts.ltvTrend) destroyChart(charts.ltvTrend);

  charts.ltvBar = renderLTVBarChart(
    document.getElementById('ltvBarChart'),
    ltvResult.cohortLTVs
  );

  charts.ltvTrend = renderLTVTrendChart(
    document.getElementById('ltvTrendChart'),
    ltvResult.cohortLTVs
  );

  document.getElementById('ltvTableContainer').innerHTML =
    renderLTVComparisonTable(ltvResult.cohortLTVs, ltvResult.summary);

  ltvRendered = true;
}

// LTV Recalculate
document.getElementById('recalcLTV').addEventListener('click', () => {
  if (!analysisResults.cohort) return;

  const arpu = parseFloat(document.getElementById('arpuInput').value) || 1;
  analysisResults.ltv = predictLTV(
    analysisResults.cohort.retentionMatrix,
    { arpu }
  );
  ltvRendered = false;
  renderLTVVisuals();
});

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

function handleAnalysisSuccess(cohortResult, churnResult, ltvResult) {
  try {
    analysisResults.cohort = cohortResult;
    analysisResults.churn = churnResult;
    analysisResults.ltv = ltvResult;
    churnRendered = false;
    ltvRendered = false;

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
    destroyChart(charts.ltvBar);
    destroyChart(charts.ltvTrend);

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
      analysisResults.churn,
      analysisResults.ltv
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
