# PR Summary

## Title
Stabilize cohort/churn math, harden UI rendering, sync worker locale, and optimize bundles

## Date
2026-02-17

## Scope
- Fix high-impact analysis correctness issues.
- Remove XSS vectors in HTML-rendered UI blocks.
- Prevent invalid A/B simulation states (`NaN` propagation).
- Keep worker-generated text aligned with selected locale.
- Reduce build chunk size to remove Vite >500k warning.
- Add profiling automation and baseline metrics.

## Key Fixes
1. Cohort week calculation timezone fix
- Replaced `new Date('yyyy-MM-dd')` parsing with `parseISO()` for cohort keys.
- Prevents off-by-one week classification in non-UTC environments.

2. Churn consistency metric fix
- Reworked `consecutiveInactiveWeeks` to use trailing inactivity from current week.
- Previous logic effectively returned `0` for most active users.

3. XSS hardening
- Added HTML escaping for status messages, validation lists, risk user table, and insights card fields.
- Protects against malicious CSV payload rendering.

4. A/B simulation input safety
- Added UI-level guards for invalid week/params.
- Added simulation-level finite-value validation.
- Returns `null` for invalid inputs instead of generating broken `NaN` outputs.

5. Worker locale synchronization
- Added `SET_LOCALE` message handling in worker.
- Main thread now syncs locale on init and on `locale-change`.
- Analysis payload now carries `{ rows, locale }`.

6. Build chunk optimization
- Replaced static manual chunk map with function-based splitting:
  - `jspdf` chunk
  - `html2canvas` chunk
  - shared `vendor` chunk
- Removed large-chunk warning in production build.

## Files Changed (Highlights)
- `src/core/cohortAnalysis.js`
- `src/core/churnAnalysis.js`
- `src/core/abTestSimulation.js`
- `src/core/analysisWorker.js`
- `src/main.js`
- `src/ui/helpers.js`
- `src/visualization/churnVisualization.js`
- `src/i18n/en.js`
- `src/i18n/ko.js`
- `vite.config.js`
- `scripts/profile-performance.mjs`
- `docs/performance-profile.json`

## Test & Build Verification
- `npm run test` -> 107 passed
- `npm run build` -> success (chunk warning removed)
- `npm run test:e2e` -> 2 passed

## Performance Profiling (Production Preview)
Source: `docs/performance-profile.json`

- Initial load: `860.53 ms`
- Sample analyze + retention render: `494.84 ms`
- Churn tab render: `268.86 ms`
- LTV tab render: `270.57 ms`
- A/B tab prepare: `193.31 ms`
- A/B simulation + render: `239.64 ms`
- Interactive flow subtotal: `1467.22 ms`

Memory snapshots (JS heap):
- After initial load: `2.72 MB`
- After retention render: `6.45 MB`
- After churn render: `7.34 MB`
- After LTV render: `6.78 MB`
- After A/B render: `8.52 MB`

## Reproduce Profiling
```bash
npm run build
node scripts/profile-performance.mjs
```

The script writes output to:
- `docs/performance-profile.json`
