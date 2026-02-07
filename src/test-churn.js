// test-churn.js - Churn 분석 테스트
import Papa from 'papaparse';
import { validateCohortData } from './core/dataValidator.js';
import { groupByCohort } from './core/cohortAnalysis.js';
import { analyzeChurn } from './core/churnAnalysis.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('=== Churn 분석 테스트 시작 ===\n');

// 샘플 CSV 로드
const csvPath = join(__dirname, 'data', 'samples', 'sample-cohort.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
        console.log(`📂 CSV 파일 로드: ${results.data.length}행\n`);

        // 데이터 검증
        const validation = validateCohortData(results.data);
        console.log(`✅ 데이터 검증 완료: ${validation.stats.valid}행\n`);

        // 코호트 그룹화 (Churn 분석에 필요)
        const cohortInfo = groupByCohort(validation.data);
        console.log(`✅ 코호트 그룹화 완료: ${cohortInfo.cohorts.size}개 코호트\n`);

        // Churn 분석 실행
        const churnResult = analyzeChurn(validation.data, cohortInfo);

        console.log('\n📊 Churn 분석 결과:');
        console.log(`  - 분석 사용자: ${churnResult.performance.usersAnalyzed}명`);
        console.log(`  - 처리 시간: ${churnResult.performance.duration}ms\n`);

        // 위험 세그먼트 통계
        console.log('📈 위험 세그먼트 분포:');
        const { summary } = churnResult.riskSegments;
        console.log(`  🔴 Critical: ${summary.critical}명 (${summary.criticalPercentage}%)`);
        console.log(`  🟠 High: ${summary.high}명 (${summary.highPercentage}%)`);
        console.log(`  🟡 Medium: ${summary.medium}명`);
        console.log(`  🟢 Low: ${summary.low}명\n`);

        // 고위험 사용자 Top 5
        console.log('⚠️  고위험 사용자 Top 5:');
        churnResult.churnRiskData.slice(0, 5).forEach((user, index) => {
            console.log(`  ${index + 1}. ${user.userId} - ${user.riskLevel} (점수: ${user.riskScore})`);
            console.log(`     └ 마지막 활동: ${user.metrics.weeksSinceLastActivity}주 전, 밀도: ${user.metrics.activityDensity}%`);
        });
        console.log();

        // 생성된 인사이트
        console.log(`💡 생성된 인사이트 (${churnResult.insights.length}개):`);
        churnResult.insights.forEach((insight, index) => {
            console.log(`\n  ${index + 1}. [${insight.severity}] ${insight.title}`);
            console.log(`     ${insight.description}`);
            console.log(`     💡 ${insight.action}`);
            console.log(`     영향: ${insight.affectedUsers}명`);
        });

        console.log('\n=== Churn 분석 테스트 완료 ===');
    }
});
