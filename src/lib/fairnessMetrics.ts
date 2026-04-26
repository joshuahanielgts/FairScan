import type {
  CSVRow,
  ColumnMeta,
  GroupStats,
  FairnessMetric,
  BiasSlice,
  ScanResult
} from '@/types';

// 3.1 Helper: getGroupRows
export function getGroupRows(rows: CSVRow[], column: string, value: string): CSVRow[] {
  return rows.filter(row => row[column] === value);
}

// 3.2 Helper: getPositiveRate
export function getPositiveRate(rows: CSVRow[], outcomeCol: string, positiveLabel: string): number {
  if (rows.length === 0) return 0;
  const positiveCount = rows.filter(row => row[outcomeCol] === positiveLabel).length;
  return positiveCount / rows.length;
}

// 3.3 computeGroupStats
export function computeGroupStats(
  rows: CSVRow[],
  groupCol: string,
  groupValue: string,
  outcomeCol: string,
  positiveLabel: string
): GroupStats {
  const count = rows.length;
  const positiveCount = rows.filter(row => row[outcomeCol] === positiveLabel).length;
  const positiveRate = count > 0 ? positiveCount / count : 0;

  return {
    groupName: groupValue,
    count,
    positiveCount,
    positiveRate,
    truePositiveRate: undefined,
    falsePositiveRate: undefined,
    falseNegativeRate: undefined
  };
}

// 3.4 computeDisparateImpact
export function computeDisparateImpact(rateA: number, rateB: number): number {
  if (rateB === 0) return 0; // Clamp to 0 if rateB === 0
  return rateA / rateB;
}

// 3.5 computeDemographicParityGap
export function computeDemographicParityGap(rateA: number, rateB: number): number {
  return Math.abs(rateA - rateB);
}

// 3.6 computeRepresentationImbalance
export function computeRepresentationImbalance(countA: number, countB: number): number {
  if (countA + countB === 0) return 0;
  return Math.abs(countA - countB) / (countA + countB);
}

// 3.7 computeLabelSkew
export function computeLabelSkew(
  rows: CSVRow[], // group rows
  groupCol: string,
  groupValue: string,
  outcomeCol: string,
  positiveLabel: string,
  overallPositiveRate: number
): number {
  const groupPositiveRate = getPositiveRate(rows, outcomeCol, positiveLabel);
  return Math.abs(groupPositiveRate - overallPositiveRate);
}

// 3.8 getSeverity
export function getSeverity(metrics: FairnessMetric[]): BiasSlice['severity'] {
  let hasCritical = false;
  let hasHigh = false;
  let hasMedium = false;

  for (const m of metrics) {
    if (m.metricName === 'disparate_impact') {
      if (m.value < 0.6) hasCritical = true;
      else if (m.value < 0.8) hasHigh = true;
      else if (!m.passed) hasMedium = true;
    } else if (m.metricName === 'demographic_parity_gap') {
      if (m.value > 0.30) hasCritical = true;
      else if (m.value > 0.15) hasHigh = true;
      else if (!m.passed) hasMedium = true;
    } else {
      if (!m.passed) hasMedium = true;
    }
  }

  if (hasCritical) return 'critical';
  if (hasHigh) return 'high';
  if (hasMedium) return 'medium';
  return 'low';
}

