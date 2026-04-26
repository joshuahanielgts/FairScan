export type Severity = "critical" | "high" | "medium" | "low";

export type ColumnRole = "sensitive" | "outcome" | "ignore";

export type DataType = "Numeric" | "Categorical";

export interface DatasetColumn {
  name: string;
  sampleValues: string;
  dataType: DataType;
  role: ColumnRole;
  autoDetected: boolean;
}

export interface BiasSlice {
  id: string;
  slice: string;
  metric: string;
  value: number;
  threshold: string;
  severity: Severity;
  intersectional: boolean;
}

export interface MetricSummary {
  label: string;
  value: number;
  severity: Severity;
}

export interface Explanation {
  id: string;
  sliceId: string;
  sliceLabel: string;
  biasType: string;
  text: string;
}

export interface FixRecommendation {
  id: string;
  number: string;
  title: string;
  body: string;
  tags: { label: string; tone: "blue" | "green" | "amber" | "red" }[];
}

export interface ScanResult {
  fileName: string;
  rowCount: number;
  columnCount: number;
  fileSize: string;
  sensitiveAttributeCount: number;
  fairScanScore: number;
  metrics: MetricSummary[];
  severityCounts: Record<Severity, number>;
  slices: BiasSlice[];
  explanations: Explanation[];
  fixes: FixRecommendation[];
  impactStory: string;
}

export type AppView =
  | "landing"
  | "upload"
  | "configure"
  | "scanning"
  | "results";

// Raw parsed CSV row — key is column name, value is string
export interface CSVRow {
  [key: string]: string;
}

// Column metadata after parsing
export interface ColumnMeta {
  name: string;
  type: 'numeric' | 'categorical' | 'text' | 'unknown';
  uniqueValues: string[];       // up to 20 unique values
  sampleValues: string[];       // first 5 non-null values
  nullCount: number;
  isAutoDetectedSensitive: boolean;
  role: 'sensitive' | 'outcome' | 'ignore';
}

// A single group within a sensitive column
export interface GroupStats {
  groupName: string;            // e.g. "Female", "Age < 25"
  count: number;
  positiveCount: number;        // rows where outcome = positive
  positiveRate: number;         // positiveCount / count
  truePositiveRate?: number;    // if labels available
  falsePositiveRate?: number;
  falseNegativeRate?: number;
}

// One fairness metric result for a slice
export interface FairnessMetric {
  metricName: 'disparate_impact' | 'demographic_parity_gap' |
              'equalized_odds_gap' | 'equal_opportunity_gap' |
              'representation_imbalance' | 'label_skew';
  value: number;
  threshold: number;            // the threshold it's compared against
  passed: boolean;
  groupA: string;
  groupB: string;               // reference group (majority or "others")
}

// One flagged slice (a group or intersection that has bias)
export interface BiasSlice {
  id: string;                   // unique, e.g. "sex_Female"
  attributeNames: string[];     // e.g. ["sex"] or ["sex", "age"] for intersectional
  groupLabel: string;           // e.g. "Female" or "Female ∩ Age < 25"
  isIntersectional: boolean;
  metrics: FairnessMetric[];
  worstMetric: FairnessMetric;  // the metric with the worst violation
  severity: 'critical' | 'high' | 'medium' | 'low';
  groupStats: GroupStats;
  // Filled by Gemini:
  biasType?: 'representation' | 'measurement' | 'evaluation' | 'deployment' | 'intersectional';
  explanation?: string;
  fixes?: FixRecommendation[];
  impactStory?: string;
}

// A fix recommendation
export interface FixRecommendation {
  title: string;
  description: string;
  tags: string[];               // e.g. ["Pre-processing", "Data-level"]
  type: 'preprocessing' | 'postprocessing' | 'feature_engineering' | 'prompt_engineering';
}

// The full result of a scan
export interface ScanResult {
  id: string;                   // uuid
  filename: string;
  rowCount: number;
  columnCount: number;
  sensitiveColumns: string[];
  outcomeColumn: string;
  positiveOutcomeLabel: string; // e.g. ">50K" or "1"
  scannedAt: Date;
  fairscanScore: number;        // 0–100
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
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

// Text mode result (no CSV)
export interface TextModeResult {
  id: string;
  modelDescription: string;
  identifiedSensitiveFeatures: string[];
  proxyFeatures: { feature: string; proxiesFor: string; risk: string }[];
  biasTypeMap: { type: string; description: string }[];
  overallRisk: 'critical' | 'high' | 'medium' | 'low';
  recommendations: FixRecommendation[];
}

// Scan progress for the scanning view
export interface ScanProgress {
  step: number;                 // 0–4
  stepLabel: string;
  percentage: number;
}
