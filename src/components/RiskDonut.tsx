import type { Severity } from "@/types";

interface RiskDonutProps {
  counts: Record<Severity, number>;
  size?: number;
}

const COLORS: Record<Severity, string> = {
  critical: "var(--critical)",
  high: "var(--high)",
  medium: "var(--medium)",
  low: "var(--low)",
};

const ORDER: Severity[] = ["critical", "high", "medium", "low"];

export function RiskDonut({ counts, size = 140 }: RiskDonutProps) {
  const total = ORDER.reduce((sum, k) => sum + counts[k], 0);
  const radius = 50;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const segments = ORDER.map((sev) => {
    const value = counts[sev];
    const fraction = total > 0 ? value / total : 0;
    const dash = fraction * circumference;
    const seg = {
      sev,
      value,
      dash,
      gap: circumference - dash,
      offset: -offset,
    };
    offset += dash;
    return seg;
  });

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 120 120"
          className="-rotate-90"
          width={size}
          height={size}
        >
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="var(--surface-2)"
            strokeWidth="14"
          />
          {segments.map((s) => (
            <circle
              key={s.sev}
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={COLORS[s.sev]}
              strokeWidth="14"
              strokeDasharray={`${s.dash} ${s.gap}`}
              strokeDashoffset={s.offset}
              strokeLinecap="butt"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-[22px] font-bold text-text-primary">
            {total}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-text-dim">
            slices
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
        {ORDER.map((sev) => (
          <div key={sev} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: COLORS[sev] }}
            />
            <span className="font-mono text-text-secondary">
              {counts[sev]}
            </span>
            <span className="capitalize text-text-dim">{sev}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
