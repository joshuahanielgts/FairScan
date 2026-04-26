import { useEffect, useState } from "react";
import { Check, Loader2, ShieldCheck } from "lucide-react";

interface ScanningViewProps {
  onComplete: () => void;
}

const STEPS = [
  { id: 1, label: "Parsing CSV — 48,842 rows loaded" },
  { id: 2, label: "Detecting sensitive columns — 3 found" },
  { id: 3, label: "Computing fairness metrics" },
  { id: 4, label: "Running intersectional analysis..." },
  { id: 5, label: "Generating Gemini explanations" },
];

export function ScanningView({ onComplete }: ScanningViewProps) {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const total = 2500;
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      setPercent(Math.min(100, Math.round((elapsed / total) * 100)));
    }, 50);
    const done = setTimeout(() => onComplete(), total);
    return () => {
      clearInterval(tick);
      clearTimeout(done);
    };
  }, [onComplete]);

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-6 py-16">
      <div className="relative h-[200px] w-[200px]">
        {/* Spinning arc */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full animate-scan-spin"
        >
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="var(--brand)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="80 220"
            opacity="0.9"
          />
        </svg>
        {/* Static ring background */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full"
        >
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="var(--surface-2)"
            strokeWidth="3"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <ShieldCheck
            size={48}
            className="animate-shield-pulse text-brand"
            strokeWidth={2}
          />
        </div>
      </div>

      <div className="mt-8 font-mono text-[32px] font-bold text-text-primary">
        {percent}%
      </div>

      <div className="mt-8 text-[16px] font-medium text-text-primary">
        Analyzing demographic slices...
      </div>

      <div className="mt-8 w-full max-w-[360px] space-y-2.5">
        {STEPS.map((s) => {
          const status =
            s.id < 4 ? "done" : s.id === 4 ? "current" : "pending";
          return (
            <div key={s.id} className="flex items-center gap-2.5 text-[14px]">
              {status === "done" && (
                <Check size={16} className="text-low" strokeWidth={2.5} />
              )}
              {status === "current" && (
                <Loader2
                  size={16}
                  className="animate-spin text-brand"
                  strokeWidth={2.5}
                />
              )}
              {status === "pending" && (
                <div className="h-3.5 w-3.5 rounded-full border border-text-dim/60" />
              )}
              <span
                className={
                  status === "done"
                    ? "text-text-secondary"
                    : status === "current"
                      ? "text-text-primary"
                      : "text-text-dim"
                }
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-12 text-[12px] text-text-dim">
        Your data never leaves your browser · Powered by Gemini 2.5 Flash
      </div>
    </div>
  );
}
