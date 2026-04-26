# Implementation Notes

## Current Shape of Types (from `src/types.ts`)
- **ScanResult**: `{ fileName, rowCount, columnCount, fileSize, sensitiveAttributeCount, fairScanScore, metrics, severityCounts, slices, explanations, fixes, impactStory }`
- **BiasSlice**: `{ id, slice, metric, value, threshold, severity, intersectional }`
- **DatasetColumn**: `{ name, sampleValues, dataType, role, autoDetected }`

## ResultsView Props
`ResultsView` currently expects:
`{ onNewAudit: () => void }`

## mockData.ts Exports
- `mockColumns: DatasetColumn[]`
- `mockSlices: BiasSlice[]`
- `mockMetrics: MetricSummary[]`
- `mockExplanations: Explanation[]`
- `mockFixes: FixRecommendation[]`
- `mockScanResult: ScanResult`
