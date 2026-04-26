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
