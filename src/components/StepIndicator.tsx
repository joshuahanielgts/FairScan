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
  const currentIdx = STEPS.findIndex((s) => s.id === currentView);

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
                  ? "bg-brand text-white"
                  : isComplete
                    ? "bg-low/20 text-low"
                    : "bg-surface-2 text-text-dim"
              }`}
            >
              {isComplete ? <Check size={12} strokeWidth={3} /> : idx + 1}
            </div>
            <span
              className={`text-xs font-medium ${
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
