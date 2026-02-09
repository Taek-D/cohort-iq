import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('CohortIQ E2E — CSV → 분석 → 결과', () => {
  test('샘플 데이터 로드 → 리텐션 히트맵 + Churn Risk 렌더링', async ({
    page,
  }) => {
    await page.goto('/');

    // 1. 랜딩 페이지 확인
    await expect(page.locator('.logo')).toHaveText('CohortIQ');
    await expect(page.locator('#loadSample')).toBeVisible();

    // 2. 샘플 데이터 로드
    await page.click('#loadSample');

    // 3. 분석 완료 대기 (결과 영역 표시)
    await expect(page.locator('#resultsArea')).toBeVisible({ timeout: 10000 });

    // 4. 통계 바 수치 확인 (빈 대시가 아닌 실제 값)
    await expect(page.locator('#statCohorts')).not.toHaveText('—');
    await expect(page.locator('#statUsers')).not.toHaveText('—');
    await expect(page.locator('#statDuration')).toContainText('ms');

    // 5. Retention 탭 — 히트맵 캔버스 렌더링 확인
    const heatmapCanvas = page.locator('#heatmapChart');
    await expect(heatmapCanvas).toBeVisible();
    const heatmapWidth = await heatmapCanvas.evaluate(
      (el) => el.width
    );
    expect(heatmapWidth).toBeGreaterThan(0);

    // 6. Churn Risk 탭 전환
    await page.click('[data-tab="churn"]');
    await expect(page.locator('#panel-churn')).toHaveClass(/active/);

    // 7. Churn 차트 + 인사이트 + 테이블 렌더링 확인
    await expect(page.locator('#riskChart')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#insightsContainer')).not.toBeEmpty();
    await expect(page.locator('#riskTableContainer')).not.toBeEmpty();

    // 8. Export PDF 버튼 존재 확인
    await expect(page.locator('#generateReportBtn')).toBeVisible();
  });

  test('CSV 파일 업로드 → 분석 완료', async ({ page }) => {
    await page.goto('/');

    // 파일 업로드
    const fileInput = page.locator('#csvUpload');
    await fileInput.setInputFiles(
      path.resolve('public/sample_cohort_data.csv')
    );

    // 분석 완료 대기
    await expect(page.locator('#resultsArea')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#statCohorts')).not.toHaveText('—');
  });
});
