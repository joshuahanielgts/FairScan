import { Check } from "lucide-react";

interface ScanStepIndicatorProps {
  label: string;
  status: "pending" | "active" | "complete";
}

export function ScanStepIndicator({ label, status }: ScanStepIndicatorProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-5 w-5 flex-none items-center justify-center rounded-full text-[10px] transition-all duration-300 ${
          status === "complete"
            ? "bg-low text-white"
            : status === "active"
              ? "bg-brand text-white shadow-[0_0_8px_rgba(37,99,235,0.4)]"
              : "bg-surface-2 text-text-dim"
        }`}
      >
        {status === "complete" ? (
          <Check size={12} strokeWidth={3} />
        ) : (
          <div className={`h-1.5 w-1.5 rounded-full ${status === 'active' ? 'bg-white animate-pulse' : 'bg-current'}`} />
        )}
      </div>
      <span
        className={`text-[13px] font-medium transition-colors duration-300 ${
          status === "active"
            ? "text-text-primary"
            : status === "complete"
              ? "text-text-secondary"
              : "text-text-dim"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
