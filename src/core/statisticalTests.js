// statisticalTests.js — Pure JS statistical tests for cohort analysis
// Chi-Square, Kaplan-Meier, Log-Rank — no external dependencies

/**
 * Incomplete upper gamma function via series expansion.
 * P(a, x) = gamma_lower(a,x) / Gamma(a)
 * We compute Q(a,x) = 1 - P(a,x) for the chi-square p-value.
 * @param {number} a - shape parameter (df/2)
 * @param {number} x - value (chi2/2)
 * @returns {number} Q(a,x) — upper tail probability
 */
function gammaq(a, x) {
  if (x < 0) return 1;
  if (x === 0) return 1;

  // Use series for x < a+1, continued fraction otherwise
  if (x < a + 1) {
    return 1 - gammapSeries(a, x);
  }
  return gammaqCF(a, x);
}

/** Lower regularised gamma via series: P(a,x) */
function gammapSeries(a, x) {
  const lnGamma = lnGammaFunc(a);
  let sum = 1 / a;
  let term = 1 / a;
  for (let n = 1; n < 200; n++) {
    term *= x / (a + n);
    sum += term;
    if (Math.abs(term) < Math.abs(sum) * 1e-14) break;
  }
  return sum * Math.exp(-x + a * Math.log(x) - lnGamma);
}

/** Upper regularised gamma via continued fraction (modified Lentz): Q(a,x) */
function gammaqCF(a, x) {
  const lnGam = lnGammaFunc(a);
  let b = x + 1 - a;
  let c = 1 / 1e-30;
  let d = 1 / b;
  let h = d;

  for (let i = 1; i <= 200; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = b + an / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 3e-14) break;
  }

  return Math.exp(-x + a * Math.log(x) - lnGam) * h;
}

/** Lanczos approximation for ln(Gamma(z)) */
function lnGammaFunc(z) {
  const g = 7;
  const coef = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];

  if (z < 0.5) {
    // Reflection formula: Gamma(z)*Gamma(1-z) = pi/sin(pi*z)
    return (
      Math.log(Math.PI / Math.sin(Math.PI * z)) - lnGammaFunc(1 - z)
    );
  }

  z -= 1;
  let x = coef[0];
  for (let i = 1; i < g + 2; i++) {
    x += coef[i] / (z + i);
  }
  const tt = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(tt) - tt + Math.log(x);
}

/**
 * Chi-Square p-value from statistic and degrees of freedom.
 * P(X > chi2) using the upper regularised gamma function.
 * @param {number} chi2 - chi-square statistic
 * @param {number} df - degrees of freedom
 * @returns {number} p-value
 */
export function chi2pValue(chi2, df) {
  if (df <= 0 || chi2 < 0) return 1;
  return gammaq(df / 2, chi2 / 2);
}

/**
 * Chi-Square test of independence: cohort vs churn risk level.
 *
 * Builds a contingency table of cohort (rows) x risk level (columns)
 * and computes the chi-square statistic.
 *
 * @param {Object} cohortInfo - from analyzeCohort: { cohorts: Map }
 * @param {Array} churnRiskData - from analyzeChurn: [{userId, cohort, riskLevel, ...}]
 * @returns {Object} { chi2, df, pValue, significant, contingencyTable, expected }
 */
