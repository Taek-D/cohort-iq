// test-cohort-analysis.js - 코호트 분석 기능 테스트
import Papa from 'papaparse';
import { validateCohortData, validateFileSize } from './core/dataValidator.js';
import { analyzeCohort } from './core/cohortAnalysis.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('=== 코호트 분석 테스트 시작 ===\n');

// 샘플 CSV 파일 읽기
const csvPath = join(__dirname, 'data', 'samples', 'sample-cohort.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

console.log('📂 CSV 파일 로드:', csvPath);

// 1. CSV 파싱
Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
        console.log(`✅ CSV 파싱 완료: ${results.data.length}행\n`);

        // 2. 파일 크기 검증
        const sizeCheck = validateFileSize(results.data.length);
        if (!sizeCheck.valid) {
            console.error('❌ 파일 크기 검증 실패:', sizeCheck.error);
            return;
        }
        console.log('✅ 파일 크기 검증 통과\n');

        // 3. 데이터 검증
        const validation = validateCohortData(results.data);

        if (validation.errors.length > 0) {
            console.warn('⚠️  검증 경고:');
            validation.errors.forEach(err => console.warn('  -', err));
            console.log();
        }

        console.log('📊 검증 통계:');
        console.log(`  - 전체 행: ${validation.stats.total}`);
        console.log(`  - 유효 행: ${validation.stats.valid}`);
        console.log(`  - 무효 행: ${validation.stats.invalid}\n`);

        if (!validation.valid) {
            console.error('❌ 데이터 검증 실패. 분석을 중단합니다.');
            return;
        }

        console.log('✅ 데이터 검증 통과\n');

        // 4. 코호트 분석 실행
        const analysisResult = analyzeCohort(validation.data);

        console.log('\n📈 분석 결과:');
        console.log(`  - 코호트 수: ${analysisResult.cohorts.length}`);
        console.log(`  - 리텐션 데이터 포인트: ${analysisResult.retentionMatrix.length}`);
        console.log(`  - 히트맵 최대 주차: ${analysisResult.heatmapData.maxWeek}`);
        console.log(`  - 처리 시간: ${analysisResult.performance.duration}ms`);
        console.log(`  - 처리 속도: ${Math.round(analysisResult.performance.rowsProcessed / (analysisResult.performance.duration / 1000))} 행/초\n`);

        // 5. 코호트 목록 출력
        console.log('📅 코호트 목록:');
        analysisResult.cohorts.forEach((cohort, index) => {
            console.log(`  ${index + 1}. ${cohort}`);
        });
        console.log();

        // 6. 샘플 리텐션 데이터 출력
        console.log('📊 샘플 리텐션 데이터 (첫 10개):');
        analysisResult.retentionMatrix.slice(0, 10).forEach(item => {
            console.log(`  ${item.cohort} - Week ${item.week}: ${item.retention}% (${item.users}/${item.total})`);
        });
        console.log();

        // 7. 히트맵 데이터 샘플
        console.log('🌡️  히트맵 데이터 샘플 (첫 5개):');
        analysisResult.heatmapData.data.slice(0, 5).forEach(item => {
            console.log(`  [${item.x}, ${item.y}] = ${item.v}%`);
        });
        console.log();

        // 8. 성능 검증 (목표: 3초 내)
        const targetTime = 3000; // 3초
        if (analysisResult.performance.duration < targetTime) {
            console.log(`✅ 성능 목표 달성! (${analysisResult.performance.duration}ms < ${targetTime}ms)`);
        } else {
            console.warn(`⚠️  성능 목표 미달! (${analysisResult.performance.duration}ms > ${targetTime}ms)`);
        }

        console.log('\n=== 테스트 완료 ===');
    },
    error: (error) => {
        console.error('❌ CSV 파싱 오류:', error);
    }
});
