interface Bar {
  label: string;
  heightPct: number;
  color: "brand" | "critical" | "high";
}

const BARS: Bar[] = [
  { label: "Male", heightPct: 32, color: "brand" },
  { label: "Female", heightPct: 19, color: "critical" },
  { label: "White", heightPct: 29, color: "brand" },
  { label: "Black", heightPct: 21, color: "high" },
  { label: "Age 25–50", heightPct: 28, color: "brand" },
];

const COLOR_CLASSES: Record<Bar["color"], string> = {
  brand: "bg-brand",
  critical: "bg-critical",
  high: "bg-high",
};

const Y_LABELS = ["40%", "30%", "20%", "10%", "0%"];

export function OutcomeRatesChart() {
  // Chart inner Y range: 0..40%. Convert bar heightPct (0..40) to 0..100 of inner area.
  const toInnerHeight = (h: number) => (h / 40) * 100;
  const avgInner = toInnerHeight(25);

  return (
    <div className="relative h-[280px] rounded-xl border border-border bg-surface-2 p-4">
      <div className="mb-3 text-[12px] text-text-secondary">
        Positive Outcome Rate by Group
      </div>
      <div className="flex h-[210px] gap-3">
        {/* Y axis */}
        <div className="flex h-full flex-col justify-between pr-2 text-right text-[10px] font-mono text-text-dim">
          {Y_LABELS.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>

        {/* Bars area */}
        <div className="relative flex flex-1 items-end gap-3 border-l border-b border-border pl-3 pb-1">
          {/* Average dashed line */}
          <div
            className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-text-dim"
            style={{ bottom: `${avgInner}%` }}
          >
            <span className="absolute -top-4 right-0 text-[10px] font-mono text-text-dim">
              Average · 25%
            </span>
          </div>

          {BARS.map((b) => (
            <div
              key={b.label}
              className="flex h-full flex-1 flex-col items-center justify-end gap-2"
            >
              <div
                className={`w-full max-w-[40px] rounded-t-sm ${COLOR_CLASSES[b.color]} transition-all`}
                style={{ height: `${toInnerHeight(b.heightPct)}%` }}
              />
              <span className="origin-top -rotate-[30deg] whitespace-nowrap font-mono text-[10px] text-text-secondary">
                {b.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
