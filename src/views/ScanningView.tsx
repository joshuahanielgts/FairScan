import { useEffect, useState } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { ScanStepIndicator } from "@/components/ScanStepIndicator";
import { runScan } from "@/lib/scanOrchestrator";
import { emailReport } from "@/lib/emailReport";
import type { ScanProgress, ScanResult, ColumnMeta } from "@/types";

interface ScanningViewProps {
  file: File;
  columnOverrides: { name: string; role: ColumnMeta['role'] }[];
  outcomeColumn: string;
  summaryEmailOpts?: { wantsEmail: boolean; email: string };
  onComplete: (result: ScanResult) => void;
  onBack: () => void;
}

const STEPS = [
  "Parsing CSV...",
  "Detecting sensitive columns...",
  "Computing fairness metrics...",
  "Running intersectional analysis...",
  "Generating Gemini explanations...",
];

export function ScanningView({ file, columnOverrides, outcomeColumn, summaryEmailOpts, onComplete, onBack }: ScanningViewProps) {
  const [progress, setProgress] = useState<ScanProgress>({
    step: 0,
    stepLabel: "Initializing...",
    percentage: 0,
  });
  
  const [error, setError] = useState<string | React.ReactNode | null>(null);

  useEffect(() => {
    runScan(file, columnOverrides, outcomeColumn, (p) => {
      setProgress(p);
    })
      .then((result) => {
        if (summaryEmailOpts?.wantsEmail && summaryEmailOpts.email) {
          emailReport({
            to: summaryEmailOpts.email,
            scanResult: result,
            mode: 'summary',
          }).catch(console.error);
        }
        setTimeout(() => onComplete(result), 500);
      })
      .catch((err) => {
        if (err.message === 'RATE_LIMITED') {
          setError('Gemini API rate limit reached. Please wait 60 seconds and try again.');
        } else if (err.message.includes('GEMINI_403')) {
          setError(
            <div className="text-left space-y-4">
              <p>Gemini API key error (403).</p>
              <div className="bg-surface-2 p-4 rounded-lg border border-border">
                <p className="font-medium mb-2">Fix Steps:</p>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">aistudio.google.com/app/apikey</a></li>
                  <li>Make sure your key is active</li>
                  <li>Make sure "Generative Language API" is enabled in Google Cloud Console</li>
                  <li>Copy the key and paste it in <code className="bg-surface-3 px-1 rounded">.env.local</code> as:</li>
                </ol>
                <pre className="mt-4 bg-black text-white p-3 rounded text-xs overflow-x-auto">
                  VITE_GEMINI_API_KEY=your_key_here
                </pre>
                <p className="mt-4 text-xs">5. Restart the dev server (Ctrl+C then npm run dev)</p>
              </div>
            </div>
          );
        } else {
          setError(`Scan failed: ${err.message}`);
        }
      });
  }, [file, columnOverrides, outcomeColumn, onComplete, summaryEmailOpts]);

  return (
    <div className="mx-auto max-w-[540px] px-6 py-32 text-center">
      {error ? (
        <div className="flex flex-col items-center animate-fade-in">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-critical/10 text-critical">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-[24px] font-medium text-text-primary">Scan Failed</h2>
          <p className="mt-3 text-[14px] text-text-secondary leading-relaxed">
            {error}
          </p>
          <button
            type="button"
            onClick={onBack}
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-surface-2 px-6 text-[14px] font-medium text-text-primary transition-colors hover:bg-surface-3"
          >
            <RotateCcw size={16} />
            Try Again
          </button>
        </div>
      ) : (
        <>
          <div className="relative mx-auto flex h-32 w-32 items-center justify-center">
            {/* Background ring */}
            <svg className="absolute inset-0 h-full w-full -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="60"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-surface-2"
              />
              {/* Progress ring */}
              <circle
                cx="64"
                cy="64"
                r="60"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                className="text-brand transition-all duration-300 ease-out"
                strokeDasharray="377"
                strokeDashoffset={377 - (377 * progress.percentage) / 100}
              />
            </svg>
            <div className="font-display text-[28px] text-text-primary">
              {Math.round(progress.percentage)}%
            </div>
          </div>

          <h2 className="mt-12 font-display text-[28px] text-text-primary">
            Scanning dataset...
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            {progress.stepLabel}
          </p>

          <div className="mx-auto mt-12 max-w-[320px] space-y-4 text-left">
            {STEPS.map((stepLabel, i) => {
              let status: "pending" | "active" | "complete" = "pending";
              if (i < progress.step) status = "complete";
              else if (i === progress.step) status = "active";

              return (
                <ScanStepIndicator
                  key={stepLabel}
                  label={stepLabel}
                  status={status}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
