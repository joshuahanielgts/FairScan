import Papa from 'papaparse';
import type { CSVRow, ColumnMeta } from '@/types';

export function parseCSV(file: File): Promise<{ rows: CSVRow[], headers: string[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          reject(new Error(`Failed to parse CSV: ${results.errors[0].message}`));
          return;
        }
        if (results.data.length === 0) {
          reject(new Error("Dataset is empty."));
          return;
        }
        resolve({
          rows: results.data as CSVRow[],
          headers: results.meta.fields || []
        });
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

export function inferColumnType(values: string[]): ColumnMeta['type'] {
  let sample = values.filter(v => v !== null && v !== undefined && v.trim() !== '');
  if (sample.length > 100) {
    sample = sample.slice(0, 100);
  }
  
  if (sample.length === 0) return 'unknown';

  let numericCount = 0;
  let totalLength = 0;
  
  const uniqueValues = new Set<string>();

  for (const v of sample) {
    const trimmed = v.trim();
    if (!isNaN(Number(trimmed))) {
      numericCount++;
    }
    totalLength += trimmed.length;
    uniqueValues.add(trimmed);
  }

  const numericRatio = numericCount / sample.length;
  if (numericRatio > 0.8) {
    return 'numeric';
  }

  if (uniqueValues.size <= 20) {
    return 'categorical';
  }

  const avgLength = totalLength / sample.length;
  if (avgLength > 30) {
    return 'text';
  }

  return 'unknown';
}

export function analyzeColumns(rows: CSVRow[], headers: string[]): ColumnMeta[] {
  const sensitivePatterns = /gender|sex|race|ethnicity|age|nationality|religion|disability|income|salary|zip|zipcode|postal|marital/i;

  return headers.map(header => {
    const values = rows.map(r => r[header]);
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v.trim() !== '');
    
    // Calculate unique values up to 20, sorted by frequency
    const valueCounts: Record<string, number> = {};
    for (const v of nonNullValues) {
      valueCounts[v] = (valueCounts[v] || 0) + 1;
    }
    const uniqueValues = Object.entries(valueCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, 20);

    const type = inferColumnType(nonNullValues);
    const sampleValues = nonNullValues.slice(0, 5);
    const nullCount = values.length - nonNullValues.length;
    
    const isAutoDetectedSensitive = sensitivePatterns.test(header);
    const role: ColumnMeta['role'] = isAutoDetectedSensitive ? 'sensitive' : 'ignore';

    return {
      name: header,
      type,
      uniqueValues,
      sampleValues,
      nullCount,
      isAutoDetectedSensitive,
      role
    };
  });
}

export function detectOutcomeColumn(columns: ColumnMeta[]): string | null {
  const outcomePatterns = /label|target|outcome|approved|hired|income|result|decision|class|y/i;
  
  const candidates = columns.filter(col => outcomePatterns.test(col.name));
  
  if (candidates.length === 0) return null;

  // Prefer binary categorical columns (exactly 2 unique values)
  const binaryCandidates = candidates.filter(col => col.uniqueValues.length === 2);
  
  if (binaryCandidates.length > 0) {
    return binaryCandidates[0].name;
  }
  
  return candidates[0].name;
}

export function detectPositiveLabel(column: ColumnMeta): string {
  const positivePatterns = /^1$|^yes$|^true$|^>50k$|^approved$|^hired$|^accepted$|^positive$/i;

  for (const val of column.uniqueValues) {
    if (positivePatterns.test(val.trim())) {
      return val;
    }
  }

  // If none match, return lexicographically larger
  if (column.uniqueValues.length > 0) {
    const sorted = [...column.uniqueValues].sort();
    return sorted[sorted.length - 1];
  }

  return '1';
}
