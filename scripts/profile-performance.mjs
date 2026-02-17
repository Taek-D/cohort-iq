import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';
import { chromium } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const outputPath = path.join(projectRoot, 'docs', 'performance-profile.json');
const previewUrl = 'http://127.0.0.1:4173';

function nowIso() {
  return new Date().toISOString();
}

function hrMillis(start) {
  return Number(process.hrtime.bigint() - start) / 1_000_000;
}

async function waitForServer(url, timeoutMs = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // server is not ready yet
    }
    await sleep(300);
  }
  throw new Error(`Preview server did not start within ${timeoutMs}ms`);
}

function metricValue(metrics, name) {
  return metrics.find((m) => m.name === name)?.value ?? null;
}

async function getMemorySnapshot(cdp) {
  const { metrics } = await cdp.send('Performance.getMetrics');
  const used = metricValue(metrics, 'JSHeapUsedSize');
  const total = metricValue(metrics, 'JSHeapTotalSize');

  return {
    usedJsHeapMB:
      typeof used === 'number' ? Number((used / (1024 * 1024)).toFixed(2)) : null,
    totalJsHeapMB:
      typeof total === 'number' ? Number((total / (1024 * 1024)).toFixed(2)) : null,
  };
}

async function stopPreview(preview) {
  if (preview.exitCode !== null) return;

  preview.kill();
  try {
    await Promise.race([once(preview, 'exit'), sleep(3000)]);
  } catch {
    // ignore
  }

  if (preview.exitCode !== null) return;

  if (process.platform === 'win32' && preview.pid) {
    spawn('taskkill', ['/pid', String(preview.pid), '/t', '/f'], {
      stdio: 'ignore',
    });
  } else {
    preview.kill('SIGKILL');
  }
}

async function main() {
  const preview = spawn('npm run preview -- --port 4173 --host 127.0.0.1', {
    cwd: projectRoot,
    shell: true,
    stdio: 'pipe',
  });

  let previewLogs = '';
  preview.stdout.on('data', (chunk) => {
    previewLogs += chunk.toString();
  });
  preview.stderr.on('data', (chunk) => {
    previewLogs += chunk.toString();
  });

  try {
    await waitForServer(previewUrl, 40_000);

    const browser = await chromium.launch({
      headless: true,
      args: ['--enable-precise-memory-info'],
    });

    const page = await browser.newPage();
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Performance.enable');

    const profile = {
      profiledAt: nowIso(),
      environment: {
        mode: 'production preview',
        url: previewUrl,
      },
      timingsMs: {},
      memory: {},
    };

    const navStart = process.hrtime.bigint();
    await page.goto(previewUrl, { waitUntil: 'networkidle' });
    profile.timingsMs.initialLoad = Number(hrMillis(navStart).toFixed(2));
    profile.memory.afterInitialLoad = await getMemorySnapshot(cdp);

    const analyzeStart = process.hrtime.bigint();
    await page.click('#loadSample');
    await page.locator('#resultsArea').waitFor({ state: 'visible', timeout: 15_000 });
    await page.locator('#statCohorts').waitFor({ state: 'visible', timeout: 5_000 });
    await page.waitForTimeout(250);
    profile.timingsMs.sampleAnalyzeAndRetentionRender = Number(
      hrMillis(analyzeStart).toFixed(2)
    );
    profile.memory.afterRetentionRender = await getMemorySnapshot(cdp);

    const churnStart = process.hrtime.bigint();
    await page.click('[data-tab="churn"]');
    await page.locator('#riskChart').waitFor({ state: 'visible', timeout: 8_000 });
    await page.locator('#riskTableContainer tbody tr').first().waitFor({
      state: 'visible',
      timeout: 8_000,
    });
    await page.waitForTimeout(200);
    profile.timingsMs.churnTabRender = Number(hrMillis(churnStart).toFixed(2));
    profile.memory.afterChurnRender = await getMemorySnapshot(cdp);

    const ltvStart = process.hrtime.bigint();
    await page.click('[data-tab="ltv"]');
    await page.locator('#ltvBarChart').waitFor({ state: 'visible', timeout: 8_000 });
    await page.locator('#ltvTableContainer tbody tr').first().waitFor({
      state: 'visible',
      timeout: 8_000,
    });
    await page.waitForTimeout(200);
    profile.timingsMs.ltvTabRender = Number(hrMillis(ltvStart).toFixed(2));
    profile.memory.afterLtvRender = await getMemorySnapshot(cdp);

    const abTabStart = process.hrtime.bigint();
    await page.click('[data-tab="abtest"]');
    await page.locator('#abtestWeekSelect').waitFor({ state: 'visible', timeout: 8_000 });
    await page.waitForTimeout(150);
    profile.timingsMs.abTabPrepare = Number(hrMillis(abTabStart).toFixed(2));

    const abRunStart = process.hrtime.bigint();
    await page.click('#runABTest');
    await page.locator('#abtestResults').waitFor({ state: 'visible', timeout: 8_000 });
    await page.locator('#abtestResultCards .abtest-result-card').first().waitFor({
      state: 'visible',
      timeout: 8_000,
    });
    await page.waitForTimeout(200);
    profile.timingsMs.abSimulationAndRender = Number(hrMillis(abRunStart).toFixed(2));
    profile.memory.afterAbRender = await getMemorySnapshot(cdp);

    const totalFlow =
      profile.timingsMs.sampleAnalyzeAndRetentionRender +
      profile.timingsMs.churnTabRender +
      profile.timingsMs.ltvTabRender +
      profile.timingsMs.abTabPrepare +
      profile.timingsMs.abSimulationAndRender;
    profile.timingsMs.endToEndInteractiveFlow = Number(totalFlow.toFixed(2));

    await browser.close();

    await fs.writeFile(outputPath, `${JSON.stringify(profile, null, 2)}\n`, 'utf-8');
    console.log(`Performance profile written to ${outputPath}`);
    console.log(JSON.stringify(profile, null, 2));
  } catch (error) {
    console.error(error);
    if (previewLogs) {
      console.error('\n[preview logs]\n');
      console.error(previewLogs);
    }
    process.exitCode = 1;
  } finally {
    await stopPreview(preview);
  }
}

await main();
process.exit(process.exitCode ?? 0);
