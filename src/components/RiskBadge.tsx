import type { Severity } from "@/types";
import { ShieldAlert } from "lucide-react";

const styles: Record<
  Severity,
  { border: string; bg: string; text: string; label: string }
> = {
  critical: {
    border: "border-l-critical",
    bg: "bg-critical-tint",
    text: "text-critical",
    label: "Critical",
  },
  high: {
    border: "border-l-high",
    bg: "bg-high-tint",
    text: "text-high",
    label: "High",
  },
  medium: {
    border: "border-l-medium",
    bg: "bg-medium-tint",
    text: "text-medium",
    label: "Medium",
  },
  low: {
    border: "border-l-low",
    bg: "bg-low-tint",
    text: "text-low",
    label: "Low",
  },
};

interface RiskBadgeProps {
  severity: Severity;
  label?: string;
  withIcon?: boolean;
  size?: "sm" | "md";
}

export function RiskBadge({
  severity,
  label,
  withIcon = false,
  size = "sm",
}: RiskBadgeProps) {
  const s = styles[severity];
  const sizing =
    size === "md" ? "px-3 py-1 text-xs" : "px-2.5 py-0.5 text-[11px]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border-l-[3px] ${s.border} ${s.bg} ${s.text} ${sizing} font-medium uppercase tracking-wide`}
    >
      {withIcon && <ShieldAlert size={12} strokeWidth={2.25} />}
      {label ?? s.label}
    </span>
  );
}
