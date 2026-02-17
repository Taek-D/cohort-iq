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
  renderSurvivalCurve,
  renderStatisticsCards,
} from './visualization/statisticsRenderer.js';
import { runABTestSimulation } from './core/abTestSimulation.js';
import {
  renderRetentionComparison,
  renderPowerCurve,
  renderResultCards,
  renderScenarioTable,
} from './visualization/abTestRenderer.js';
import {
  validateCSVFile,
  formatStatusHTML,
  formatValidationErrorsHTML,
  formatValidationWarningsHTML,
  extractDisplayStats,
} from './ui/helpers.js';
import { createAppLayout } from './ui/appLayout.js';
import { t, setLocale, getLocale } from './i18n/index.js';

// ─── State ───

let charts = { heatmap: null, trend: null, risk: null, ltvBar: null, ltvTrend: null, survival: null, abtestRetention: null, abtestPower: null };
let analysisResults = { cohort: null, churn: null, ltv: null, stats: null, abtest: null };
let churnRendered = false;
let ltvRendered = false;
let statsRendered = false;
let abtestPopulated = false;

// ─── Web Worker ───

const analysisWorker = new Worker(
  new URL('./core/analysisWorker.js', import.meta.url),
  { type: 'module' }
);

function syncWorkerLocale() {
  analysisWorker.postMessage({
    type: 'SET_LOCALE',
    data: { locale: getLocale() },
  });
}

syncWorkerLocale();

analysisWorker.onmessage = (e) => {
  const { type, payload, error } = e.data;
  if (type === 'SUCCESS') {
    handleAnalysisSuccess(payload.cohortResult, payload.churnResult, payload.ltvResult, payload.statsResult);
  } else if (type === 'ERROR') {
    showStatus(t('status.analysisError', { error }), 'error');
  }
};

analysisWorker.onerror = () => {
  showStatus(t('status.workerError'), 'error');
};

// ─── UI ───

function initUI() {
  document.querySelector('#app').innerHTML = createAppLayout();
  bindEventListeners();
}

initUI();

// Global Error Handler
window.onerror = function (message) {
  showStatus(t('status.systemError', { message }), 'error');
  return false;
};

// ─── Locale Change ───

window.addEventListener('locale-change', () => {
  syncWorkerLocale();
  const hadResults = !document.getElementById('resultsArea')?.classList.contains('hidden');
  initUI();

  if (hadResults && analysisResults.cohort) {
    const resultsArea = document.getElementById('resultsArea');
    resultsArea.classList.remove('hidden');

    const stats = extractDisplayStats(analysisResults.cohort, analysisResults.churn);
    document.getElementById('statCohorts').textContent = stats.cohorts;
    document.getElementById('statUsers').textContent = stats.users;
    document.getElementById('statDataPoints').textContent = stats.dataPoints;
    document.getElementById('statDuration').textContent = stats.duration;

    churnRendered = false;
    ltvRendered = false;
    statsRendered = false;
    abtestPopulated = false;

    charts.heatmap = renderRetentionHeatmap(
      document.getElementById('heatmapChart'),
      analysisResults.cohort.heatmapData
    );
    charts.trend = renderRetentionTrend(
      document.getElementById('trendChart'),
      analysisResults.cohort.retentionMatrix
    );

    renderStatsVisuals();

    const reportBtn = document.getElementById('generateReportBtn');
    reportBtn.addEventListener('click', () => generateAndShowReport());

    showStatus(t('status.analysisComplete'), 'success');
  }
});

// ─── Event Binding ───

function bindEventListeners() {
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('csvUpload');
  const loadSampleBtn = document.getElementById('loadSample');

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

  // Language toggle
  document.getElementById('langToggle').addEventListener('click', (e) => {
    const lang = e.target.dataset?.lang;
    if (lang) setLocale(lang);
  });

  // A/B Test
  document.getElementById('runABTest').addEventListener('click', runABTestHandler);
  document.getElementById('abtestDeltaSlider').addEventListener('input', (e) => {
    document.getElementById('abtestDeltaValue').textContent = `+${e.target.value}%p`;
  });

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
}

// ─── Tabs ───