export function chiSquareTest(cohortInfo, churnRiskData) {
  if (!churnRiskData || churnRiskData.length === 0) {
    return { chi2: 0, df: 0, pValue: 1, significant: false, contingencyTable: [], expected: [] };
  }

  const riskLevels = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  // Get cohort labels sorted
  const cohortLabels = cohortInfo.cohorts
    ? [...cohortInfo.cohorts.keys()].sort()
    : [...new Set(churnRiskData.map((d) => d.cohort))].sort();

  const nRows = cohortLabels.length;
  const nCols = riskLevels.length;

  if (nRows < 2) {
    return { chi2: 0, df: 0, pValue: 1, significant: false, contingencyTable: [], expected: [] };
  }

  // Build observed contingency table
  const observed = Array.from({ length: nRows }, () => new Array(nCols).fill(0));

  churnRiskData.forEach((user) => {
    const rowIdx = cohortLabels.indexOf(user.cohort);
    const colIdx = riskLevels.indexOf(user.riskLevel);
    if (rowIdx >= 0 && colIdx >= 0) {
      observed[rowIdx][colIdx]++;
    }
  });

  // Row and column totals
  const rowTotals = observed.map((row) => row.reduce((s, v) => s + v, 0));
  const colTotals = new Array(nCols).fill(0);
  observed.forEach((row) => row.forEach((v, j) => { colTotals[j] += v; }));
  const grandTotal = rowTotals.reduce((s, v) => s + v, 0);

  if (grandTotal === 0) {
    return { chi2: 0, df: 0, pValue: 1, significant: false, contingencyTable: observed, expected: [] };
  }

  // Expected frequencies
  const expected = Array.from({ length: nRows }, (_, i) =>
    Array.from({ length: nCols }, (_, j) =>
      (rowTotals[i] * colTotals[j]) / grandTotal
    )
  );

  // Chi-square statistic
  let chi2 = 0;
  for (let i = 0; i < nRows; i++) {
    for (let j = 0; j < nCols; j++) {
      const e = expected[i][j];
      if (e > 0) {
        chi2 += Math.pow(observed[i][j] - e, 2) / e;
      }
    }
  }

  // Degrees of freedom: (rows-1)*(cols-1), but remove empty rows/cols
  const nonEmptyRows = rowTotals.filter((t) => t > 0).length;
  const nonEmptyCols = colTotals.filter((t) => t > 0).length;
  const df = Math.max(0, (nonEmptyRows - 1) * (nonEmptyCols - 1));

  const pValue = df > 0 ? chi2pValue(chi2, df) : 1;

  return {
    chi2: Math.round(chi2 * 1000) / 1000,
    df,
    pValue: Math.round(pValue * 10000) / 10000,
    significant: pValue < 0.05,
    contingencyTable: observed,
    expected,
    cohortLabels,
    riskLevels,
  };
}

/**
 * Kaplan-Meier survival estimator.
 *
 * For each user, "survival time" = weeks from signup to last event.
 * Users still active at referenceDate are right-censored.
 *
 * @param {Map} userActivity - from analyzeUserActivity
 * @param {Date} referenceDate - study end date
 * @returns {Object} { survivalFunction: [{time, survival, nRisk, nEvent, nCensored}], medianSurvival }
 */
export function kaplanMeier(userActivity, referenceDate = new Date()) {
  if (!userActivity || userActivity.size === 0) {
    return { survivalFunction: [], medianSurvival: null };
  }

  // Build event/censoring table
  // "event" = churn (no activity in last 2+ weeks before referenceDate)
  // "censored" = still active
  const CHURN_THRESHOLD_WEEKS = 2;
  const subjects = [];

  userActivity.forEach((activity) => {
    const signupDate = new Date(activity.signup_date);
    const lastEvent = activity.lastEventDate
      ? new Date(activity.lastEventDate)
      : signupDate;

    // Survival time in weeks from signup to last event
    const survivalWeeks = Math.max(
      0,
      Math.floor((lastEvent - signupDate) / (7 * 24 * 60 * 60 * 1000))
    );

    // Check if user is censored (still active near reference date)
    const weeksSinceLastEvent = Math.floor(
      (referenceDate - lastEvent) / (7 * 24 * 60 * 60 * 1000)
    );
    const censored = weeksSinceLastEvent < CHURN_THRESHOLD_WEEKS;

    subjects.push({ time: survivalWeeks, event: censored ? 0 : 1 });
  });

  // Get unique time points sorted
  const times = [...new Set(subjects.map((s) => s.time))].sort((a, b) => a - b);

  // Product-Limit estimator
  let nRisk = subjects.length;
  let survival = 1.0;
  const survivalFunction = [{ time: 0, survival: 1.0, nRisk, nEvent: 0, nCensored: 0 }];

  for (const t of times) {
    const atTime = subjects.filter((s) => s.time === t);
    const nEvent = atTime.filter((s) => s.event === 1).length;
    const nCensored = atTime.filter((s) => s.event === 0).length;

    if (nEvent > 0 && nRisk > 0) {
      survival *= 1 - nEvent / nRisk;
    }

    survivalFunction.push({
      time: t,
      survival: Math.round(survival * 10000) / 10000,
      nRisk,
      nEvent,
      nCensored,
    });

    nRisk -= nEvent + nCensored;
    if (nRisk <= 0) break;
  }

  // Median survival: first time S(t) <= 0.5
  let medianSurvival = null;
  for (const point of survivalFunction) {
    if (point.survival <= 0.5) {
      medianSurvival = point.time;
      break;
    }
  }

  return { survivalFunction, medianSurvival };
}

