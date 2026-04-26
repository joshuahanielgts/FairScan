import { parseCSV, analyzeColumns, detectPositiveLabel } from './csvParser';
import { runFullScan } from './fairnessMetrics';
import { analyzeSlices } from './geminiClient';
import type { ScanResult, ScanProgress, ColumnMeta, BiasSlice } from '@/types';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function runScan(
  file: File,
  columnOverrides: { name: string; role: ColumnMeta['role'] }[],
  outcomeColumn: string,
  onProgress: (progress: ScanProgress) => void
): Promise<ScanResult> {
  const startTime = Date.now();

  // Step 0: Parsing CSV
  onProgress({ step: 0, stepLabel: 'Parsing CSV...', percentage: 5 });
  await wait(400);
  const { rows, headers } = await parseCSV(file);
  const columns = analyzeColumns(rows, headers);

  // Step 1: Detecting sensitive columns
  onProgress({ step: 1, stepLabel: 'Detecting sensitive columns...', percentage: 20 });
  await wait(400);
  
  // Apply overrides
  for (const col of columns) {
    const override = columnOverrides.find(o => o.name === col.name);
    if (override) {
      col.role = override.role;
    }
  }

  const outcomeMeta = columns.find(c => c.name === outcomeColumn);
  if (!outcomeMeta) {
    throw new Error(`Outcome column ${outcomeColumn} not found in dataset.`);
  }

  const positiveLabel = detectPositiveLabel(outcomeMeta);

  // Step 2: Computing fairness metrics
  onProgress({ step: 2, stepLabel: 'Computing fairness metrics...', percentage: 50 });
  await wait(400);

  const partialResult = runFullScan(rows, columns, outcomeColumn, positiveLabel);

  // Step 3: Running intersectional analysis (already inside runFullScan, just sleep)
  onProgress({ step: 3, stepLabel: 'Running intersectional analysis...', percentage: 75 });
  await wait(400);

  // Step 4: Generating Gemini explanations
  onProgress({ step: 4, stepLabel: 'Generating Gemini explanations...', percentage: 90 });
  await wait(400);

  let geminiAnalysisComplete = true;
  let topSlices = partialResult.slices;

  if (topSlices.length > 0) {
    // Only send the top 10 slices if there are many to save tokens
    const slicesToSend = topSlices.slice(0, 10);
    
    const datasetContext = `CSV file with ${rows.length} rows. Sensitive attributes: ${partialResult.sensitiveColumns.join(', ')}. Outcome: ${outcomeColumn} (${positiveLabel} = positive)`;

    try {
      const geminiResults = await analyzeSlices(slicesToSend, datasetContext);
      
      // Merge back
      for (const res of geminiResults) {
        const slice = topSlices.find(s => s.id === res.sliceId);
        if (slice) {
          slice.biasType = res.biasType;
          slice.explanation = res.explanation;
          slice.impactStory = res.impactStory;
          slice.fixes = res.fixes;
        }
      }
    } catch (err: any) {
      console.error("Gemini analysis failed:", err);
      if (err.message === 'RATE_LIMITED') {
        geminiAnalysisComplete = false;
        throw err; // The UI handles this specifically
      }
      geminiAnalysisComplete = false;
      // Other errors we can swallow or propagate. The instructions say throw on RATE_LIMITED but log others?
      // Wait, "On API error 429... UI will show friendly message." Let's just throw, UI handles it.
      throw err;
    }
  }

  // Step 5: Complete
  onProgress({ step: 5, stepLabel: 'Complete', percentage: 100 });
  await wait(400);

  return {
    ...partialResult,
    id: crypto.randomUUID(),
    filename: file.name,
    scannedAt: new Date(),
    geminiAnalysisComplete,
    scanDurationMs: Date.now() - startTime
  };
}
