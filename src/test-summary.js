// test-summary.js - Summary 생성 테스트
import Papa from 'papaparse';
import { validateCohortData } from './core/dataValidator.js';
import { analyzeCohort } from './core/cohortAnalysis.js';
import { analyzeChurn } from './core/churnAnalysis.js';
import { prepareSummaryData, getHealthGrade, generateSummaryHTML } from './export/summaryGenerator.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('=== Executive Summary 생성 테스트 ===\n');

// 샘플 CSV 로드
const csvPath = join(__dirname, 'data', 'samples', 'sample-cohort.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    complete: async (results) => {
        // 데이터 검증
        const validation = validateCohortData(results.data);
        console.log(`✅ 데이터 검증: ${validation.stats.valid}행\n`);

        // 코호트 분석
        const cohortResult = analyzeCohort(validation.data);
        console.log(`✅ 코호트 분석 완료: ${cohortResult.cohorts.length}개 코호트\n`);

        // Churn 분석을 위한 cohortInfo 생성
        const { groupByCohort } = await import('./core/cohortAnalysis.js');
        const cohortInfo = groupByCohort(validation.data);

        // Churn 분석
        const churnResult = analyzeChurn(validation.data, cohortInfo);
        console.log(`✅ Churn 분석 완료: ${churnResult.performance.usersAnalyzed}명 분석\n`);

        // Summary 데이터 준비
        const summaryData = prepareSummaryData(cohortResult, churnResult);

        console.log('📊 Executive Summary 데이터:');
        console.log(`  - 분석 기간: ${summaryData.metadata.dateRange.from} ~ ${summaryData.metadata.dateRange.to}`);
        console.log(`  - 총 코호트: ${summaryData.metadata.totalCohorts}개`);
        console.log(`  - 건강도 점수: ${summaryData.keyMetrics.healthScore}점\n`);

        const healthGrade = getHealthGrade(summaryData.keyMetrics.healthScore);
        console.log(`🎯 건강도 등급: ${healthGrade.grade} (${healthGrade.label})`);
        console.log(`  색상: ${healthGrade.color}\n`);

        console.log('📈 리텐션 추이:');
        console.log(`  - Week 1: ${summaryData.keyMetrics.week1Retention}%`);
        console.log(`  - Week 2: ${summaryData.keyMetrics.week2Retention}%`);
        console.log(`  - Week 3: ${summaryData.keyMetrics.week3Retention}%`);
        console.log(`  - Week 4: ${summaryData.keyMetrics.week4Retention}%\n`);

        console.log('⚠️ Churn 위험:');
        console.log(`  - Critical: ${summaryData.churnRisk.critical}명 (${summaryData.churnRisk.criticalPercentage}%)`);
        console.log(`  - High: ${summaryData.churnRisk.high}명 (${summaryData.churnRisk.highPercentage}%)\n`);

        console.log(`💡 인사이트: ${summaryData.insights.length}개 생성\n`);
        summaryData.insights.forEach((insight, index) => {
            console.log(`  ${index + 1}. [${insight.severity}] ${insight.title}`);
            console.log(`     ${insight.description}`);
        });

        // HTML 생성
        const html = generateSummaryHTML(summaryData);
        console.log(`\n✅ HTML 템플릿 생성 완료: ${html.length}자`);

        // HTML 파일로 저장 (미리보기용)
        const outputPath = join(__dirname, 'summary-preview.html');
        const fullHTML = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Executive Summary Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 p-8">
  ${html}
</body>
</html>
    `;
        fs.writeFileSync(outputPath, fullHTML);
        console.log(`📄 미리보기 HTML 저장: ${outputPath}`);

        console.log('\n=== Summary 생성 테스트 완료 ===');
    }
});