/**
 * Log-Rank test (Mantel-Cox) comparing survival of two groups.
 *
 * Splits users into "early" (first half of cohorts) vs "late" (second half).
 *
 * @param {Map} userActivity - from analyzeUserActivity
 * @param {Array} cohortLabels - sorted cohort labels
 * @param {Date} referenceDate
 * @returns {Object} { testStatistic, pValue, significant, group1Label, group2Label }
 */
export function logRankTest(userActivity, cohortLabels, referenceDate = new Date()) {
  if (!userActivity || userActivity.size === 0 || !cohortLabels || cohortLabels.length < 2) {
    return { testStatistic: 0, pValue: 1, significant: false, group1Label: '', group2Label: '' };
  }

  const CHURN_THRESHOLD_WEEKS = 2;

  // Split cohorts into two groups
  const midpoint = Math.ceil(cohortLabels.length / 2);
  const earlyCohorts = new Set(cohortLabels.slice(0, midpoint));
  const lateCohorts = new Set(cohortLabels.slice(midpoint));

  const group1Label = `${cohortLabels[0]} ~ ${cohortLabels[midpoint - 1]}`;
  const group2Label = `${cohortLabels[midpoint]} ~ ${cohortLabels[cohortLabels.length - 1]}`;

  const buildSubjects = (cohortSet) => {
    const subjects = [];
    userActivity.forEach((activity) => {
      if (!cohortSet.has(activity.cohort)) return;
      const signupDate = new Date(activity.signup_date);
      const lastEvent = activity.lastEventDate
        ? new Date(activity.lastEventDate)
        : signupDate;
      const survivalWeeks = Math.max(
        0,
        Math.floor((lastEvent - signupDate) / (7 * 24 * 60 * 60 * 1000))
      );
      const weeksSinceLastEvent = Math.floor(
        (referenceDate - lastEvent) / (7 * 24 * 60 * 60 * 1000)
      );
      const censored = weeksSinceLastEvent < CHURN_THRESHOLD_WEEKS;
      subjects.push({ time: survivalWeeks, event: censored ? 0 : 1 });
    });
    return subjects;
  };

  const g1 = buildSubjects(earlyCohorts);
  const g2 = buildSubjects(lateCohorts);

  if (g1.length === 0 || g2.length === 0) {
    return { testStatistic: 0, pValue: 1, significant: false, group1Label, group2Label };
  }

  // Combine all unique event times
  const allSubjects = [...g1.map((s) => ({ ...s, group: 1 })), ...g2.map((s) => ({ ...s, group: 2 }))];
  const eventTimes = [...new Set(allSubjects.filter((s) => s.event === 1).map((s) => s.time))].sort(
    (a, b) => a - b
  );

  if (eventTimes.length === 0) {
    return { testStatistic: 0, pValue: 1, significant: false, group1Label, group2Label };
  }

  // Log-rank statistic
  let O1 = 0; // observed events in group 1
  let E1 = 0; // expected events in group 1
  let V = 0; // variance

  // Track at-risk counts
  let n1 = g1.length;
  let n2 = g2.length;

  // Sort subjects by time for efficient processing
  const g1Sorted = [...g1].sort((a, b) => a.time - b.time);
  const g2Sorted = [...g2].sort((a, b) => a.time - b.time);
  let g1Idx = 0;
  let g2Idx = 0;

  let prevTime = -1;

  for (const t of eventTimes) {
    // Remove subjects that exited before this time (censored or events at times < t)
    while (g1Idx < g1Sorted.length && g1Sorted[g1Idx].time < t) {
      n1--;
      g1Idx++;
    }
    while (g2Idx < g2Sorted.length && g2Sorted[g2Idx].time < t) {
      n2--;
      g2Idx++;
    }

    // Count events at this time
    const d1 = g1Sorted.filter((s) => s.time === t && s.event === 1).length;
    const d2 = g2Sorted.filter((s) => s.time === t && s.event === 1).length;
    const d = d1 + d2;
    const n = n1 + n2;

    if (n > 0 && d > 0) {
      const e1 = (n1 * d) / n;
      O1 += d1;
      E1 += e1;

      if (n > 1) {
        V += (n1 * n2 * d * (n - d)) / (n * n * (n - 1));
      }
    }

    // Remove events at this time from at-risk
    const c1AtT = g1Sorted.filter((s) => s.time === t).length;
    const c2AtT = g2Sorted.filter((s) => s.time === t).length;
    // Advance past subjects at this time
    while (g1Idx < g1Sorted.length && g1Sorted[g1Idx].time === t) {
      n1--;
      g1Idx++;
    }
    while (g2Idx < g2Sorted.length && g2Sorted[g2Idx].time === t) {
      n2--;
      g2Idx++;
    }
  }

  const testStatistic = V > 0 ? Math.pow(O1 - E1, 2) / V : 0;
  const pValue = testStatistic > 0 ? chi2pValue(testStatistic, 1) : 1;

  return {
    testStatistic: Math.round(testStatistic * 1000) / 1000,
    pValue: Math.round(pValue * 10000) / 10000,
    significant: pValue < 0.05,
    group1Label,
    group2Label,
  };
}