function switchToTab(tabName) {
  document
    .querySelectorAll('.tab-btn')
    .forEach((tb) => tb.classList.toggle('active', tb.dataset.tab === tabName));
  document
    .querySelectorAll('.tab-panel')
    .forEach((p) =>
      p.classList.toggle('active', p.id === `panel-${tabName}`)
    );

  if (tabName === 'churn' && analysisResults.churn) {
    requestAnimationFrame(() => {
      if (!churnRendered) renderChurnVisuals();
      if (!statsRendered && analysisResults.stats) renderStatsOnChurnTab();
    });
  }

  if (tabName === 'ltv' && !ltvRendered && analysisResults.ltv) {
    requestAnimationFrame(() => {
      renderLTVVisuals();
    });
  }

  if (tabName === 'abtest' && analysisResults.cohort && !abtestPopulated) {
    requestAnimationFrame(() => {
      populateWeekSelect();
      abtestPopulated = true;
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

// ─── File Processing ───

function handleFile(file) {
  const check = validateCSVFile(file);
  if (!check.valid) {
    showStatus(check.error, 'error');
    return;
  }
  showStatus(t('status.readingFile'), 'loading');
  const reader = new FileReader();
  reader.onload = (e) => processCSV(e.target.result);
  reader.onerror = () => showStatus(t('status.readFailed'), 'error');
  reader.readAsText(file);
}

async function loadSampleData() {
  try {
    showStatus(t('status.loadingSample'), 'loading');
    const response = await fetch('/sample_cohort_data.csv');
    if (!response.ok) throw new Error(t('status.sampleLoadFailed'));
    const csvText = await response.text();
    processCSV(csvText);
  } catch (error) {
    showStatus(error.message, 'error');
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
          showStatus(t('status.noValidData'), 'error');
        }
        return;
      }

      const usersSuffix = validation.stats?.uniqueUsers
        ? t('status.usersSuffix', { count: validation.stats.uniqueUsers })
        : '';
      showStatus(
        t('status.validationComplete', {
          valid: validation.stats.valid.toLocaleString(),
          users: usersSuffix,
        }),
        'success'
      );

      setTimeout(() => analyzeAndVisualize(validation.data), 100);
    },
    error: (error) => {
      showStatus(t('status.csvParseError', { message: error.message }), 'error');
    },
  });
}

// ─── Analysis ───

function analyzeAndVisualize(validatedData) {
  showStatus(t('status.analyzing'), 'loading');
  analysisWorker.postMessage({
    type: 'ANALYZE',
    data: { rows: validatedData, locale: getLocale() },
  });
}