// 3.9 computeSlicesForColumn
export function computeSlicesForColumn(
  rows: CSVRow[],
  sensitiveCol: string,
  outcomeCol: string,
  positiveLabel: string
): BiasSlice[] {
  const slices: BiasSlice[] = [];
  
  // Find unique values for the sensitive column
  const uniqueValues = new Set(rows.map(r => r[sensitiveCol]));
  const overallPositiveRate = getPositiveRate(rows, outcomeCol, positiveLabel);

  for (const groupValue of uniqueValues) {
    const groupRows = getGroupRows(rows, sensitiveCol, groupValue);
    if (groupRows.length < 30) continue; // Skip small groups

    const restRows = rows.filter(r => r[sensitiveCol] !== groupValue);
    if (restRows.length === 0) continue; // Should not happen, but safe to check

    const statsGroup = computeGroupStats(groupRows, sensitiveCol, groupValue, outcomeCol, positiveLabel);
    const statsRest = computeGroupStats(restRows, sensitiveCol, 'Rest', outcomeCol, positiveLabel);

    const disparateImpact = computeDisparateImpact(statsGroup.positiveRate, statsRest.positiveRate);
    const demographicParityGap = computeDemographicParityGap(statsGroup.positiveRate, statsRest.positiveRate);
    const representationImbalance = computeRepresentationImbalance(statsGroup.count, statsRest.count);
    const labelSkew = computeLabelSkew(groupRows, sensitiveCol, groupValue, outcomeCol, positiveLabel, overallPositiveRate);

    const metrics: FairnessMetric[] = [
      {
        metricName: 'disparate_impact',
        value: disparateImpact,
        threshold: 0.8,
        passed: disparateImpact >= 0.8 && disparateImpact <= 1.25,
        groupA: groupValue,
        groupB: 'Rest'
      },
      {
        metricName: 'demographic_parity_gap',
        value: demographicParityGap,
        threshold: 0.10,
        passed: demographicParityGap <= 0.10,
        groupA: groupValue,
        groupB: 'Rest'
      },
      {
        metricName: 'representation_imbalance',
        value: representationImbalance,
        threshold: 0.30,
        passed: representationImbalance <= 0.30,
        groupA: groupValue,
        groupB: 'Rest'
      },
      {
        metricName: 'label_skew',
        value: labelSkew,
        threshold: 0.15,
        passed: labelSkew <= 0.15,
        groupA: groupValue,
        groupB: 'Rest'
      }
    ];

    const failedMetrics = metrics.filter(m => !m.passed);
    if (failedMetrics.length === 0) continue;

    // Pick worst metric
    // For disparate impact, worst means furthest from 1.
    // For others, worst means largest gap.
    let worstMetric = failedMetrics[0];
    let maxViolation = -1;
    
    for (const m of failedMetrics) {
      let violation = 0;
      if (m.metricName === 'disparate_impact') {
        violation = m.value < 1 ? (1 - m.value) : (m.value - 1);
      } else {
        violation = m.value;
      }
      
      if (violation > maxViolation) {
        maxViolation = violation;
        worstMetric = m;
      }
    }

    const severity = getSeverity(metrics);

    slices.push({
      id: `${sensitiveCol}_${groupValue}`,
      attributeNames: [sensitiveCol],
      groupLabel: groupValue,
      isIntersectional: false,
      metrics,
      worstMetric,
      severity,
      groupStats: statsGroup
    });
  }

  return slices;
}

// 3.10 computeIntersectionalSlices
export function computeIntersectionalSlices(
  rows: CSVRow[],
  sensitiveColA: string,
  sensitiveColB: string,
  outcomeCol: string,
  positiveLabel: string
): BiasSlice[] {
  const slices: BiasSlice[] = [];
  const overallPositiveRate = getPositiveRate(rows, outcomeCol, positiveLabel);

  const uniqueA = new Set(rows.map(r => r[sensitiveColA]));
  const uniqueB = new Set(rows.map(r => r[sensitiveColB]));

  for (const valA of uniqueA) {
    for (const valB of uniqueB) {
      const groupRows = rows.filter(r => r[sensitiveColA] === valA && r[sensitiveColB] === valB);
      if (groupRows.length < 30) continue;

      const restRows = rows.filter(r => r[sensitiveColA] !== valA || r[sensitiveColB] !== valB);
      if (restRows.length === 0) continue;

      const groupLabel = `${valA} ∩ ${valB}`;
      
      const statsGroup = computeGroupStats(groupRows, 'intersectional', groupLabel, outcomeCol, positiveLabel);
      const statsRest = computeGroupStats(restRows, 'intersectional', 'Rest', outcomeCol, positiveLabel);

      const disparateImpact = computeDisparateImpact(statsGroup.positiveRate, statsRest.positiveRate);
      const demographicParityGap = computeDemographicParityGap(statsGroup.positiveRate, statsRest.positiveRate);
      const representationImbalance = computeRepresentationImbalance(statsGroup.count, statsRest.count);
      const labelSkew = computeLabelSkew(groupRows, 'intersectional', groupLabel, outcomeCol, positiveLabel, overallPositiveRate);

      const metrics: FairnessMetric[] = [
        { metricName: 'disparate_impact', value: disparateImpact, threshold: 0.8, passed: disparateImpact >= 0.8 && disparateImpact <= 1.25, groupA: groupLabel, groupB: 'Rest' },
        { metricName: 'demographic_parity_gap', value: demographicParityGap, threshold: 0.10, passed: demographicParityGap <= 0.10, groupA: groupLabel, groupB: 'Rest' },
        { metricName: 'representation_imbalance', value: representationImbalance, threshold: 0.30, passed: representationImbalance <= 0.30, groupA: groupLabel, groupB: 'Rest' },
        { metricName: 'label_skew', value: labelSkew, threshold: 0.15, passed: labelSkew <= 0.15, groupA: groupLabel, groupB: 'Rest' }
      ];

      const failedMetrics = metrics.filter(m => !m.passed);
      if (failedMetrics.length === 0) continue;

      let worstMetric = failedMetrics[0];
      let maxViolation = -1;
      for (const m of failedMetrics) {
        let violation = m.metricName === 'disparate_impact' ? (m.value < 1 ? 1 - m.value : m.value - 1) : m.value;
        if (violation > maxViolation) {
          maxViolation = violation;
          worstMetric = m;
        }
      }

      const severity = getSeverity(metrics);
      if (severity !== 'high' && severity !== 'critical') continue; // Intersectional threshold

      slices.push({
        id: `${sensitiveColA}_${valA}_${sensitiveColB}_${valB}`,
        attributeNames: [sensitiveColA, sensitiveColB],
        groupLabel,
        isIntersectional: true,
        metrics,
        worstMetric,
        severity,
        groupStats: statsGroup
      });
    }
  }

  return slices;
}

