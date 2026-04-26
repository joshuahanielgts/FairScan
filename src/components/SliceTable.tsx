import type { BiasSlice } from "@/types";
import { RiskBadge } from "./RiskBadge";

interface SliceTableProps {
  slices: BiasSlice[];
  activeSliceId: string | null;
  onSelectSlice: (slice: BiasSlice) => void;
}

export function SliceTable({
  slices,
  activeSliceId,
  onSelectSlice,
}: SliceTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <table className="w-full">
        <thead>
          <tr className="bg-surface-2 text-left text-[11px] font-medium uppercase tracking-wide text-text-secondary">
            <th className="px-4 py-3">Slice</th>
            <th className="px-4 py-3">Metric</th>
            <th className="px-4 py-3 text-right">Value</th>
            <th className="px-4 py-3">Threshold</th>
            <th className="px-4 py-3 text-right">Severity</th>
          </tr>
        </thead>
        <tbody>
          {slices.map((s, i) => {
            const active = activeSliceId === s.id;
            return (
              <tr
                key={s.id}
                onClick={() => onSelectSlice(s)}
                className={`cursor-pointer border-l-2 transition-colors ${
                  active
                    ? "border-l-brand bg-brand-glow"
                    : "border-l-transparent hover:bg-surface-2/60"
                } ${i < slices.length - 1 ? "border-b border-border" : ""}`}
              >
                <td className="px-4 py-3">
                  <span className="text-[13px] font-medium text-text-primary">
                    {s.intersectional && (
                      <span className="mr-1.5 text-text-dim">∩</span>
                    )}
                    {s.slice}
                  </span>
                </td>
                <td className="px-4 py-3 text-[13px] text-text-secondary">
                  {s.metric}
                </td>
                <td className="px-4 py-3 text-right font-mono text-[13px] text-text-primary">
                  {s.value.toFixed(2)}
                </td>
                <td className="px-4 py-3 font-mono text-[12px] text-text-dim">
                  {s.threshold}
                </td>
                <td className="px-4 py-3 text-right">
                  <RiskBadge severity={s.severity} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
