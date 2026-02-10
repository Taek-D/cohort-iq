// ui/appLayout.js — 앱 레이아웃 HTML 템플릿 (main.js에서 분리)
import { t, getLocale } from '../i18n/index.js';

const GITHUB_ICON = `<svg viewBox="0 0 16 16" fill="currentColor">
  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
</svg>`;

const UPLOAD_ICON = `<svg class="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
  <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
</svg>`;

const DOWNLOAD_ICON = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
  <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
</svg>`;

/**
 * 앱 전체 레이아웃 HTML 생성
 * @returns {string} HTML 문자열
 */
export function createAppLayout() {
  const lang = getLocale();
  const koActive = lang === 'ko' ? 'font-weight: 700;' : 'opacity: 0.5;';
  const enActive = lang === 'en' ? 'font-weight: 700;' : 'opacity: 0.5;';

  return `
  <header class="topbar">
    <div class="topbar-left">
      <h1 class="logo">CohortIQ</h1>
      <span class="version-badge">v1.1</span>
    </div>
    <div style="display: flex; align-items: center; gap: 12px;">
      <div id="langToggle" class="lang-toggle">
        <button type="button" data-lang="ko" style="${koActive}">KO</button>
        <span style="opacity: 0.3;">|</span>
        <button type="button" data-lang="en" style="${enActive}">EN</button>
      </div>
      <a href="https://github.com/Taek-D/cohort-iq" target="_blank" rel="noopener" class="topbar-link">
        ${GITHUB_ICON}
        ${t('header.source')}
      </a>
    </div>
  </header>

  <main class="content">
    <!-- Upload -->
    <div class="upload-card">
      <div class="drop-zone" id="dropZone">
        <input type="file" id="csvUpload" accept=".csv" class="sr-only" />
        <div class="drop-zone-inner">
          <label for="csvUpload" class="upload-left">
            ${UPLOAD_ICON}
            <span class="upload-text"><strong>${t('upload.title')}</strong> ${t('upload.dragDrop')}</span>
          </label>
          <div class="upload-right">
            <span class="upload-cols">${t('upload.requiredCols')}</span>
            <button type="button" id="loadSample" class="sample-btn">${t('upload.trySample')}</button>
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
          <span class="stat-lbl">${t('stats.cohorts')}</span>
        </div>
        <span class="stat-sep">&middot;</span>
        <div class="stat-item">
          <span class="stat-val" id="statUsers">&mdash;</span>
          <span class="stat-lbl">${t('stats.users')}</span>
        </div>
        <span class="stat-sep">&middot;</span>
        <div class="stat-item">
          <span class="stat-val" id="statDataPoints">&mdash;</span>
          <span class="stat-lbl">${t('stats.dataPoints')}</span>
        </div>
        <span class="stat-sep">&middot;</span>
        <div class="stat-item">
          <span class="stat-val stat-accent" id="statDuration">&mdash;</span>
          <span class="stat-lbl">${t('stats.processed')}</span>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tab-bar">
        <button class="tab-btn active" data-tab="retention">${t('tabs.retention')}</button>
        <button class="tab-btn" data-tab="churn">${t('tabs.churn')}</button>
        <button class="tab-btn" data-tab="ltv">${t('tabs.ltv')}</button>
        <button class="tab-btn" data-tab="abtest">${t('tabs.abtest')}</button>
      </div>

      <!-- Retention Panel -->
      <div class="tab-panel active" id="panel-retention">
        <div class="panel-grid">
          <div class="panel-card">
            <div class="panel-header">
              <h3 class="panel-title">${t('panel.retentionHeatmap')}</h3>
            </div>
            <div class="chart-area" style="height: 380px;">
              <canvas id="heatmapChart"></canvas>
            </div>
          </div>
          <div class="panel-card">
            <div class="panel-header">
              <h3 class="panel-title">${t('panel.cohortTrend')}</h3>
            </div>
            <div class="chart-area" style="height: 380px;">
              <canvas id="trendChart"></canvas>
            </div>
          </div>
        </div>
        <div class="panel-card" id="survivalCurveCard" style="display: none;">
          <div class="panel-header">
            <h3 class="panel-title">${t('panel.survivalCurve')}</h3>
          </div>
          <div class="chart-area" style="height: 380px;">
            <canvas id="survivalChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Churn Panel -->
      <div class="tab-panel" id="panel-churn">
        <div class="churn-top">
          <div class="panel-card">
            <div class="panel-header">
              <h3 class="panel-title">${t('panel.riskSegments')}</h3>
            </div>
            <div class="chart-area" style="height: 260px;">
              <canvas id="riskChart"></canvas>
            </div>
          </div>
          <div class="panel-card">
            <div class="panel-header">
              <h3 class="panel-title">${t('panel.insights')}</h3>
            </div>
            <div id="insightsContainer" class="insights-wrap"></div>
          </div>
        </div>
        <div class="panel-card" id="statsTestsCard" style="display: none;">
          <div class="panel-header">
            <h3 class="panel-title">${t('panel.statisticalTests')}</h3>
          </div>
          <div id="statsTestsContainer" class="stats-tests-wrap"></div>
        </div>
        <div class="panel-card">
          <div class="panel-header">
            <h3 class="panel-title">${t('panel.highRiskUsers')}</h3>
            <button id="generateReportBtn" class="btn-outline">
              ${DOWNLOAD_ICON}
              ${t('panel.exportPdf')}
            </button>
          </div>
          <div id="riskTableContainer"></div>
        </div>
      </div>

      <!-- LTV Panel -->
      <div class="tab-panel" id="panel-ltv">
        <div class="ltv-controls">
          <label class="ltv-label">
            ${t('ltv.arpuLabel')}
            <input type="number" id="arpuInput" value="1" min="0" step="0.01"
                   class="ltv-input" placeholder="1.00" />
          </label>
          <button type="button" id="recalcLTV" class="btn-outline">${t('ltv.recalculate')}</button>
        </div>
        <div class="panel-grid">
          <div class="panel-card">
            <div class="panel-header">
              <h3 class="panel-title">${t('panel.cohortLtv')}</h3>
            </div>
            <div class="chart-area" style="height: 380px;">
              <canvas id="ltvBarChart"></canvas>
            </div>
          </div>
          <div class="panel-card">
            <div class="panel-header">
              <h3 class="panel-title">${t('panel.ltvTrend')}</h3>
            </div>
            <div class="chart-area" style="height: 380px;">
              <canvas id="ltvTrendChart"></canvas>
            </div>
          </div>
        </div>
        <div class="panel-card">
          <div class="panel-header">
            <h3 class="panel-title">${t('panel.cohortComparison')}</h3>
          </div>
          <div id="ltvTableContainer"></div>
        </div>
      </div>

      <!-- A/B Test Panel -->
      <div class="tab-panel" id="panel-abtest">
        <div class="panel-card abtest-controls">
          <div class="panel-header">
            <h3 class="panel-title">${t('abtest.settings')}</h3>
          </div>
          <div class="abtest-form">
            <div class="abtest-form-row">
              <label class="abtest-label">
                ${t('abtest.targetWeek')}
                <select id="abtestWeekSelect" class="abtest-select"></select>
              </label>
              <label class="abtest-label">
                ${t('abtest.deltaRetention')}
                <div class="abtest-slider-wrap">
                  <input type="range" id="abtestDeltaSlider" min="1" max="30" value="10" class="abtest-slider" />
                  <span id="abtestDeltaValue" class="abtest-slider-val">+10%p</span>
                </div>
              </label>
            </div>
            <div class="abtest-form-row">
              <label class="abtest-label">
                ${t('abtest.alpha')}
                <input type="number" id="abtestAlpha" value="0.05" min="0.01" max="0.10" step="0.01" class="abtest-input" />
              </label>
              <label class="abtest-label">
                ${t('abtest.power')}
                <input type="number" id="abtestPower" value="0.80" min="0.50" max="0.99" step="0.01" class="abtest-input" />
              </label>
              <label class="abtest-label">
                ${t('abtest.arpu')}
                <input type="number" id="abtestArpu" value="9900" min="0" step="100" class="abtest-input" />
              </label>
            </div>
            <button type="button" id="runABTest" class="btn-primary">${t('abtest.run')}</button>
          </div>
        </div>

        <div id="abtestResults" class="hidden">
          <div class="panel-card">
            <div class="panel-header">
              <h3 class="panel-title">${t('abtest.retentionCompare')}</h3>
            </div>
            <div class="chart-area" style="height: 380px;">
              <canvas id="abtestRetentionChart"></canvas>
            </div>
          </div>
          <div class="panel-grid">
            <div class="panel-card">
              <div class="panel-header">
                <h3 class="panel-title">${t('abtest.powerCurve')}</h3>
              </div>
              <div class="chart-area" style="height: 300px;">
                <canvas id="abtestPowerChart"></canvas>
              </div>
            </div>
            <div class="panel-card">
              <div class="panel-header">
                <h3 class="panel-title">${t('abtest.resultSummary')}</h3>
              </div>
              <div id="abtestResultCards" class="abtest-cards-wrap"></div>
            </div>
          </div>
          <div class="panel-card">
            <div class="panel-header">
              <h3 class="panel-title">${t('abtest.scenarioComparison')}</h3>
            </div>
            <div id="abtestScenarioTable"></div>
          </div>
        </div>
      </div>

    </div>
  </main>`;
}
