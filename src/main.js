import './style.css';
import Papa from 'papaparse';
import { validateCohortData, validateFileSize } from './core/dataValidator.js';
import { renderRetentionHeatmap, renderRetentionTrend } from './visualization/heatmapRenderer.js';
import { renderRiskSegmentChart, renderRiskUsersTable, renderInsightsCards, destroyChart } from './visualization/churnVisualization.js';
import { prepareSummaryData, generateSummaryHTML } from './export/summaryGenerator.js';
import { showPDFPreview } from './export/pdfExporter.js';

// 전역 차트 변수
let charts = {
  heatmap: null,
  trend: null,
  risk: null
};

// 분석 결과 저장소
let analysisResults = {
  cohort: null,
  churn: null
};

// Web Worker 초기화
const analysisWorker = new Worker(new URL('./core/analysisWorker.js', import.meta.url), { type: 'module' });

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

// UI 초기화
document.querySelector('#app').innerHTML = `
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4 font-sans">
    <div class="max-w-7xl mx-auto">
      <!-- 헤더 -->
      <div class="text-center mb-12">
        <h1 class="text-5xl font-extrabold text-slate-900 mb-3 tracking-tight">
          Cohort<span class="text-blue-600">IQ</span>
        </h1>
        <p class="text-slate-600 text-lg font-medium">
          데이터 기반 구독 비즈니스 성장 솔루션
        </p>
      </div>

      <!-- 업로드 영역 -->
      <div class="bg-white rounded-2xl shadow-xl p-10 mb-10 transition-all hover:shadow-2xl">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-slate-800">📂 데이터 업로드</h2>
          <span class="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">CSV Only</span>
        </div>
        
        <div class="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors group">
          <input type="file" id="csvUpload" accept=".csv" class="hidden" />
          <label for="csvUpload" class="cursor-pointer flex flex-col items-center">
            <div class="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
            </div>
            <span class="text-lg font-semibold text-slate-700 mb-1">CSV 파일을 드래그하거나 클릭하여 업로드</span>
            <span class="text-sm text-slate-500">필수 컬럼: user_id, signup_date, event_date</span>
          </label>
        </div>

        <div class="flex justify-center mt-6">
           <button id="loadSample" class="text-sm text-slate-500 hover:text-blue-600 hover:underline flex items-center gap-1">
             <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
             샘플 데이터로 체험해보기
           </button>
        </div>
        
        <div id="uploadStatus" class="mt-6"></div>
      </div>

      <!-- 결과 영역 -->
      <div id="resultsArea" class="hidden space-y-8">
      
        <!-- 1. 핵심 지표 요약 -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="bg-white rounded-xl shadow p-6 border-l-4 border-blue-500">
            <p class="text-slate-500 text-sm font-medium mb-1">분석 코호트</p>
            <p id="statCohorts" class="text-3xl font-bold text-slate-800">-</p>
          </div>
          <div class="bg-white rounded-xl shadow p-6 border-l-4 border-indigo-500">
            <p class="text-slate-500 text-sm font-medium mb-1">분석 사용자</p>
            <p id="statUsers" class="text-3xl font-bold text-slate-800">-</p>
          </div>
          <div class="bg-white rounded-xl shadow p-6 border-l-4 border-purple-500">
            <p class="text-slate-500 text-sm font-medium mb-1">데이터 포인트</p>
            <p id="statDataPoints" class="text-3xl font-bold text-slate-800">-</p>
          </div>
           <div class="bg-white rounded-xl shadow p-6 border-l-4 border-emerald-500">
            <p class="text-slate-500 text-sm font-medium mb-1">처리 속도</p>
            <p id="statDuration" class="text-3xl font-bold text-slate-800">-</p>
          </div>
        </div>

        <!-- 2. 리텐션 분석 섹션 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- 히트맵 -->
          <div class="bg-white rounded-2xl shadow-xl p-8">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xl font-bold text-slate-800 flex items-center gap-2">
                📊 코호트 리텐션 히트맵
              </h2>
            </div>
            <div class="relative h-[400px]">
              <canvas id="heatmapChart"></canvas>
            </div>
          </div>

          <!-- 리텐션 트렌드 -->
          <div class="bg-white rounded-2xl shadow-xl p-8">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xl font-bold text-slate-800 flex items-center gap-2">
                📈 리텐션 트렌드 (1주차 vs 4주차)
              </h2>
            </div>
            <div class="relative h-[400px]">
              <canvas id="trendChart"></canvas>
            </div>
          </div>
        </div>

        <!-- 3. Churn 위험 분석 섹션 (신규) -->
        <div class="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
          <div class="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
            <h2 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
              🚨 Churn 예측 및 위험 분석
            </h2>
            <button id="generateReportBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-200">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              PDF 리포트 생성
            </button>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- 왼쪽: 위험 세그먼트 차트 -->
            <div class="lg:col-span-1 border-r border-slate-100 pr-0 lg:pr-8">
              <h3 class="text-lg font-semibold text-slate-700 mb-4">위험군 분포</h3>
              <div class="relative h-[300px]">
                <canvas id="riskChart"></canvas>
              </div>
            </div>

            <!-- 오른쪽: 주요 인사이트 카드 -->
            <div class="lg:col-span-2">
               <h3 class="text-lg font-semibold text-slate-700 mb-4">💡 주요 인사이트 및 조치사항</h3>
               <div id="insightsContainer" class="grid grid-cols-1 gap-4">
                 <!-- 인사이트 카드 렌더링 -->
               </div>
            </div>
          </div>

          <!-- 하단: 고위험 사용자 테이블 -->
          <div class="mt-8 pt-8 border-t border-slate-100">
             <h3 class="text-lg font-semibold text-slate-700 mb-4 flex justify-between items-center">
               <span>⚠️ 이탈 위험 사용자 (Top 20)</span>
               <span class="text-sm text-slate-500 font-normal">최근 활동 및 패턴 기반 분석</span>
             </h3>
             <div id="riskTableContainer" class="overflow-hidden rounded-lg border border-slate-200">
               <!-- 테이블 렌더링 -->
             </div>
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

// DOM Elements
const dropZone = document.querySelector('label[for="csvUpload"]').parentElement;
const fileInput = document.getElementById('csvUpload');
const loadSampleBtn = document.getElementById('loadSample');

// Event Listeners
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('border-blue-500', 'bg-blue-50');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('border-blue-500', 'bg-blue-50');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('border-blue-500', 'bg-blue-50');
  const files = e.dataTransfer.files;
  if (files.length) handleFile(files[0]);
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files.length) handleFile(e.target.files[0]);
});

loadSampleBtn.addEventListener('click', () => {
  loadSampleData();
});

// 파일 처리 함수
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

// 샘플 데이터 로드
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

// CSV 처리 함수
function processCSV(csvText) {
  Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      // 파일 크기 및 데이터 검증
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
          showStatus('유효한 데이터가 없습니다. CSV 파일을 확인해주세요.', 'error');
        }
        return;
      }

      // 성공 메시지 및 통계
      const uniqueUsers = validation.stats?.uniqueUsers ? ` (사용자: ${validation.stats.uniqueUsers}명)` : '';
      showStatus(`데이터 검증 완료! (유효: ${validation.stats.valid.toLocaleString()}행${uniqueUsers})`, 'success');

      // 분석 시작 (약간의 지연으로 UI 렌더링 보장)
      setTimeout(() => analyzeAndVisualize(validation.data), 100);
    },
    error: (error) => {
      showStatus(`CSV 파싱 오류: ${error.message}`, 'error');
    }
  });
}

// 통합 분석 실행 (Worker 위임)
function analyzeAndVisualize(validatedData) {
  showStatus('데이터 분석 중... (대용량 데이터도 끊김 없이 처리됩니다)', 'loading');

  // 워커에 데이터 전송
  analysisWorker.postMessage({
    type: 'ANALYZE',
    data: validatedData
  });
}

// 분석 성공 처리 (메인 스레드 UI 업데이트)
function handleAnalysisSuccess(cohortResult, churnResult) {
  try {
    // 결과 저장
    analysisResults.cohort = cohortResult;
    analysisResults.churn = churnResult;

    // 결과 영역 표시
    document.getElementById('resultsArea').classList.remove('hidden');

    // 1. 통계 업데이트
    updateStats(cohortResult);
    document.getElementById('statUsers').textContent = churnResult.performance.usersAnalyzed.toLocaleString();

    // 2. 차트 렌더링
    destroyCharts(); // 이전 차트 제거

    // 히트맵
    const heatmapCanvas = document.getElementById('heatmapChart');
    charts.heatmap = renderRetentionHeatmap(heatmapCanvas, cohortResult.heatmapData);

    // 트렌드
    const trendCanvas = document.getElementById('trendChart');
    charts.trend = renderRetentionTrend(trendCanvas, cohortResult.retentionMatrix);

    // Churn 차트
    const riskCanvas = document.getElementById('riskChart');
    charts.risk = renderRiskSegmentChart(riskCanvas, churnResult.riskSegments);

    // 3. 인사이트 및 테이블 렌더링
    const insightsContainer = document.getElementById('insightsContainer');
    insightsContainer.innerHTML = renderInsightsCards(churnResult.insights);

    const riskTableContainer = document.getElementById('riskTableContainer');
    riskTableContainer.innerHTML = renderRiskUsersTable(churnResult.churnRiskData);

    // 4. 리포트 버튼 이벤트 연결
    const reportBtn = document.getElementById('generateReportBtn');
    const newBtn = reportBtn.cloneNode(true);
    reportBtn.parentNode.replaceChild(newBtn, reportBtn);

    newBtn.addEventListener('click', () => {
      generateAndShowReport();
    });

    // 최종 완료 메시지
    showStatus('모든 분석이 성공적으로 완료되었습니다. 아래에서 상세 내용을 확인하세요.', 'success');

    // 스크롤 이동
    setTimeout(() => {
      document.getElementById('resultsArea').scrollIntoView({ behavior: 'smooth' });
    }, 100);

  } catch (error) {
    showStatus(`결과 렌더링 중 오류가 발생했습니다: ${error.message}`, 'error');
  }
}

function updateStats(result) {
  document.getElementById('statCohorts').textContent = result.cohorts.length.toLocaleString();
  document.getElementById('statDataPoints').textContent = result.retentionMatrix.length.toLocaleString();
  document.getElementById('statDuration').textContent = `${Math.round(result.performance.duration)}ms`;
}

function destroyCharts() {
  destroyChart(charts.heatmap);
  destroyChart(charts.trend);
  destroyChart(charts.risk);
}

// 리포트 생성 및 표시
async function generateAndShowReport() {
  if (!analysisResults.cohort || !analysisResults.churn) {
    showStatus('분석 결과가 없습니다. 먼저 데이터를 업로드해주세요.', 'error');
    return;
  }

  const btn = document.getElementById('generateReportBtn');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<span>⏳ 생성 중...</span>';
  btn.disabled = true;

  try {
    // 데이터 준비
    const summaryData = prepareSummaryData(analysisResults.cohort, analysisResults.churn);

    // HTML 생성
    const htmlContent = generateSummaryHTML(summaryData);

    // 미리보기 표시
    showPDFPreview(htmlContent);

  } catch (error) {
    showStatus('리포트 생성 중 오류가 발생했습니다: ' + error.message, 'error');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// 상태 표시 함수
function showStatus(message, type = 'info') {
  const statusDiv = document.getElementById('uploadStatus');
  const styles = {
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-green-50 text-green-700 border-green-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    loading: 'bg-gray-50 text-gray-700 border-gray-200 animate-pulse'
  };

  statusDiv.innerHTML = `
    <div class="px-4 py-3 rounded-lg border ${styles[type]} flex items-center justify-between">
      <span class="font-medium">${message}</span>
      ${type === 'loading' ? '<svg class="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>' : ''}
    </div>
  `;
}

function renderValidationErrors(container, errors) {
  const errorList = errors.slice(0, 3).map(e => `<li>${e}</li>`).join('');
  const html = `
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 mt-4">
      <p class="font-bold text-red-800 mb-2 flex items-center gap-2">❌ 데이터 오류 (수정 필요)</p>
      <ul class="text-sm text-red-700 list-disc list-inside space-y-1">
        ${errorList}
        ${errors.length > 3 ? `<li>... 외 ${errors.length - 3}건의 이슈</li>` : ''}
      </ul>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', html);
}

function renderValidationWarnings(container, warnings) {
  const warningList = warnings.slice(0, 3).map(w => `<li>${w}</li>`).join('');
  const html = `
    <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 mt-4">
      <p class="font-bold text-amber-800 mb-2 flex items-center gap-2">⚠️ 데이터 경고 (확인 요망)</p>
      <ul class="text-sm text-amber-700 list-disc list-inside space-y-1">
        ${warningList}
        ${warnings.length > 3 ? `<li>... 외 ${warnings.length - 3}건의 이슈</li>` : ''}
      </ul>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', html);
}
