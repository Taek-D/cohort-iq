// i18n/ko.js — Korean translations
export default {
  // Header
  'header.source': 'Source',

  // Upload
  'upload.title': 'CSV \uc5c5\ub85c\ub4dc',
  'upload.dragDrop': '\ub610\ub294 \ub4dc\ub798\uadf8 \uc564 \ub4dc\ub86d',
  'upload.requiredCols': 'user_id \u00b7 signup_date \u00b7 event_date',
  'upload.trySample': '\uc0d8\ud50c \uccb4\ud5d8',

  // Stats
  'stats.cohorts': '\ucf54\ud638\ud2b8',
  'stats.users': '\uc0ac\uc6a9\uc790',
  'stats.dataPoints': '\ub370\uc774\ud130 \ud3ec\uc778\ud2b8',
  'stats.processed': '\ucc98\ub9ac \uc2dc\uac04',

  // Tabs
  'tabs.retention': '\ub9ac\ud150\uc158',
  'tabs.churn': '\uc774\ud0c8 \uc704\ud5d8',
  'tabs.ltv': 'LTV',

  // Panel titles
  'panel.retentionHeatmap': '\ub9ac\ud150\uc158 \ud788\ud2b8\ub9f5',
  'panel.cohortTrend': '\ucf54\ud638\ud2b8 \ud2b8\ub80c\ub4dc',
  'panel.riskSegments': '\uc704\ud5d8 \uc138\uadf8\uba3c\ud2b8',
  'panel.insights': '\uc778\uc0ac\uc774\ud2b8',
  'panel.highRiskUsers': '\uace0\uc704\ud5d8 \uc0ac\uc6a9\uc790',
  'panel.exportPdf': 'PDF \ub0b4\ubcf4\ub0b4\uae30',
  'panel.cohortLtv': '\ucf54\ud638\ud2b8 LTV',
  'panel.ltvTrend': 'LTV \ud2b8\ub80c\ub4dc',
  'panel.cohortComparison': '\ucf54\ud638\ud2b8 \ube44\uad50',

  // LTV controls
  'ltv.arpuLabel': 'ARPU (\uc8fc\uac04)',
  'ltv.recalculate': '\uc7ac\uacc4\uc0b0',

  // Chart labels
  'chart.retentionPct': '\ub9ac\ud150\uc158\uc728',
  'chart.week': '\uc8fc\ucc28',
  'chart.cohort': '\ucf54\ud638\ud2b8',
  'chart.retention': '\ub9ac\ud150\uc158',
  'chart.active': '\ud65c\uc131',
  'chart.observedLtv': '\uad00\uce21 LTV',
  'chart.projectedLtv': '\uc608\uce21 LTV',
  'chart.ltv': 'LTV',
  'chart.confidence': '\uc2e0\ub8b0\ub3c4',
  'chart.observedWeeks': '\uad00\uce21',
  'chart.totalWeeks': '\uc804\uccb4',
  'chart.cohortSize': '\ucf54\ud638\ud2b8 \uc778\uc6d0',

  // Risk chart labels
  'chart.critical': '\uc2ec\uac01',
  'chart.high': '\ub192\uc74c',
  'chart.medium': '\ubcf4\ud1b5',
  'chart.low': '\ub0ae\uc74c',
  'chart.users': '\uba85',

  // Table headers
  'table.userId': '\uc0ac\uc6a9\uc790 ID',
  'table.cohort': '\ucf54\ud638\ud2b8',
  'table.risk': '\uc704\ud5d8\ub3c4',
  'table.score': '\uc810\uc218',
  'table.lastActive': '\ub9c8\uc9c0\ub9c9 \ud65c\ub3d9',
  'table.activity': '\ud65c\ub3d9\ub960',
  'table.size': '\uc778\uc6d0',
  'table.observed': '\uad00\uce21',
  'table.projected': '\uc608\uce21',
  'table.weeks': '\uae30\uac04(\uc8fc)',
  'table.conf': '\uc2e0\ub8b0\ub3c4',

  // LTV summary bar
  'ltv.avgLtv': '\ud3c9\uade0 LTV',
  'ltv.median': '\uc911\uc559\uac12',
  'ltv.revenue': '\uc608\uc0c1 \ub9e4\ucd9c',
  'ltv.improving': '\u2191 \uc0c1\uc2b9',
  'ltv.declining': '\u2193 \ud558\ub77d',
  'ltv.stable': '\u2192 \uc720\uc9c0',
  'ltv.best': '\ucd5c\uace0',
  'ltv.worst': '\ucd5c\uc800',
  'ltv.noData': 'LTV \ub370\uc774\ud130\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.',

  // Insight cards
  'insight.noInsights': '\uc0dd\uc131\ub41c \uc778\uc0ac\uc774\ud2b8\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.',
  'insight.users': '\uba85',

  // Status messages
  'status.readingFile': '\ud30c\uc77c \uc77d\ub294 \uc911...',
  'status.readFailed': '\ud30c\uc77c \uc77d\uae30 \uc2e4\ud328',
  'status.loadingSample': '\uc0d8\ud50c \ub370\uc774\ud130 \ub85c\ub529 \uc911...',
  'status.sampleLoadFailed':
    '\uc0d8\ud50c \ub370\uc774\ud130\ub97c \ubd88\ub7ec\uc62c \uc218 \uc5c6\uc2b5\ub2c8\ub2e4.',
  'status.analyzing': '\ubd84\uc11d \uc911...',
  'status.analysisComplete': '\ubd84\uc11d \uc644\ub8cc',
  'status.analysisError': '\ubd84\uc11d \uc911 \uc624\ub958\uac00 \ubc1c\uc0dd\ud588\uc2b5\ub2c8\ub2e4: {{error}}',
  'status.workerError':
    '\ubd84\uc11d \uc6cc\ucee4\uc5d0\uc11c \uc2ec\uac01\ud55c \uc624\ub958\uac00 \ubc1c\uc0dd\ud588\uc2b5\ub2c8\ub2e4.',
  'status.systemError': '\uc2dc\uc2a4\ud15c \uc624\ub958 \ubc1c\uc0dd: {{message}}',
  'status.csvParseError': 'CSV \ud30c\uc2f1 \uc624\ub958: {{message}}',
  'status.noValidData':
    '\uc720\ud6a8\ud55c \ub370\uc774\ud130\uac00 \uc5c6\uc2b5\ub2c8\ub2e4. CSV \ud30c\uc77c\uc744 \ud655\uc778\ud574\uc8fc\uc138\uc694.',
  'status.validationComplete':
    '\ub370\uc774\ud130 \uac80\uc99d \uc644\ub8cc \u2014 \uc720\ud6a8: {{valid}}\ud589{{users}}',
  'status.usersSuffix': ' (\uc0ac\uc6a9\uc790: {{count}}\uba85)',
  'status.renderError': '\ub80c\ub354\ub9c1 \uc624\ub958: {{message}}',
  'status.noAnalysisResult': '\ubd84\uc11d \uacb0\uacfc\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.',
  'status.reportError': '\ub9ac\ud3ec\ud2b8 \uc0dd\uc131 \uc624\ub958: {{message}}',
  'status.generating': '\uc0dd\uc131 \uc911...',

  // Validation messages
  'validation.emptyData': '\ub370\uc774\ud130\uac00 \ube44\uc5b4\uc788\uc2b5\ub2c8\ub2e4.',
  'validation.missingColumns':
    '필수 컬럼이 누락되었습니다: {{columns}}',
  'validation.missingUserId': 'user_id \ub204\ub77d (\ud544\uc218)',
  'validation.invalidSignupDate':
    "\uac00\uc785\uc77c(signup_date) \ud615\uc2dd \uc624\ub958: '{{value}}' (YYYY-MM-DD \ud615\uc2dd \uad8c\uc7a5)",
  'validation.futureSignupDate':
    "\uac00\uc785\uc77c\uc774 \ubbf8\ub798\uc758 \ub0a0\uc9dc\uc785\ub2c8\ub2e4: '{{value}}'",
  'validation.invalidEventDate':
    "\ud65c\ub3d9\uc77c(event_date) \ud615\uc2dd \uc624\ub958: '{{value}}' (YYYY-MM-DD \ud615\uc2dd \uad8c\uc7a5)",
  'validation.futureEventDate':
    "\ud65c\ub3d9\uc77c\uc774 \ubbf8\ub798\uc758 \ub0a0\uc9dc\uc785\ub2c8\ub2e4: '{{value}}'",
  'validation.eventBeforeSignup':
    '\ub370\uc774\ud130 \ub17c\ub9ac \uc624\ub958: \ud65c\ub3d9\uc77c\uc774 \uac00\uc785\uc77c\ubcf4\ub2e4 \ube60\ub985\ub2c8\ub2e4 ({{signup}} > {{event}})',
  'validation.row': '\ud589 {{index}}: {{errors}}',
  'validation.tooFewUsers':
    '\uc0ac\uc6a9\uc790 \uc218\uac00 \ub108\ubb34 \uc801\uc2b5\ub2c8\ub2e4 ({{count}}\uba85). \ucf54\ud638\ud2b8 \ubd84\uc11d \uacb0\uacfc\uac00 \uc720\uc758\ubbf8\ud558\uc9c0 \uc54a\uc744 \uc218 \uc788\uc2b5\ub2c8\ub2e4.',
  'validation.singleUser':
    '\ub2e8\uc77c \uc0ac\uc6a9\uc790\uc758 \ub370\uc774\ud130\uc785\ub2c8\ub2e4. \uc77c\ubc18\uc801\uc778 \ucf54\ud638\ud2b8 \ubd84\uc11d\ubcf4\ub2e4\ub294 \uac1c\ubcc4 \ud65c\ub3d9 \ub85c\uadf8\uc5d0 \uac00\uae5d\uc2b5\ub2c8\ub2e4.',
  'validation.fileTooLarge':
    '\ud30c\uc77c\uc774 \ub108\ubb34 \ud07d\ub2c8\ub2e4. \ucd5c\ub300 {{max}}\ud589\uae4c\uc9c0 \uc9c0\uc6d0\ub429\ub2c8\ub2e4. (\ud604\uc7ac: {{count}}\ud589)',

  // Validation UI
  'validation.dataError': '\ub370\uc774\ud130 \uc624\ub958',
  'validation.dataWarning': '\ub370\uc774\ud130 \uacbd\uace0',
  'validation.andMore': '\uc678 {{count}}\uac74',
  'validation.csvOnly': 'CSV \ud30c\uc77c\ub9cc \uc5c5\ub85c\ub4dc \uac00\ub2a5\ud569\ub2c8\ub2e4.',

  // Churn insights
  'insight.criticalTitle':
    '\uc989\uc2dc \uc870\uce58 \ud544\uc694: {{count}}\uba85\uc758 \uc0ac\uc6a9\uc790\uac00 \uc774\ud0c8 \uc704\ud5d8',
  'insight.criticalDesc':
    '\uc804\uccb4 \uc0ac\uc6a9\uc790\uc758 {{pct}}%\uac00 \uc2ec\uac01\ud55c \uc774\ud0c8 \uc704\ud5d8 \uc0c1\ud0dc\uc785\ub2c8\ub2e4.',
  'insight.criticalAction':
    '\uc7ac\ucc38\uc5ec \uce94\ud398\uc778 (\uc774\uba54\uc77c, \ud478\uc2dc \uc54c\ub9bc) \uc989\uc2dc \uc2e4\ud589\uc744 \uad8c\uc7a5\ud569\ub2c8\ub2e4.',
  'insight.highTitle':
    '{{count}}\uba85\uc758 \uc0ac\uc6a9\uc790\uac00 \uc774\ud0c8 \uac00\ub2a5\uc131 \ub192\uc74c',
  'insight.highDesc':
    '{{pct}}%\uc758 \uc0ac\uc6a9\uc790\uac00 \ud65c\ub3d9\uc774 \uac10\uc18c\ud558\uace0 \uc788\uc2b5\ub2c8\ub2e4.',
  'insight.highAction':
    '\ud0c0\uac9f \ud504\ub85c\ubaa8\uc158 \ub610\ub294 \uae30\ub2a5 \ucd94\ucc9c\uc744 \ud1b5\ud574 \uc7ac\ucc38\uc5ec\ub97c \uc720\ub3c4\ud558\uc138\uc694.',
  'insight.healthLowTitle': '\uc804\uccb4 \uc0ac\uc6a9\uc790 \uac74\uac15\ub3c4 \ub0ae\uc74c',
  'insight.healthLowDesc':
    '{{pct}}%\uc758 \uc0ac\uc6a9\uc790\uac00 \uc704\ud5d8 \uc0c1\ud0dc\uc785\ub2c8\ub2e4.',
  'insight.healthLowAction':
    '\uc81c\ud488 \uacbd\ud5d8 \uac1c\uc120 \ubc0f \uc628\ubcf4\ub529 \ud504\ub85c\uc138\uc2a4 \uc810\uac80\uc774 \ud544\uc694\ud569\ub2c8\ub2e4.',
  'insight.healthGoodTitle': '\uc0ac\uc6a9\uc790 \uac74\uac15\ub3c4 \uc591\ud638',
  'insight.healthGoodDesc':
    '{{pct}}%\uc758 \uc0ac\uc6a9\uc790\uac00 \uac74\uac15\ud55c \ud65c\ub3d9 \ud328\ud134\uc744 \ubcf4\uc785\ub2c8\ub2e4.',
  'insight.healthGoodAction':
    '\ud604\uc7ac \uc804\ub7b5\uc744 \uc720\uc9c0\ud558\uba74\uc11c Medium \uc704\ud5d8 \uc0ac\uc6a9\uc790\uc5d0 \uc9d1\uc911\ud558\uc138\uc694.',
  'insight.worstCohortTitle':
    '{{cohort}} \ucf54\ud638\ud2b8 \uc9d1\uc911 \uad00\ub9ac \ud544\uc694',
  'insight.worstCohortDesc':
    '\ud574\ub2f9 \ucf54\ud638\ud2b8\uc758 {{pct}}%\uac00 \uc704\ud5d8 \uc0c1\ud0dc\uc785\ub2c8\ub2e4.',
  'insight.worstCohortAction':
    '\uc774 \ucf54\ud638\ud2b8\uc758 \uc628\ubcf4\ub529 \uacbd\ud5d8\uc744 \uc7ac\uac80\ud1a0\ud558\uace0 \uac1c\uc120\ud558\uc138\uc694.',

  // Summary / PDF
  'summary.title': 'Executive Summary',
  'summary.subtitle': '\ucf54\ud638\ud2b8 \ub9ac\ud150\uc158 & \uc774\ud0c8 \ubd84\uc11d \ub9ac\ud3ec\ud2b8',
  'summary.generatedAt': '\uc0dd\uc131\uc77c: {{date}}',
  'summary.analysisPeriod': '\ubd84\uc11d \uae30\uac04',
  'summary.totalCohorts': '\ucd1d \ucf54\ud638\ud2b8',
  'summary.startDate': '\uc2dc\uc791\uc77c',
  'summary.endDate': '\uc885\ub8cc\uc77c',
  'summary.overallHealth': '\uc804\uccb4 \uac74\uac15\ub3c4',
  'summary.grade': '{{grade}} \ub4f1\uae09',
  'summary.retentionTrend': '\ub9ac\ud150\uc158 \ucd94\uc774',
  'summary.churnRisk': '\uc774\ud0c8 \uc704\ud5d8',
  'summary.criticalRisk': '\uc2ec\uac01 \uc704\ud5d8',
  'summary.highRisk': '\ub192\uc740 \uc704\ud5d8',
  'summary.persons': '{{count}}\uba85',
  'summary.ltvPrediction': 'LTV \uc608\uce21',
  'summary.avgLtv': '\ud3c9\uade0 LTV',
  'summary.bestCohort': '\ucd5c\uace0 \ucf54\ud638\ud2b8',
  'summary.worstCohort': '\ucd5c\uc800 \ucf54\ud638\ud2b8',
  'summary.keyInsights': '\uc8fc\uc694 \uc778\uc0ac\uc774\ud2b8 & \uc2e4\ud589 \uc870\uce58',
  'summary.recommendedAction': '\ucd94\ucc9c \uc870\uce58: {{action}}',
  'summary.affected': '\uc601\ud5a5: {{count}}\uba85',
  'summary.footer': '\ubd84\uc11d \uc18c\uc694 \uc2dc\uac04: {{duration}}ms',
  'summary.gradeA': '\uc6b0\uc218',
  'summary.gradeB': '\uc591\ud638',
  'summary.gradeC': '\uc8fc\uc758',
  'summary.gradeD': '\uc704\ud5d8',

  // PDF modal
  'pdf.preview': 'PDF \ubbf8\ub9ac\ubcf4\uae30',
  'pdf.download': 'PDF \ub2e4\uc6b4\ub85c\ub4dc',
  'pdf.close': '\ub2eb\uae30',
  'pdf.generating': '\uc0dd\uc131 \uc911...',
  'pdf.done': '\uc644\ub8cc!',
  'pdf.error': '\uc624\ub958 \ubc1c\uc0dd',
};
