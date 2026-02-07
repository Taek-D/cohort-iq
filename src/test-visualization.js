// test-visualization.js - 히트맵 시각화 테스트
import Papa from 'papaparse';
import { validateCohortData } from './core/dataValidator.js';
import { analyzeCohort } from './core/cohortAnalysis.js';
import { renderRetentionHeatmap, renderRetentionTrend } from './visualization/heatmapRenderer.js';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('=== 히트맵 시각화 테스트 시작 ===\n');

// JSDOM으로 가상 DOM 생성
const dom = new JSDOM(`
  <!DOCTYPE html>
  <html>
    <body>
      <canvas id="heatmap" width="800" height="600"></canvas>
      <canvas id="trend" width="800" height="400"></canvas>
    </body>
  </html>
`, {
    resources: 'usable',
    runScripts: 'dangerously'
});

global.window = dom.window;
global.document = dom.window.document;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;
global.CanvasRenderingContext2D = dom.window.CanvasRenderingContext2D;

// 샘플 CSV 로드
const csvPath = join(__dirname, 'data', 'samples', 'sample-cohort.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
        console.log('✅ CSV 파싱 완료\n');

        // 데이터 검증
        const validation = validateCohortData(results.data);
        console.log('✅ 데이터 검증 완료\n');

        // 코호트 분석
        const analysisResult = analyzeCohort(validation.data);
        console.log('✅ 코호트 분석 완료\n');

        // 히트맵 렌더링 테스트
        try {
            const heatmapCanvas = document.getElementById('heatmap');
            const heatmapChart = renderRetentionHeatmap(heatmapCanvas, analysisResult.heatmapData);

            console.log('✅ 히트맵 차트 생성 성공');
            console.log(`  - 차트 타입: ${heatmapChart.config.type}`);
            console.log(`  - 데이터 포인트: ${analysisResult.heatmapData.data.length}개\n`);

            // 트렌드 차트 렌더링 테스트
            const trendCanvas = document.getElementById('trend');
            const trendChart = renderRetentionTrend(trendCanvas, analysisResult.retentionMatrix);

            console.log('✅ 트렌드 차트 생성 성공');
            console.log(`  - 차트 타입: ${trendChart.config.type}`);
            console.log(`  - 코호트 수: ${trendChart.data.datasets.length}개\n`);

            console.log('=== 모든 시각화 테스트 통과! ===');

        } catch (error) {
            console.error('❌ 시각화 오류:', error.message);
            console.error(error.stack);
        }
    }
});
