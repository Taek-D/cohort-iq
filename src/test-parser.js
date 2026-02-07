// test-parser.js - CSV 파싱 테스트
import Papa from 'papaparse';

const sampleCSV = `user_id,signup_date,event_date
U001,2025-01-01,2025-01-01
U001,2025-01-01,2025-01-08
U002,2025-01-01,2025-01-03`;

console.log('=== CSV 파싱 테스트 시작 ===');

Papa.parse(sampleCSV, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
        console.log('✅ PapaParse 동작 확인');
        console.log(`  - 파싱된 데이터 ${results.data.length}행`);
        console.log(`  - 컬럼: ${results.meta.fields.join(', ')}`);
        console.log(`  - 첫 번째 행:`, results.data[0]);

        if (results.data.length === 3) {
            console.log('✅ 테스트 통과: 예상 3행, 실제', results.data.length, '행');
        } else {
            console.log('❌ 테스트 실패: 예상 3행, 실제', results.data.length, '행');
        }
    },
    error: (error) => {
        console.log('❌ PapaParse 오류:', error);
    }
});
