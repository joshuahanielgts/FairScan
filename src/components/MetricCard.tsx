import type { MetricSummary } from "@/types";
import { RiskBadge } from "./RiskBadge";

interface MetricCardProps {
  metric: MetricSummary;
}

export function MetricCard({ metric }: MetricCardProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-4 py-3">
      <div>
        <div className="text-[11px] font-medium uppercase tracking-wide text-text-secondary">
          {metric.label}
        </div>
        <div
          className={`font-mono text-[18px] font-bold leading-tight text-${
            metric.severity === "critical"
              ? "critical"
              : metric.severity === "high"
                ? "high"
                : metric.severity === "medium"
                  ? "medium"
                  : "low"
          }`}
        >
          {metric.value.toFixed(2)}
        </div>
      </div>
      <RiskBadge severity={metric.severity} />
    </div>
  );
}
