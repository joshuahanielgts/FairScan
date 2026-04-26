// ─── View State ────────────────────────────────────────────────────────────

export type AppView =
  | "landing"
  | "upload"
  | "configure"
  | "scanning"
  | "results"
  | "text-results";

export type Severity = "critical" | "high" | "medium" | "low";
export type ColumnRole = "sensitive" | "outcome" | "ignore";
export type DataType = "numeric" | "categorical" | "text" | "unknown";

// ─── CSV / Column types ─────────────────────────────────────────────────────

export interface CSVRow {
  [key: string]: string;
}

export interface ColumnMeta {
  name: string;
  type: DataType;
  uniqueValues: string[];
  sampleValues: string[];
  nullCount: number;
  isAutoDetectedSensitive: boolean;
  role: ColumnRole;
}

// ─── Fairness Metric types ──────────────────────────────────────────────────

export type MetricName =
  | "disparate_impact"
  | "demographic_parity_gap"
  | "equalized_odds_gap"
  | "equal_opportunity_gap"
  | "representation_imbalance"
  | "label_skew";

export interface FairnessMetric {
  metricName: MetricName;
  value: number;
  threshold: number;
  passed: boolean;
  groupA: string;
  groupB: string;
}

export interface GroupStats {
  groupName: string;
  count: number;
  positiveCount: number;
  positiveRate: number;
  truePositiveRate?: number;
  falsePositiveRate?: number;
  falseNegativeRate?: number;
}

// ─── Fix Recommendation ─────────────────────────────────────────────────────

export interface FixRecommendation {
  title: string;
  description: string;
  tags: string[];
  type: "preprocessing" | "postprocessing" | "feature_engineering" | "prompt_engineering";
}

// ─── Bias Slice ─────────────────────────────────────────────────────────────

export interface BiasSlice {
  id: string;
  attributeNames: string[];
  groupLabel: string;
  isIntersectional: boolean;
  metrics: FairnessMetric[];
  worstMetric: FairnessMetric;
  severity: Severity;
  groupStats: GroupStats;
  // Filled by Gemini after scan:
  biasType?: "representation" | "measurement" | "evaluation" | "deployment" | "intersectional";
  explanation?: string;
  fixes?: FixRecommendation[];
  impactStory?: string;
}

// ─── Scan Result ────────────────────────────────────────────────────────────

export interface ScanResult {
  id: string;
  filename: string;
  rowCount: number;
  columnCount: number;
  sensitiveColumns: string[];
  outcomeColumn: string;
  positiveOutcomeLabel: string;
  scannedAt: Date;
  fairscanScore: number;
  riskLevel: Severity;
  slices: BiasSlice[];
  overallStats: {
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    totalSlices: number;
  };
  geminiAnalysisComplete: boolean;
  scanDurationMs: number;
}

// ─── Scan Progress ──────────────────────────────────────────────────────────

export interface ScanProgress {
  step: number;       // 0–4
  stepLabel: string;
  percentage: number;
}

// ─── Text Mode ──────────────────────────────────────────────────────────────

export interface TextModeResult {
  id: string;
  modelDescription: string;
  identifiedSensitiveFeatures: string[];
  proxyFeatures: { feature: string; proxiesFor: string; risk: string }[];
  biasTypeMap: { type: string; description: string }[];
  overallRisk: Severity;
  recommendations: FixRecommendation[];
}

// ─── DatasetColumn (used by ConfigureView table) ────────────────────────────
// Bridge type: maps ColumnMeta to the table row shape ConfigureView renders

export interface DatasetColumn {
  name: string;
  sampleValues: string;   // joined string for display, e.g. "39, 50, 38"
  dataType: DataType;
  role: ColumnRole;
  autoDetected: boolean;
}
