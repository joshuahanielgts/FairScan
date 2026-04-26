import type { FixRecommendation } from "@/types";

interface FixCardProps {
  fix: FixRecommendation;
  index: number;
}

const getToneClass = (tag: string) => {
  const t = tag.toLowerCase();
  if (t.includes('pre') || t.includes('data')) return "border-brand/40 bg-brand-glow text-brand";
  if (t.includes('post') || t.includes('mitigation')) return "border-low/40 bg-low-tint text-low";
  if (t.includes('feature') || t.includes('engineer')) return "border-medium/40 bg-medium-tint text-medium";
  if (t.includes('prompt')) return "border-critical/40 bg-critical-tint text-critical";
  return "border-border-2 bg-surface text-text-secondary";
};

export function FixCard({ fix, index }: FixCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface-2 p-3.5 transition-colors hover:bg-brand-glow/10">
      <div className="flex items-start gap-3">
        <div className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-surface font-mono text-[11px] font-medium text-brand">
          {(index + 1).toString().padStart(2, '0')}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-[13px] font-medium text-text-primary">
            {fix.title}
          </h4>
          <p className="mt-1 text-[12px] leading-relaxed text-text-secondary">
            {fix.description}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {fix.tags.map((t) => (
              <span
                key={t}
                className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${getToneClass(t)}`}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