function handleAnalysisSuccess(cohortResult, churnResult, ltvResult, statsResult) {
  try {
    analysisResults.cohort = cohortResult;
    analysisResults.churn = churnResult;
    analysisResults.ltv = ltvResult;
    analysisResults.stats = statsResult || null;
    analysisResults.abtest = null;
    churnRendered = false;
    ltvRendered = false;
    statsRendered = false;
    abtestPopulated = false;

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
    destroyChart(charts.survival);
    destroyChart(charts.abtestRetention);
    destroyChart(charts.abtestPower);

    // Hide A/B test results from previous run
    const abtestResultsEl = document.getElementById('abtestResults');
    if (abtestResultsEl) abtestResultsEl.classList.add('hidden');

    // Render retention charts (visible tab)
    charts.heatmap = renderRetentionHeatmap(
      document.getElementById('heatmapChart'),
      cohortResult.heatmapData
    );
    charts.trend = renderRetentionTrend(
      document.getElementById('trendChart'),
      cohortResult.retentionMatrix
    );

    // Render survival curve on retention tab
    renderStatsVisuals();

    // Setup report button
    const reportBtn = document.getElementById('generateReportBtn');
    const newBtn = reportBtn.cloneNode(true);
    reportBtn.parentNode.replaceChild(newBtn, reportBtn);
    newBtn.addEventListener('click', () => generateAndShowReport());

    showStatus(t('status.analysisComplete'), 'success');

    setTimeout(() => {
      resultsArea.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  } catch (error) {
    showStatus(t('status.renderError', { message: error.message }), 'error');
  }
}

// ─── Statistics ───

function renderStatsVisuals() {
  const stats = analysisResults.stats;
  if (!stats || !stats.kaplanMeier || stats.kaplanMeier.survivalFunction.length === 0) return;

  const card = document.getElementById('survivalCurveCard');
  if (card) {
    card.style.display = '';
    destroyChart(charts.survival);
    charts.survival = renderSurvivalCurve(
      document.getElementById('survivalChart'),
      stats.kaplanMeier
    );
  }
}

function renderStatsOnChurnTab() {
  const stats = analysisResults.stats;
  if (!stats) return;

  const card = document.getElementById('statsTestsCard');
  const container = document.getElementById('statsTestsContainer');
  if (card && container) {
    card.style.display = '';
    container.innerHTML = renderStatisticsCards(stats);
    statsRendered = true;
  }
}

// ─── A/B Test ───

function getAverageRetentionCurve(retentionMatrix) {
  const weekMap = new Map();
  retentionMatrix.forEach((item) => {
    if (!weekMap.has(item.week)) {
      weekMap.set(item.week, { sum: 0, count: 0 });
    }
    const entry = weekMap.get(item.week);
    entry.sum += item.retention;
    entry.count++;
  });
  return [...weekMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([week, { sum, count }]) => ({
      week,
      retention: Math.round((sum / count) * 100) / 100,
    }));
}

function populateWeekSelect() {
  const select = document.getElementById('abtestWeekSelect');
  if (!select || !analysisResults.cohort) return;
  const runBtn = document.getElementById('runABTest');
  const curve = getAverageRetentionCurve(
    analysisResults.cohort.retentionMatrix
  );
  const weekOptions = curve.filter((p) => p.week > 0);

  if (weekOptions.length === 0) {
    select.innerHTML = `<option value="" selected>${t('abtest.noWeekData')}</option>`;
    select.disabled = true;
    if (runBtn) runBtn.disabled = true;
    return;
  }

  const defaultWeek =
    weekOptions.find((p) => p.week === 2)?.week ?? weekOptions[0].week;
  select.disabled = false;
  if (runBtn) runBtn.disabled = false;
  select.innerHTML = weekOptions
    .map(
      (p) =>
        `<option value="${p.week}" ${p.week === defaultWeek ? 'selected' : ''}>Week ${p.week} (${p.retention.toFixed(1)}%)</option>`
    )
    .join('');
}

function runABTestHandler() {
  if (!analysisResults.cohort) return;

  const retentionCurve = getAverageRetentionCurve(
    analysisResults.cohort.retentionMatrix
  );
  const targetWeek = Number.parseInt(
    document.getElementById('abtestWeekSelect').value,
    10
  );
  const delta = Number.parseInt(
    document.getElementById('abtestDeltaSlider').value,
    10
  );
  const alpha =
    parseFloat(document.getElementById('abtestAlpha').value) || 0.05;
  const power =
    parseFloat(document.getElementById('abtestPower').value) || 0.8;
  const arpu =
    parseFloat(document.getElementById('abtestArpu').value) || 1;

  if (!Number.isFinite(targetWeek)) {
    showStatus(t('status.abtestInvalidWeek'), 'error');
    return;
  }

  if (
    !Number.isFinite(delta) ||
    delta <= 0 ||
    !Number.isFinite(alpha) ||
    !Number.isFinite(power) ||
    !Number.isFinite(arpu)
  ) {
    showStatus(t('status.abtestInvalidParams'), 'error');
    return;
  }

  const result = runABTestSimulation({
    retentionCurve,
    targetWeek,
    delta,
    alpha,
    power,
    arpu,
  });

  if (!result) {
    showStatus(t('status.abtestInvalidParams'), 'error');
    return;
  }

  analysisResults.abtest = result;
  renderABTestResults(result);
}

function renderABTestResults(result) {
  document.getElementById('abtestResults').classList.remove('hidden');

  destroyChart(charts.abtestRetention);
  destroyChart(charts.abtestPower);

  charts.abtestRetention = renderRetentionComparison(
    document.getElementById('abtestRetentionChart'),
    result.retention
  );

  charts.abtestPower = renderPowerCurve(
    document.getElementById('abtestPowerChart'),
    result.powerAnalysis.powerCurve,
    result.powerAnalysis.sampleSize
  );

  document.getElementById('abtestResultCards').innerHTML = renderResultCards(
    result.powerAnalysis,
    result.ltvImpact
  );

  document.getElementById('abtestScenarioTable').innerHTML =
    renderScenarioTable(result.scenarios);
}

// ─── Report ───

async function generateAndShowReport() {
  if (!analysisResults.cohort || !analysisResults.churn) {
    showStatus(t('status.noAnalysisResult'), 'error');
    return;
  }

  const btn = document.getElementById('generateReportBtn');
  const originalHTML = btn.innerHTML;
  btn.textContent = t('status.generating');
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
    showStatus(t('status.reportError', { message: error.message }), 'error');
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
