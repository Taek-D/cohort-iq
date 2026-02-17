// i18n/en.js — English translations
export default {
  // Header
  'header.source': 'Source',

  // Upload
  'upload.title': 'Upload CSV',
  'upload.dragDrop': 'or drag and drop',
  'upload.requiredCols': 'user_id \u00b7 signup_date \u00b7 event_date',
  'upload.trySample': 'Try sample',

  // Stats
  'stats.cohorts': 'cohorts',
  'stats.users': 'users',
  'stats.dataPoints': 'data points',
  'stats.processed': 'processed',

  // Tabs
  'tabs.retention': 'Retention',
  'tabs.churn': 'Churn Risk',
  'tabs.ltv': 'LTV',

  // Panel titles
  'panel.retentionHeatmap': 'Retention Heatmap',
  'panel.cohortTrend': 'Cohort Trend',
  'panel.riskSegments': 'Risk Segments',
  'panel.insights': 'Insights',
  'panel.highRiskUsers': 'High-Risk Users',
  'panel.exportPdf': 'Export PDF',
  'panel.cohortLtv': 'Cohort LTV',
  'panel.ltvTrend': 'LTV Trend',
  'panel.cohortComparison': 'Cohort Comparison',

  // LTV controls
  'ltv.arpuLabel': 'ARPU (Weekly)',
  'ltv.recalculate': 'Recalculate',

  // Chart labels
  'chart.retentionPct': 'Retention %',
  'chart.week': 'Week',
  'chart.cohort': 'Cohort',
  'chart.retention': 'Retention',
  'chart.active': 'Active',
  'chart.observedLtv': 'Observed LTV',
  'chart.projectedLtv': 'Projected LTV',
  'chart.ltv': 'LTV',
  'chart.confidence': 'Confidence',
  'chart.observedWeeks': 'Observed',
  'chart.totalWeeks': 'Total',
  'chart.cohortSize': 'Cohort size',

  // Risk chart labels
  'chart.critical': 'Critical',
  'chart.high': 'High',
  'chart.medium': 'Medium',
  'chart.low': 'Low',
  'chart.users': 'users',

  // Table headers
  'table.userId': 'User ID',
  'table.cohort': 'Cohort',
  'table.risk': 'Risk',
  'table.score': 'Score',
  'table.lastActive': 'Last Active',
  'table.activity': 'Activity',
  'table.size': 'Size',
  'table.observed': 'Observed',
  'table.projected': 'Projected',
  'table.weeks': 'Weeks',
  'table.conf': 'Conf.',

  // LTV summary bar
  'ltv.avgLtv': 'Avg LTV',
  'ltv.median': 'Median',
  'ltv.revenue': 'Revenue',
  'ltv.improving': '\u2191 Improving',
  'ltv.declining': '\u2193 Declining',
  'ltv.stable': '\u2192 Stable',
  'ltv.best': 'Best',
  'ltv.worst': 'Worst',
  'ltv.noData': 'No LTV data available.',

  // Insight cards
  'insight.noInsights': 'No insights generated.',
  'insight.users': 'users',

  // Status messages
  'status.readingFile': 'Reading file...',
  'status.readFailed': 'Failed to read file',
  'status.loadingSample': 'Loading sample data...',
  'status.sampleLoadFailed': 'Failed to load sample data.',
  'status.analyzing': 'Analyzing...',
  'status.analysisComplete': 'Analysis complete',
  'status.analysisError': 'Error during analysis: {{error}}',
  'status.workerError': 'A critical error occurred in the analysis worker.',
  'status.systemError': 'System error: {{message}}',
  'status.csvParseError': 'CSV parsing error: {{message}}',
  'status.noValidData': 'No valid data found. Please check your CSV file.',
  'status.validationComplete':
    'Validation complete \u2014 valid: {{valid}} rows{{users}}',
  'status.usersSuffix': ' (users: {{count}})',
  'status.renderError': 'Rendering error: {{message}}',
  'status.noAnalysisResult': 'No analysis results available.',
  'status.reportError': 'Report generation error: {{message}}',
  'status.generating': 'Generating...',
  'status.abtestInvalidWeek': 'No valid target week available for A/B test.',
  'status.abtestInvalidParams':
    'Invalid A/B test parameters. Please review the inputs.',

  // Validation messages
  'validation.emptyData': 'Data is empty.',
  'validation.missingColumns': 'Required columns are missing: {{columns}}',
  'validation.missingUserId': 'user_id is missing (required)',
  'validation.invalidSignupDate':
    "Invalid signup_date format: '{{value}}' (YYYY-MM-DD recommended)",
  'validation.futureSignupDate': "signup_date is a future date: '{{value}}'",
  'validation.invalidEventDate':
    "Invalid event_date format: '{{value}}' (YYYY-MM-DD recommended)",
  'validation.futureEventDate': "event_date is a future date: '{{value}}'",
  'validation.eventBeforeSignup':
    'Logic error: event_date is before signup_date ({{signup}} > {{event}})',
  'validation.row': 'Row {{index}}: {{errors}}',
  'validation.tooFewUsers':
    'Too few users ({{count}}). Cohort analysis results may not be meaningful.',
  'validation.singleUser':
    'Single user data. This is closer to an individual activity log than a typical cohort analysis.',
  'validation.fileTooLarge':
    'File is too large. Up to {{max}} rows are supported. (Current: {{count}} rows)',

  // Validation UI
  'validation.dataError': 'Data Errors',
  'validation.dataWarning': 'Data Warnings',
  'validation.andMore': '{{count}} more',
  'validation.csvOnly': 'Only CSV files can be uploaded.',

  // Churn insights
  'insight.criticalTitle':
    'Immediate action needed: {{count}} users at churn risk',
  'insight.criticalDesc':
    '{{pct}}% of all users are in a high churn risk state.',
  'insight.criticalAction':
    'Execute re-engagement campaign (email, push notifications) immediately.',
  'insight.highTitle': '{{count}} users have a high likelihood of churning',
  'insight.highDesc': '{{pct}}% of users are showing decreased activity.',
  'insight.highAction':
    'Encourage re-engagement through targeted promotions or feature recommendations.',
  'insight.healthLowTitle': 'Overall user health is low',
  'insight.healthLowDesc': '{{pct}}% of users are in a risk state.',
  'insight.healthLowAction':
    'Product experience improvement and onboarding process review are needed.',
  'insight.healthGoodTitle': 'User health is good',
  'insight.healthGoodDesc':
    '{{pct}}% of users show healthy activity patterns.',
  'insight.healthGoodAction':
    'Maintain current strategy while focusing on Medium risk users.',
  'insight.worstCohortTitle':
    '{{cohort}} cohort needs focused attention',
  'insight.worstCohortDesc':
    '{{pct}}% of this cohort are in a risk state.',
  'insight.worstCohortAction':
    "Review and improve this cohort's onboarding experience.",

  // Summary / PDF
  'summary.title': 'Executive Summary',
  'summary.subtitle': 'Cohort Retention & Churn Analysis Report',
  'summary.generatedAt': 'Generated: {{date}}',
  'summary.analysisPeriod': 'Analysis Period',
  'summary.totalCohorts': 'Total Cohorts',
  'summary.startDate': 'Start Date',
  'summary.endDate': 'End Date',
  'summary.overallHealth': 'Overall Health',
  'summary.grade': 'Grade {{grade}}',
  'summary.retentionTrend': 'Retention Trend',
  'summary.churnRisk': 'Churn Risk',
  'summary.criticalRisk': 'Critical Risk',
  'summary.highRisk': 'High Risk',
  'summary.persons': '{{count}}',
  'summary.ltvPrediction': 'LTV Prediction',
  'summary.avgLtv': 'Average LTV',
  'summary.bestCohort': 'Best Cohort',
  'summary.worstCohort': 'Worst Cohort',
  'summary.keyInsights': 'Key Insights & Action Items',
  'summary.recommendedAction': 'Recommended Action: {{action}}',
  'summary.affected': 'Affected: {{count}} users',
  'summary.footer': 'Analysis Time: {{duration}}ms',
  'summary.gradeA': 'Excellent',
  'summary.gradeB': 'Good',
  'summary.gradeC': 'Caution',
  'summary.gradeD': 'Critical',

  // Panel — statistics
  'panel.survivalCurve': 'Kaplan-Meier Survival Curve',
  'panel.statisticalTests': 'Statistical Tests',

  // Statistics
  'stats.survivalRate': 'Survival Rate',
  'stats.survivalPct': 'Survival Rate (%)',
  'stats.weeksFromSignup': 'Weeks from Signup',
  'stats.atRisk': 'At Risk',
  'stats.events': 'Churn Events',
  'stats.significant': 'Significant (p<0.05)',
  'stats.notSignificant': 'Not Significant',
  'stats.chiSquare': 'Chi-Square Test',
  'stats.chiSquareDesc':
    'Test of independence between cohort and churn risk level',
  'stats.chiSquareSig':
    'Churn risk distribution differs significantly across cohorts.',
  'stats.chiSquareNs':
    'No statistically significant difference in churn risk across cohorts.',
  'stats.logRank': 'Log-Rank Test',
  'stats.logRankDesc': 'Survival curve comparison: early vs late cohorts',
  'stats.testStat': 'Test Statistic',
  'stats.logRankGroups': '{{g1}} vs {{g2}}. ',
  'stats.logRankSig':
    'The two groups have significantly different survival curves.',
  'stats.logRankNs':
    'No significant difference in survival curves between the two groups.',
  'stats.medianSurvival': 'Median Survival Time',
  'stats.medianWeeks': 'Weeks',
  'stats.medianDesc': '50% of users survive until week {{weeks}}.',

  // A/B Test
  'tabs.abtest': 'A/B Test',
  'abtest.settings': 'Simulation Settings',
  'abtest.targetWeek': 'Target Week',
  'abtest.deltaRetention': 'Retention Improvement',
  'abtest.alpha': 'Significance (α)',
  'abtest.power': 'Power (1-β)',
  'abtest.arpu': 'ARPU',
  'abtest.run': 'Run Simulation',
  'abtest.retentionCompare': 'Before vs After Retention Curve',
  'abtest.powerCurve': 'Power Curve',
  'abtest.resultSummary': 'Result Summary',
  'abtest.scenarioComparison': 'Scenario Comparison',
  'abtest.requiredSample': 'Required Sample (per group)',
  'abtest.totalSample': 'Total Required Sample',
  'abtest.mde': 'Min. Detectable Effect (MDE)',
  'abtest.ltvChange': 'LTV Change',
  'abtest.ltvChangePct': 'LTV Change %',
  'abtest.monthlyRevenue': 'Monthly Revenue Impact',
  'abtest.control': 'Control (Current)',
  'abtest.treatment': 'Treatment (Improved)',
  'abtest.scenario': 'Scenario',
  'abtest.conservative': 'Conservative',
  'abtest.baseline': 'Baseline',
  'abtest.aggressive': 'Aggressive',
  'abtest.optimal': 'Optimal',
  'abtest.deltaCol': 'Δ%p',
  'abtest.sampleCol': 'N/group',
  'abtest.ltvCol': 'LTV Change',
  'abtest.roiCol': 'Monthly ROI',
  'abtest.noData':
    'Analyze CSV data first before running A/B test simulation.',
  'abtest.weekLabel': 'Week {{week}}',
  'abtest.noWeekData': 'No week data available',

  // PDF modal
  'pdf.preview': 'PDF Preview',
  'pdf.download': 'Download PDF',
  'pdf.close': 'Close',
  'pdf.generating': 'Generating...',
  'pdf.done': 'Done!',
  'pdf.error': 'Error occurred',
};
