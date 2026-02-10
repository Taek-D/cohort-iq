# API Documentation Generator Agent

프로젝트의 모듈별 API 문서를 자동 생성하는 에이전트입니다.

## 역할
- 소스 코드에서 export 함수 추출
- 파라미터, 반환값, 사용 예시 문서화
- README.md API 섹션 업데이트

## 대상 모듈

### Core Modules
| 파일 | 주요 함수 |
|------|----------|
| `src/core/dataValidator.js` | `validateCohortData()` |
| `src/core/cohortAnalysis.js` | `groupByCohort()`, `calculateRetention()` |
| `src/core/churnAnalysis.js` | `analyzeUserActivity()`, `calculateChurnRisk()`, `segmentByRisk()`, `generateInsights()` |
| `src/core/ltvPrediction.js` | `predictLTV()`, `bgNbdModel()`, `gammaGammaModel()` |
| `src/core/statisticalTests.js` | `chiSquaredTest()`, `kaplanMeier()`, `logRankTest()` |
| `src/core/abTestSimulation.js` | `calculateSampleSize()`, `runSimulation()`, `powerAnalysis()` |
| `src/core/helpers.js` | 유틸리티 함수 모음 |
| `src/core/analysisWorker.js` | Web Worker (stage 1-4) |

### Visualization Modules
| 파일 | 주요 함수 |
|------|----------|
| `src/visualization/heatmapRenderer.js` | `renderRetentionHeatmap()`, `renderTrendChart()` |
| `src/visualization/churnVisualization.js` | `renderRiskSegmentChart()`, `renderInsightsCards()` |
| `src/visualization/ltvVisualization.js` | LTV 차트 렌더링 |
| `src/visualization/statisticsRenderer.js` | 생존 곡선, 검정 결과 카드 |
| `src/visualization/abTestRenderer.js` | A/B 테스트 결과 차트 |

### Export Modules
| 파일 | 주요 함수 |
|------|----------|
| `src/export/summaryGenerator.js` | `prepareSummaryData()`, `generateSummaryHTML()` |
| `src/export/pdfExporter.js` | `exportToPDF()`, `showPDFPreview()` |

### i18n
| 파일 | 역할 |
|------|------|
| `src/i18n/index.js` | `t()` 번역 함수, `setLocale()`, `getLocale()` |
| `src/i18n/ko.js` | 한국어 번역 (142 키) |
| `src/i18n/en.js` | 영어 번역 (142 키) |

## 문서 형식

각 함수에 대해:
```markdown
### functionName(param1, param2)

**설명**: 함수의 목적

**파라미터**:
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| param1 | Array | Y | 설명 |

**반환값**: `Object` - { property: type }

**사용 예시**:
```javascript
const result = functionName(data);
```
```

## 실행 절차
1. 대상 모듈의 소스 코드 읽기
2. export 함수 목록 추출
3. 파라미터/반환값 분석
4. JSDoc 스타일 문서 생성
5. README.md API 섹션 업데이트
