import { Check } from "lucide-react";
import type { AppView } from "@/types";

const STEPS: { id: AppView; label: string }[] = [
  { id: "upload", label: "Upload" },
  { id: "configure", label: "Configure" },
  { id: "scanning", label: "Scan" },
  { id: "results", label: "Results" },
];

interface StepIndicatorProps {
  currentView: AppView;
}

export function StepIndicator({ currentView }: StepIndicatorProps) {
  // Map text-results to results for indicator highlighting
  const activeView = currentView === 'text-results' ? 'results' : currentView;
  const currentIdx = STEPS.findIndex((s) => s.id === activeView);

  if (currentView === 'landing') return null;

  return (
    <div className="hidden items-center gap-2 md:flex">
      {STEPS.map((step, idx) => {
        const isCurrent = idx === currentIdx;
        const isComplete = idx < currentIdx;
        return (
          <div key={step.id} className="flex items-center gap-2">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-mono transition-colors ${
                isCurrent
                  ? "bg-brand text-white shadow-[0_0_8px_rgba(37,99,235,0.3)]"
                  : isComplete
                    ? "bg-low/20 text-low"
                    : "bg-surface-2 text-text-dim"
              }`}
            >
              {isComplete ? <Check size={12} strokeWidth={3} /> : idx + 1}
            </div>
            <span
              className={`text-xs font-medium transition-colors ${
                isCurrent
                  ? "text-text-primary"
                  : isComplete
                    ? "text-text-secondary"
                    : "text-text-dim"
              }`}
            >
              {step.label}
            </span>
            {idx < STEPS.length - 1 && (
              <div
                className={`h-px w-6 ${
                  isComplete ? "bg-low/40" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
