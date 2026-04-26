import { BarChart2, Grid3X3, PieChart } from "lucide-react";

interface ChartPlaceholderProps {
  kind: "fpr" | "intersectional" | "representation";
}

const CONFIG = {
  fpr: { Icon: BarChart2, label: "False Positive / False Negative Rates" },
  intersectional: { Icon: Grid3X3, label: "Intersectional heatmap" },
  representation: { Icon: PieChart, label: "Group representation" },
} as const;

export function ChartPlaceholder({ kind }: ChartPlaceholderProps) {
  const { Icon, label } = CONFIG[kind];
  return (
    <div className="flex h-[280px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-2 bg-surface-2 text-text-dim">
      <Icon size={28} />
      <span className="text-sm">{label}</span>
      <span className="text-[11px]">Chart renders here</span>
    </div>
  );
}