// 3.11 computeFairscanScore
export function computeFairscanScore(slices: BiasSlice[]): number {
  if (slices.length === 0) return 100;

  let sumDisparateImpact = 0;
  let countDisparateImpact = 0;
  let worstParityGap = 0;
  let worstRepresentation = 0;

  for (const s of slices) {
    for (const m of s.metrics) {
      if (m.metricName === 'disparate_impact') {
        sumDisparateImpact += m.value;
        countDisparateImpact++;
      } else if (m.metricName === 'demographic_parity_gap') {
        if (m.value > worstParityGap) worstParityGap = m.value;
      } else if (m.metricName === 'representation_imbalance') {
        if (m.value > worstRepresentation) worstRepresentation = m.value;
      }
    }
  }

  let disparateImpactScore = 100;
  if (countDisparateImpact > 0) {
    const avgDi = sumDisparateImpact / countDisparateImpact;
    // Formula: clamp(value / 0.8 * 70, 0, 100) for below-threshold values
    if (avgDi < 0.8) {
      disparateImpactScore = Math.max(0, Math.min(100, (avgDi / 0.8) * 70));
    } else if (avgDi > 1.25) {
      // If > 1.25, similarly penalize. (1.25 is inverse of 0.8)
      disparateImpactScore = Math.max(0, Math.min(100, (1.25 / avgDi) * 70));
    } else {
      disparateImpactScore = 100;
    }
  }

  const parityGapScore = Math.max(0, Math.min(100, 100 - (worstParityGap * 300)));
  const representationScore = Math.max(0, Math.min(100, 100 - (worstRepresentation * 200)));

  const score = (disparateImpactScore * 0.40) + (parityGapScore * 0.35) + (representationScore * 0.25);
  return Math.max(0, Math.min(100, Math.round(score)));
}

// 3.12 getRiskLevel
export function getRiskLevel(score: number): ScanResult['riskLevel'] {
  if (score >= 80) return 'low';
  if (score >= 60) return 'medium';
  if (score >= 40) return 'high';
  return 'critical';
}

// 3.13 runFullScan
export function runFullScan(
  rows: CSVRow[],
  columns: ColumnMeta[],
  outcomeCol: string,
  positiveLabel: string
): Omit<ScanResult, 'id' | 'filename' | 'scannedAt' | 'geminiAnalysisComplete' | 'scanDurationMs'> {
  
  const sensitiveCols = columns.filter(c => c.role === 'sensitive').map(c => c.name);
  let allSlices: BiasSlice[] = [];

  for (const col of sensitiveCols) {
    const s = computeSlicesForColumn(rows, col, outcomeCol, positiveLabel);
    allSlices.push(...s);
  }

  for (let i = 0; i < sensitiveCols.length; i++) {
    for (let j = i + 1; j < sensitiveCols.length; j++) {
      const is = computeIntersectionalSlices(rows, sensitiveCols[i], sensitiveCols[j], outcomeCol, positiveLabel);
      allSlices.push(...is);
    }
  }

  // Deduplicate by ID
  const map = new Map<string, BiasSlice>();
  for (const s of allSlices) {
    if (!map.has(s.id)) {
      map.set(s.id, s);
    }
  }
  allSlices = Array.from(map.values());

  // Sort slices: critical > high > medium > low, then by worstMetric.value
  const severityRank = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
  allSlices.sort((a, b) => {
    if (severityRank[a.severity] !== severityRank[b.severity]) {
      return severityRank[b.severity] - severityRank[a.severity];
    }
    // Secondary sort: maybe disparate impact lowest first, etc. We just use severity rank.
    return 0; 
  });

  const overallStats = {
    criticalCount: allSlices.filter(s => s.severity === 'critical').length,
    highCount: allSlices.filter(s => s.severity === 'high').length,
    mediumCount: allSlices.filter(s => s.severity === 'medium').length,
    lowCount: allSlices.filter(s => s.severity === 'low').length,
    totalSlices: allSlices.length
  };

  const fairscanScore = computeFairscanScore(allSlices);
  const riskLevel = getRiskLevel(fairscanScore);

  return {
    rowCount: rows.length,
    columnCount: columns.length,
    sensitiveColumns: sensitiveCols,
    outcomeColumn: outcomeCol,
    positiveOutcomeLabel: positiveLabel,
    fairscanScore,
    riskLevel,
    slices: allSlices,
    overallStats
  };
}
