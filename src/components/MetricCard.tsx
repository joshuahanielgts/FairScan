import { RiskBadge } from "./RiskBadge";
import type { Severity } from "@/types";

interface MetricCardProps {
  metric: {
    label: string;
    value: number;
    severity: Severity;
  };
}

export function MetricCard({ metric }: MetricCardProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-4 py-3">
      <div>
        <div className="text-[11px] font-medium uppercase tracking-wide text-text-secondary">
          {metric.label}
        </div>
        <div
          className={`font-mono text-[18px] font-bold leading-tight text-${metric.severity}`}
        >
          {metric.value.toFixed(3)}
        </div>
      </div>
      <RiskBadge severity={metric.severity} />
    </div>
  );
}
