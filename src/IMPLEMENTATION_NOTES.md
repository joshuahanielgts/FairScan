# FairScan — Implementation Notes

## Audit Findings (Task 0)

### Current Duplicate Type Names in types.ts
- `BiasSlice`: Defined at line 15 (flat) and line 109 (nested).
- `FixRecommendation`: Defined at line 39 and line 126.
- `ScanResult`: Defined at line 47 and line 134.
- `AppView`: Defined at line 62.
- `Severity`: Defined at line 1.
- `ColumnRole`: Defined at line 3.
- `DataType`: Defined at line 5.

### Current Gemini Model String
- `geminiClient.ts`: `gemini-2.5-flash` (line 19)

### View/Route Management
- Managed via `useState` in `src/routes/index.tsx`.
- Current view state type: `AppView | "textResults"`.

### ScanResult Shape Expected by ResultsView
- `fairscanScore` (derived from `slices`)
- `riskLevel`
- `slices` (nested with `metrics[]`, `worstMetric`, `groupStats`)
- `overallStats` (`criticalCount`, `highCount`, `mediumCount`, `lowCount`, `totalSlices`)
- `geminiAnalysisComplete`
- `filename`, `rowCount`, `sensitiveColumns`

---
