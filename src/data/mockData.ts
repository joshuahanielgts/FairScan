import type {
  BiasSlice,
  DatasetColumn,
  Explanation,
  FixRecommendation,
  MetricSummary,
  ScanResult,
} from "@/types";

export const mockColumns: DatasetColumn[] = [
  {
    name: "age",
    sampleValues: "39, 50, 38, 53",
    dataType: "Numeric",
    role: "sensitive",
    autoDetected: true,
  },
  {
    name: "workclass",
    sampleValues: "Private, Gov",
    dataType: "Categorical",
    role: "ignore",
    autoDetected: false,
  },
  {
    name: "education",
    sampleValues: "Bachelors, HS",
    dataType: "Categorical",
    role: "ignore",
    autoDetected: false,
  },
  {
    name: "marital_status",
    sampleValues: "Married, Single",
    dataType: "Categorical",
    role: "ignore",
    autoDetected: false,
  },
  {
    name: "occupation",
    sampleValues: "Tech, Sales",
    dataType: "Categorical",
    role: "ignore",
    autoDetected: false,
  },
  {
    name: "sex",
    sampleValues: "Male, Female",
    dataType: "Categorical",
    role: "sensitive",
    autoDetected: true,
  },
  {
    name: "race",
    sampleValues: "White, Black",
    dataType: "Categorical",
    role: "sensitive",
    autoDetected: true,
  },
  {
    name: "income",
    sampleValues: ">50K, <=50K",
    dataType: "Categorical",
    role: "outcome",
    autoDetected: true,
  },
];

export const mockSlices: BiasSlice[] = [
  {
    id: "s1",
    slice: "sex = Female",
    metric: "Disparate Impact",
    value: 0.61,
    threshold: "< 0.80",
    severity: "critical",
    intersectional: false,
  },
  {
    id: "s2",
    slice: "race = Black",
    metric: "Disparate Impact",
    value: 0.72,
    threshold: "< 0.80",
    severity: "high",
    intersectional: false,
  },
  {
    id: "s3",
    slice: "age < 25",
    metric: "Demographic Parity",
    value: 0.34,
    threshold: "> 0.10",
    severity: "high",
    intersectional: false,
  },
  {
    id: "s4",
    slice: "sex=Female, age<25",
    metric: "Disparate Impact",
    value: 0.54,
    threshold: "< 0.80",
    severity: "critical",
    intersectional: true,
  },
  {
    id: "s5",
    slice: "race = Hispanic",
    metric: "Representation",
    value: 0.41,
    threshold: "> 0.30",
    severity: "high",
    intersectional: false,
  },
  {
    id: "s6",
    slice: "age > 60",
    metric: "Equal Opportunity",
    value: 0.28,
    threshold: "> 0.10",
    severity: "medium",
    intersectional: false,
  },
  {
    id: "s7",
    slice: "race = Asian",
    metric: "Demographic Parity",
    value: 0.18,
    threshold: "> 0.10",
    severity: "medium",
    intersectional: false,
  },
];

export const mockMetrics: MetricSummary[] = [
  { label: "Disparate Impact", value: 0.61, severity: "critical" },
  { label: "Demographic Parity Gap", value: 0.34, severity: "high" },
  { label: "Representation Imbalance", value: 0.41, severity: "high" },
];

export const mockExplanations: Explanation[] = [
  {
    id: "e1",
    sliceId: "s1",
    sliceLabel: "sex = Female",
    biasType: "Representation",
    text: "Women in this dataset have a 39% lower income approval rate than men (19% vs 31%). Even after controlling for occupation and education, the gap persists — suggesting measurement or historical bias. If deployed in a hiring or lending context, this model would systematically disadvantage female applicants.",
  },
  {
    id: "e2",
    sliceId: "s4",
    sliceLabel: "sex=Female, age<25",
    biasType: "Intersectional",
    text: "Young women face compounded disadvantage: their disparate impact ratio (0.54) is notably worse than either factor alone, indicating intersectional bias that single-axis audits would miss entirely.",
  },
  {
    id: "e3",
    sliceId: "s2",
    sliceLabel: "race = Black",
    biasType: "Representation",
    text: "Black applicants receive favorable outcomes at 72% of the rate of the reference group, falling below the 0.80 four-fifths rule used in EEOC adverse-impact assessments.",
  },
];

export const mockFixes: FixRecommendation[] = [
  {
    id: "f1",
    number: "01",
    title: "Resample underrepresented groups",
    body: "Apply stratified oversampling to Female and Black subgroups to achieve ≥ 25% representation before retraining.",
    tags: [
      { label: "Pre-processing", tone: "green" },
      { label: "Data-level", tone: "blue" },
    ],
  },
  {
    id: "f2",
    number: "02",
    title: "Remove ZIP code as a proxy feature",
    body: "ZIP codes are strong proxies for race in US data. Replace with broader region codes or remove entirely.",
    tags: [
      { label: "Feature Engineering", tone: "blue" },
      { label: "Proxy Risk", tone: "red" },
    ],
  },
  {
    id: "f3",
    number: "03",
    title: "Apply post-processing threshold adjustment",
    body: "Lower the decision threshold for Female applicants from 0.5 → 0.43 to satisfy equalized odds within ±5%.",
    tags: [
      { label: "Post-processing", tone: "amber" },
      { label: "Model-level", tone: "blue" },
    ],
  },
];

export const mockScanResult: ScanResult = {
  fileName: "adult_income.csv",
  rowCount: 48842,
  columnCount: 14,
  fileSize: "2.3 MB",
  sensitiveAttributeCount: 3,
  fairScanScore: 55,
  metrics: mockMetrics,
  severityCounts: { critical: 1, high: 3, medium: 2, low: 1 },
  slices: mockSlices,
  explanations: mockExplanations,
  fixes: mockFixes,
  impactStory:
    "If deployed in a hiring pipeline at a company with 1,000 annual hires, this model's current bias profile would result in approximately 127 fewer female candidates advancing to interviews per year — disproportionately affecting women under 30.",
};
