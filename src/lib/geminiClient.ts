import type {
  CSVRow,
  BiasSlice,
  FixRecommendation,
  TextModeResult
} from '@/types';

export interface GeminiSliceAnalysis {
  sliceId: string;
  biasType: BiasSlice['biasType'];
  explanation: string;
  impactStory: string;
  fixes: FixRecommendation[];
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function callGemini(prompt: string, systemInstruction: string, retries = 1): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`;
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json'
        }
      })
    });

    if (res.status === 429) {
      throw new Error('RATE_LIMITED');
    }

    if (!res.ok) {
      throw new Error(`Gemini API error: ${res.status}`);
    }

    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
  } catch (err: any) {
    if (err.message === 'RATE_LIMITED' && retries > 0) {
      console.warn('Rate limited, retrying in 65s...');
      await wait(65000);
      return callGemini(prompt, systemInstruction, retries - 1);
    } else if (retries > 0 && err.message !== 'RATE_LIMITED') {
      console.warn(`Error calling Gemini (${err.message}), retrying in 1s...`);
      await wait(1000);
      try {
        return await callGemini(prompt, systemInstruction, retries - 1);
      } catch (err2: any) {
        if (err2.message !== 'RATE_LIMITED') {
          console.warn(`Error calling Gemini again, retrying in 2s...`);
          await wait(2000);
          return callGemini(prompt, systemInstruction, 0);
        }
        throw err2;
      }
    }
    
    console.error('Gemini API Error:', err);
    throw err;
  }
}

function parseJSONSafely<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    console.error("Failed to parse Gemini response as JSON:", text);
    throw new Error('INVALID_RESPONSE');
  }
}

export async function classifyColumns(headers: string[], sampleRows: CSVRow[]): Promise<{ sensitiveColumns: string[], outcomeColumn: string, positiveLabel: string }> {
  const systemInstruction = `You are a data fairness expert. Respond ONLY with valid JSON matching the exact schema provided. No markdown, no explanation.`;
  
  const prompt = `Headers: ${JSON.stringify(headers)}
Sample rows: ${JSON.stringify(sampleRows)}
Please identify the sensitive columns, outcome column, and its positive label (what represents the "positive" or "approved" outcome).
Return JSON:
{
  "sensitiveColumns": ["col1", "col2"],
  "outcomeColumn": "col3",
  "positiveLabel": "1"
}`;

  const text = await callGemini(prompt, systemInstruction);
  return parseJSONSafely<{ sensitiveColumns: string[], outcomeColumn: string, positiveLabel: string }>(text);
}

export async function analyzeSlices(slices: BiasSlice[], datasetContext: string): Promise<GeminiSliceAnalysis[]> {
  const systemInstruction = `You are a machine learning fairness auditor. You receive computed bias metrics for dataset slices and return structured analysis. Respond ONLY in valid JSON — no markdown, no code fences, no preamble. Be specific, actionable, and avoid academic jargon. Write for a developer who has never studied fairness theory.`;
  
  const results: GeminiSliceAnalysis[] = [];
  
  // Batch slices in chunks of 7
  for (let i = 0; i < slices.length; i += 7) {
    const batch = slices.slice(i, i + 7);
    const slicesContext = batch.map(s => ({
      id: s.id,
      groupLabel: s.groupLabel,
      metricsSummary: s.metrics.map(m => `${m.metricName}: ${m.value} (passed: ${m.passed}, threshold: ${m.threshold})`),
      groupStats: s.groupStats
    }));

    const prompt = `Dataset context: ${datasetContext}

Analyze these ${batch.length} flagged bias slices and return a JSON array:

${JSON.stringify(slicesContext, null, 2)}

Return exactly this JSON structure:
[
  {
    "sliceId": "...",
    "biasType": "representation|measurement|evaluation|deployment|intersectional",
    "explanation": "...",
    "impactStory": "...",
    "fixes": [
      { "title": "...", "description": "...", "tags": ["..."], "type": "preprocessing|postprocessing|feature_engineering|prompt_engineering" }
    ]
  }
]`;

    const text = await callGemini(prompt, systemInstruction);
    const parsed = parseJSONSafely<GeminiSliceAnalysis[]>(text);
    results.push(...parsed);
  }

  return results;
}

export async function analyzeModelDescription(description: string): Promise<TextModeResult> {
  const systemInstruction = `You are an AI fairness expert. Respond ONLY with valid JSON matching the exact schema provided. No markdown, no explanation.`;
  
  const prompt = `Analyze this model description for bias risks:
"${description}"

Return exactly this JSON structure:
{
  "identifiedSensitiveFeatures": ["feature1", "feature2"],
  "proxyFeatures": [{ "feature": "", "proxiesFor": "", "risk": "" }],
  "biasTypeMap": [{ "type": "", "description": "" }],
  "overallRisk": "critical|high|medium|low",
  "recommendations": [
    { "title": "...", "description": "...", "tags": ["..."], "type": "preprocessing|postprocessing|feature_engineering|prompt_engineering" }
  ]
}`;

  const text = await callGemini(prompt, systemInstruction);
  const data = parseJSONSafely<any>(text);
  
  return {
    id: crypto.randomUUID(),
    modelDescription: description,
    identifiedSensitiveFeatures: data.identifiedSensitiveFeatures || [],
    proxyFeatures: data.proxyFeatures || [],
    biasTypeMap: data.biasTypeMap || [],
    overallRisk: data.overallRisk || 'medium',
    recommendations: data.recommendations || []
  };
}
