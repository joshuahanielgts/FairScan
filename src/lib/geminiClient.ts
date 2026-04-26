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

// Try these model IDs in order — first one that works will be used
const GEMINI_MODELS = [
  "gemini-2.5-flash-preview-05-20",
  "gemini-2.5-flash-latest",
  "gemini-2.5-flash",
  "gemini-2.0-flash",           // guaranteed fallback
  "gemini-2.0-flash-lite",      // ultra-light fallback
];

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

async function callGeminiWithFallback(
  prompt: string,
  systemInstruction: string
): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_KEY_MISSING");

  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(
        `${BASE_URL}/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: systemInstruction }],
            },
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 2048,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (res.status === 404 || res.status === 400) {
        // Model not available, try next
        console.warn(`Model ${model} not available (${res.status}), trying next...`);
        continue;
      }

      if (res.status === 403) {
        // API key issue — throw immediately, no point trying other models
        throw new Error("GEMINI_403: API key invalid or Generative AI API not enabled. Go to https://aistudio.google.com/app/apikey and verify your key.");
      }

      if (res.status === 429) {
        throw new Error("RATE_LIMITED");
      }

      if (!res.ok) {
        throw new Error(`Gemini API error: ${res.status}`);
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text || text.trim().length === 0) {
        console.warn(`Model ${model} returned empty response`);
        continue; // try next model
      }

      // If responseMimeType was json but we got HTML (error page), skip
      if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        console.warn(`Model ${model} returned HTML instead of JSON`);
        continue;
      }

      return text;
    } catch (err: unknown) {
      if (err instanceof Error &&
          (err.message === "RATE_LIMITED" ||
           err.message.startsWith("GEMINI_403") ||
           err.message === "GEMINI_KEY_MISSING")) {
        throw err; // Re-throw fatal errors
      }
      // Network error or model-specific error — try next model
      console.warn(`Model ${model} failed:`, err);
    }
  }
  throw new Error("All Gemini models failed. Check your API key at https://aistudio.google.com/app/apikey");
}

function safeParseJSON<T>(raw: string): T {
  // Strip markdown code fences if present
  let cleaned = raw.trim();
  
  // Remove ```json ... ``` or ``` ... ```
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  
  // Also handle cases where JSON is preceded by explanation text
  // Find the first { or [ and parse from there
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  
  let startIndex = -1;
  if (firstBrace !== -1 && firstBracket !== -1) {
    startIndex = Math.min(firstBrace, firstBracket);
  } else if (firstBrace !== -1) {
    startIndex = firstBrace;
  } else if (firstBracket !== -1) {
    startIndex = firstBracket;
  }
  
  if (startIndex > 0) {
    cleaned = cleaned.slice(startIndex);
  }
  
  // Find the matching closing brace/bracket from the end
  const lastBrace = cleaned.lastIndexOf('}');
  const lastBracket = cleaned.lastIndexOf(']');
  const endIndex = Math.max(lastBrace, lastBracket);
  if (endIndex !== -1 && endIndex < cleaned.length - 1) {
    cleaned = cleaned.slice(0, endIndex + 1);
  }
  
  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    console.error('safeParseJSON failed. Raw response was:', raw);
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

  const text = await callGeminiWithFallback(prompt, systemInstruction);
  return safeParseJSON<{ sensitiveColumns: string[], outcomeColumn: string, positiveLabel: string }>(text);
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

    const text = await callGeminiWithFallback(prompt, systemInstruction);
    const parsed = safeParseJSON<GeminiSliceAnalysis[]>(text);
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

  const text = await callGeminiWithFallback(prompt, systemInstruction);
  const data = safeParseJSON<any>(text);
  
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