/**
 * Run all statistical tests on analysis results.
 *
 * @param {Array} validatedData - raw validated rows
 * @param {Object} cohortInfo - from analyzeCohort
 * @param {Object} churnResult - from analyzeChurn
 * @param {Map} [userActivity] - from analyzeUserActivity (optional, computed if absent)
 * @returns {Object} { chiSquare, kaplanMeier, logRank }
 */
export function runStatisticalTests(validatedData, cohortInfo, churnResult, userActivity) {
  // Chi-Square: cohort × risk level independence
  const chiSquare = chiSquareTest(cohortInfo, churnResult.churnRiskData);

  // Need userActivity for KM and Log-Rank
  // If not provided, we need to build it from churnAnalysis
  // But churnResult doesn't expose userActivity directly,
  // so we import analyzeUserActivity from churnAnalysis in the worker
  if (!userActivity || userActivity.size === 0) {
    return {
      chiSquare,
      kaplanMeier: { survivalFunction: [], medianSurvival: null },
      logRank: { testStatistic: 0, pValue: 1, significant: false, group1Label: '', group2Label: '' },
    };
  }

  // Reference date: latest event in dataset
  let maxDate = new Date(0);
  userActivity.forEach((activity) => {
    if (activity.lastEventDate) {
      const d = new Date(activity.lastEventDate);
      if (d > maxDate) maxDate = d;
    }
  });
  const referenceDate = maxDate > new Date(0) ? maxDate : new Date();

  // Kaplan-Meier survival curve
  const km = kaplanMeier(userActivity, referenceDate);

  // Log-Rank: early vs late cohorts
  const cohortLabels = cohortInfo.cohorts
    ? [...cohortInfo.cohorts.keys()].sort()
    : [];
  const lr = logRankTest(userActivity, cohortLabels, referenceDate);

  return {
    chiSquare,
    kaplanMeier: km,
    logRank: lr,
  };
}
