import { useState, useEffect } from "react";
import { Brain, ChevronDown, ChevronRight, ArrowRight } from "lucide-react";
import type { BiasSlice } from "@/types";

interface GeminiPanelProps {
  slices: BiasSlice[];
  totalCount: number;
  highlightedSliceId: string | null;
}

export function GeminiPanel({
  slices: allSlices,
  totalCount,
  highlightedSliceId,
}: GeminiPanelProps) {
  // Only show slices that have explanations
  const slices = allSlices.filter(s => s.explanation);
  
  const [openId, setOpenId] = useState<string | null>(
    highlightedSliceId || (slices[0] ? slices[0].id : null),
  );

  useEffect(() => {
    if (highlightedSliceId) {
      setOpenId(highlightedSliceId);
    }
  }, [highlightedSliceId]);

  const toggle = (id: string) => {
    setOpenId(prev => (prev === id ? null : id));
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-5 card-glow">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Brain size={16} className="text-brand" />
        <h3 className="text-sm font-medium text-text-primary">
          Gemini Analysis
        </h3>
        <span className="rounded-full border border-brand/40 bg-brand-glow px-2 py-0.5 text-[10px] font-medium text-brand">
          Powered by Gemini 2.5 Flash
        </span>
      </div>

      <div className="space-y-2">
        {slices.map((s) => {
          const open = openId === s.id;
          const highlighted = highlightedSliceId === s.id;
          return (
            <div
              key={s.id}
              className={`overflow-hidden rounded-lg border transition-all ${
                highlighted
                  ? "border-brand bg-brand-glow"
                  : "border-border bg-surface-2"
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(s.id)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-brand/40 bg-brand-glow px-2 py-0.5 text-[11px] font-medium text-brand">
                    {s.groupLabel}
                  </span>
                  <span className="rounded-full border border-border-2 bg-surface px-2 py-0.5 text-[11px] text-text-secondary capitalize">
                    {s.biasType || 'analysis'}
                  </span>
                </div>
                {open ? (
                  <ChevronDown size={14} className="text-text-dim" />
                ) : (
                  <ChevronRight size={14} className="text-text-dim" />
                )}
              </button>
              <div
                className="grid transition-all duration-200 ease-out"
                style={{
                  gridTemplateRows: open ? "1fr" : "0fr",
                }}
              >
                <div className="overflow-hidden">
                  <p className="px-3 pb-3 text-[13px] leading-relaxed text-text-secondary">
                    {s.explanation}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:underline"
      >
        View all {totalCount} explanations
        <ArrowRight size={13} />
      </button>
    </div>
  );
}
