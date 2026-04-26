import { useState } from "react";
import {
  AlertTriangle,
  FileDown,
  RotateCcw,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import { mockScanResult } from "@/data/mockData";
import { MetricCard } from "@/components/MetricCard";
import { SliceTable } from "@/components/SliceTable";
import { RiskDonut } from "@/components/RiskDonut";
import { OutcomeRatesChart } from "@/components/OutcomeRatesChart";
import { ChartPlaceholder } from "@/components/ChartPlaceholder";
import { GeminiPanel } from "@/components/GeminiPanel";
import { FixCard } from "@/components/FixCard";
import type { BiasSlice } from "@/types";

interface ResultsViewProps {
  onNewAudit: () => void;
}

type ChartTab = "outcome" | "fpr" | "intersectional" | "representation";

export function ResultsView({ onNewAudit }: ResultsViewProps) {
  const r = mockScanResult;
  const [chartTab, setChartTab] = useState<ChartTab>("outcome");
  const [activeSliceId, setActiveSliceId] = useState<string | null>(
    r.explanations[0]?.sliceId ?? null,
  );
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => setExporting(false), 1500);
  };

  const handleSelectSlice = (slice: BiasSlice) => {
    setActiveSliceId(slice.id);
    // Scroll Gemini panel into view
    document
      .getElementById("gemini-panel")
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const scoreColor =
    r.fairScanScore < 40
      ? "text-critical"
      : r.fairScanScore < 60
        ? "text-high"
        : r.fairScanScore < 80
          ? "text-medium"
          : "text-low";

  const barColor =
    r.fairScanScore < 40
      ? "bg-critical"
      : r.fairScanScore < 60
        ? "bg-high"
        : r.fairScanScore < 80
          ? "bg-medium"
          : "bg-low";

  return (
    <div className="pb-24">
      {/* Top summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-8 py-5">
        <div className="font-mono text-[12px] text-text-secondary">
          {r.fileName} · {r.rowCount.toLocaleString()} rows ·{" "}
          {r.sensitiveAttributeCount} sensitive attributes · Scanned just now
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onNewAudit}
            className="inline-flex items-center gap-1.5 rounded-md border border-border-2 bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-brand hover:text-text-primary"
          >
            <RotateCcw size={12} />
            New Audit
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <FileDown size={12} />
            {exporting ? "Preparing report..." : "Export PDF Report"}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] px-6 pt-6 lg:px-8">
        {/* Score hero */}
        <div className="rounded-2xl border border-border bg-surface p-8 card-glow">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr_0.9fr]">
            {/* Score */}
            <div>
              <div className="text-[13px] font-medium uppercase tracking-wide text-text-secondary">
                FairScan Score
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span
                  className={`font-display text-[96px] leading-none ${scoreColor}`}
                >
                  {r.fairScanScore}
                </span>
                <span className="text-[20px] text-text-secondary">/100</span>
              </div>
              <div className="mt-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border-l-[3px] border-l-high bg-high-tint px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-high">
                  <ShieldAlert size={12} strokeWidth={2.25} />
                  High Risk
                </span>
              </div>
              <div className="relative mt-6 h-1.5 w-full rounded-full bg-surface-2">
                <div
                  className={`absolute left-0 top-0 h-full rounded-full ${barColor}`}
                  style={{ width: `${r.fairScanScore}%` }}
                />
                <div
                  className="absolute -top-1 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-bg bg-text-primary"
                  style={{ left: `${r.fairScanScore}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between font-mono text-[10px] text-text-dim">
                <span>0</span>
                <span>40</span>
                <span>60</span>
                <span>80</span>
                <span>100</span>
              </div>
            </div>

            {/* Mini metric cards */}
            <div className="space-y-2.5">
              {r.metrics.map((m) => (
                <MetricCard key={m.label} metric={m} />
              ))}
            </div>

            {/* Donut */}
            <div className="flex flex-col items-center justify-center gap-3">
              <RiskDonut counts={r.severityCounts} />
              <div className="text-center text-[13px] text-text-secondary">
                7 slices flagged across
                <br />3 sensitive attributes
              </div>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.85fr_1fr]">
          {/* LEFT */}
          <div className="space-y-6">
            {/* Slice table card */}
            <div className="rounded-xl border border-border bg-surface p-5 card-glow">
              <div className="mb-4 flex items-center gap-2">
                <h2 className="text-[16px] font-medium text-text-primary">
                  Flagged Bias Slices
                </h2>
                <span className="rounded-full bg-brand-glow px-2 py-0.5 text-[11px] font-medium text-brand">
                  {r.slices.length}
                </span>
              </div>
              <SliceTable
                slices={r.slices}
                activeSliceId={activeSliceId}
                onSelectSlice={handleSelectSlice}
              />
            </div>

            {/* Visualizations */}
            <div className="rounded-xl border border-border bg-surface p-5 card-glow">
              <h2 className="text-[16px] font-medium text-text-primary">
                Fairness Visualizations
              </h2>
              <div className="mt-4 flex flex-wrap gap-1 border-b border-border">
                <ChartTabBtn
                  label="Outcome Rates"
                  active={chartTab === "outcome"}
                  onClick={() => setChartTab("outcome")}
                />
                <ChartTabBtn
                  label="FPR / FNR"
                  active={chartTab === "fpr"}
                  onClick={() => setChartTab("fpr")}
                />
                <ChartTabBtn
                  label="Intersectional"
                  active={chartTab === "intersectional"}
                  onClick={() => setChartTab("intersectional")}
                />
                <ChartTabBtn
                  label="Representation"
                  active={chartTab === "representation"}
                  onClick={() => setChartTab("representation")}
                />
              </div>
              <div className="mt-4">
                {chartTab === "outcome" && <OutcomeRatesChart />}
                {chartTab === "fpr" && <ChartPlaceholder kind="fpr" />}
                {chartTab === "intersectional" && (
                  <ChartPlaceholder kind="intersectional" />
                )}
                {chartTab === "representation" && (
                  <ChartPlaceholder kind="representation" />
                )}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            <div id="gemini-panel">
              <GeminiPanel
                explanations={r.explanations}
                totalCount={r.slices.length}
                highlightedSliceId={activeSliceId}
              />
            </div>

            {/* Fix recommendations */}
            <div className="rounded-xl border border-border bg-surface p-5 card-glow">
              <div className="mb-3 flex items-center gap-2">
                <Wrench size={16} className="text-medium" />
                <h3 className="text-sm font-medium text-text-primary">
                  Recommended Fixes
                </h3>
              </div>
              <div className="space-y-2">
                {r.fixes.map((f) => (
                  <FixCard key={f.id} fix={f} />
                ))}
              </div>
            </div>

            {/* Impact story */}
            <div className="rounded-xl border border-border bg-surface p-5 card-glow">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle size={16} className="text-medium" />
                <h3 className="text-sm font-medium text-text-primary">
                  Real-World Impact
                </h3>
              </div>
              <blockquote className="rounded-r-xl border-l-[3px] border-medium bg-surface-2 p-4">
                <p className="font-display text-[15px] italic leading-relaxed text-text-secondary">
                  “{r.impactStory}”
                </p>
              </blockquote>
              <p className="mt-2 text-[11px] text-text-dim">
                Generated by Gemini 2.5 Flash · Illustrative estimate based on
                dataset disparity rates
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartTabBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px border-b-2 px-3 py-2 text-[13px] font-medium transition-colors ${
        active
          ? "border-brand text-text-primary"
          : "border-transparent text-text-secondary hover:text-text-primary"
      }`}
    >
      {label}
    </button>
  );
}
