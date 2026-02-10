---
name: cohortiq-export
description: PDF Export, Executive Summary HTML 생성, html2canvas-pro/jsPDF 사용. Use when working with PDF generation, summary reports, HTML templates, or export functionality.
---

# CohortIQ Export

## Files

### `summaryGenerator.js`
Converts cohort + churn analysis results into 1-page Executive Summary HTML.

**Functions**:
- `prepareSummaryData(cohortResult, churnResult)` → Summary data object
- `getHealthGrade(score)` → Grade (A/B/C/D) with color
- `generateSummaryHTML(summaryData)` → Complete HTML string (~22KB)

**Health Score (0-100)**:
```
retentionScore (0-50) = min(50, (week4Retention / 80) * 50)
churnScore (0-50)     = min(50, (lowRiskRatio / 60) * 50)
healthScore           = retentionScore + churnScore

A (80+): Excellent - #10b981
B (60-79): Good - #3b82f6
C (40-59): Warning - #f59e0b
D (0-39): Critical - #ef4444
```

### `pdfExporter.js`
HTML → Canvas → PDF conversion pipeline.

**Functions**:
- `exportToPDF(htmlString, filename)` → PDF file download
- `showPDFPreview(htmlString)` → Modal popup preview

**Pipeline**:
```javascript
// 1. Create temp DOM container
const container = document.createElement('div');
container.innerHTML = htmlString;
document.body.appendChild(container);

// 2. Capture with html2canvas-pro (oklch support)
const canvas = await html2canvas(container, {
  scale: 2, useCORS: true, backgroundColor: '#ffffff'
});

// 3. Generate PDF
const pdf = new jsPDF('p', 'mm', 'a4');
pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297);
pdf.save(filename);

// 4. Cleanup
document.body.removeChild(container);
```

## Key Notes
1. Use `html2canvas-pro` (NOT `html2canvas`) — oklch color support for Tailwind v4
2. jsPDF requires font embedding for Korean text
3. Maintain A4 ratio: 210mm x 297mm
4. Use `scale: 2` minimum for print quality
5. Always remove temp DOM container (prevent memory leaks)
6. i18n: Summary HTML supports both ko/en via `t()` function
