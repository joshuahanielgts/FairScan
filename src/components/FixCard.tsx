import type { FixRecommendation } from "@/types";

interface FixCardProps {
  fix: FixRecommendation;
}

const TONE_CLASSES: Record<
  FixRecommendation["tags"][number]["tone"],
  string
> = {
  blue: "border-brand/40 bg-brand-glow text-brand",
  green: "border-low/40 bg-low-tint text-low",
  amber: "border-medium/40 bg-medium-tint text-medium",
  red: "border-critical/40 bg-critical-tint text-critical",
};

export function FixCard({ fix }: FixCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface-2 p-3.5">
      <div className="flex items-start gap-3">
        <div className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-surface font-mono text-[11px] font-medium text-brand">
          {fix.number}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-[13px] font-medium text-text-primary">
            {fix.title}
          </h4>
          <p className="mt-1 text-[12px] leading-relaxed text-text-secondary">
            {fix.body}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {fix.tags.map((t) => (
              <span
                key={t.label}
                className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${TONE_CLASSES[t.tone]}`}
              >
                {t.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
