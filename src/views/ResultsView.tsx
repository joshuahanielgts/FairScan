import { useState, useMemo, useEffect } from "react";
import {
  AlertTriangle,
  FileDown,
  RotateCcw,
  ShieldAlert,
  Wrench,
  Mail,
  X
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { SliceTable } from "@/components/SliceTable";
import { RiskDonut } from "@/components/RiskDonut";
import { OutcomeRatesChart } from "@/components/OutcomeRatesChart";
import { ChartPlaceholder } from "@/components/ChartPlaceholder";
import { GeminiPanel } from "@/components/GeminiPanel";
import { FixCard } from "@/components/FixCard";
import { exportReport } from "@/lib/exportReport";
import { emailReport } from "@/lib/emailReport";
import type { ScanResult, BiasSlice } from "@/types";

interface ResultsViewProps {
  scanResult: ScanResult;
  onNewAudit: () => void;
}

type ChartTab = "outcome" | "fpr" | "intersectional" | "representation";

export function ResultsView({ scanResult: r, onNewAudit }: ResultsViewProps) {
  const [chartTab, setChartTab] = useState<ChartTab>("outcome");
  
  const [activeSliceId, setActiveSliceId] = useState<string | null>(
    r.slices[0]?.id || null,
  );
  
  const [isExporting, setIsExporting] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailInput, setEmailInput]         = useState('');
  const [emailStatus, setEmailStatus]       = useState<'idle'|'sending'|'sent'|'error'>('idle');
  const [emailError, setEmailError]         = useState('');

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    try {
      await exportReport(r);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleEmailReport = async () => {
    if (!emailInput || !r) return;
    setEmailStatus('sending');

    try {
      // Step 1: Generate PDF and get base64
      const pdfBase64 = await exportReport(r);

      // Step 2: Send email with PDF attached
      const result = await emailReport({
        to: emailInput,
        scanResult: r,
        pdfBase64,
        mode: 'full',
      });

      if (result.success) {
        setEmailStatus('sent');
        setTimeout(() => {
          setEmailModalOpen(false);
          setEmailStatus('idle');
        }, 3000);
      } else {
        setEmailStatus('error');
        setEmailError(result.error ?? 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setEmailStatus('error');
      setEmailError('Failed to generate PDF. Please try downloading first.');
    }
  };

  const handleSelectSlice = (slice: BiasSlice) => {
    setActiveSliceId(slice.id);
    document
      .getElementById("gemini-panel")
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const scoreColor =
    r.fairscanScore < 40
      ? "text-critical"
      : r.fairscanScore < 60
        ? "text-high"
        : r.fairscanScore < 80
          ? "text-medium"
          : "text-low";

  const barColor =
    r.fairscanScore < 40
      ? "bg-critical"
      : r.fairscanScore < 60
        ? "bg-high"
        : r.fairscanScore < 80
          ? "bg-medium"
          : "bg-low";

  // Derive mini metric cards from slices (worst across all slices)
  const metrics = useMemo(() => {
    const allMetrics = r.slices.flatMap(s => s.metrics);
    
    const worstDi = Math.min(
      ...allMetrics.filter(m => m.metricName === 'disparate_impact').map(m => m.value),
      1
    );

    const worstDp = Math.max(
      ...allMetrics.filter(m => m.metricName === 'demographic_parity_gap').map(m => m.value),
      0
    );

    const worstRep = Math.max(
      ...allMetrics.filter(m => m.metricName === 'representation_imbalance').map(m => m.value),
      0
    );

    return [
      { label: "Disparate Impact", value: worstDi, severity: r.riskLevel },
      { label: "Demographic Parity Gap", value: worstDp, severity: r.riskLevel },
      { label: "Representation Imbalance", value: worstRep, severity: r.riskLevel },
    ];
  }, [r.slices, r.riskLevel]);

  // Extract fixes from slices (Top 3 from the most critical slice)
  const fixes = r.slices[0]?.fixes;

  const impactStory = r.slices[0]?.impactStory || "No impact story generated.";

  const severityCounts = {
    critical: r.overallStats.criticalCount,
    high: r.overallStats.highCount,
    medium: r.overallStats.mediumCount,
    low: r.overallStats.lowCount,
  };

  // Score animation logic
  const [animatedScore, setAnimatedScore] = useState(0);
  useEffect(() => {
    const duration = 800;
    const startTime = Date.now();
    const animate = () => {
      const now = Date.now();
      const progress = Math.min(1, (now - startTime) / duration);
      setAnimatedScore(Math.round(progress * r.fairscanScore));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [r.fairscanScore]);

  return (
    <div className="pb-24 animate-fade-in">
      {/* Top summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-8 py-5">
        <div className="font-mono text-[12px] text-text-secondary">
          {r.filename} · {r.rowCount.toLocaleString()} rows ·{" "}
          {r.sensitiveColumns.length} sensitive attributes · Scanned {new Date(r.scannedAt).toLocaleTimeString()}
        </div>
        <div className="flex items-center gap-2">
          <NewAuditButton onConfirm={onNewAudit} />
          
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <FileDown size={12} />
            {isExporting ? "Preparing report..." : "Download PDF"}
          </button>
          <button
            type="button"
            onClick={() => { setEmailStatus('idle'); setEmailModalOpen(true); }}
            className="inline-flex items-center gap-1.5 rounded-md border border-border-2 bg-surface px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:border-brand"
          >
            <Mail size={12} />
            Email Report
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
                  {animatedScore}
                </span>
                <span className="text-[20px] text-text-secondary">/100</span>
              </div>
              <div className="mt-3">
                <span className={`inline-flex items-center gap-1.5 rounded-full border-l-[3px] px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide border-l-${r.riskLevel} bg-${r.riskLevel}-tint text-${r.riskLevel}`}>
                  <ShieldAlert size={12} strokeWidth={2.25} />
                  {r.riskLevel} Risk
                </span>
              </div>
              <div className="relative mt-6 h-1.5 w-full rounded-full bg-surface-2">
                <div
                  className={`absolute left-0 top-0 h-full rounded-full ${barColor} transition-all duration-1000 ease-out`}
                  style={{ width: `${r.fairscanScore}%` }}
                />
                <div
                  className="absolute -top-1 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-bg bg-text-primary transition-all duration-1000 ease-out"
                  style={{ left: `${r.fairscanScore}%` }}
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
              {metrics.map((m) => (
                <MetricCard key={m.label} metric={m} />
              ))}
            </div>

            {/* Donut */}
            <div className="flex flex-col items-center justify-center gap-3">
              <RiskDonut counts={severityCounts} />
              <div className="text-center text-[13px] text-text-secondary">
                {r.overallStats.totalSlices} slices flagged across
                <br />{r.sensitiveColumns.length} sensitive attributes
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
              {r.slices.length === 0 ? (
                <div className="py-12 text-center rounded-lg border-2 border-dashed border-border bg-surface-2">
                   <div className="text-4xl mb-3">✅</div>
                   <h3 className="text-lg font-medium text-text-primary">No bias detected</h3>
                   <p className="text-sm text-text-secondary">This dataset passes all primary fairness checks.</p>
                </div>
              ) : (
                <SliceTable
                  slices={r.slices}
                  activeSliceId={activeSliceId}
                  onSelectSlice={handleSelectSlice}
                />
              )}
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
                {chartTab === "outcome" && <OutcomeRatesChart scanResult={r} type="outcome" />}
                {chartTab === "fpr" && <ChartPlaceholder kind="fpr" />}
                {chartTab === "intersectional" && (
                  <ChartPlaceholder kind="intersectional" />
                )}
                {chartTab === "representation" && (
                  <OutcomeRatesChart scanResult={r} type="representation" />
                )}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            <div id="gemini-panel">
              {!r.geminiAnalysisComplete ? (
                 <div className="space-y-3">
                   <div className="rounded-xl border border-border bg-surface p-5 card-glow animate-pulse">
                     <div className="h-6 w-1/2 bg-surface-2 mb-4 rounded"></div>
                     <div className="h-24 w-full bg-surface-2 rounded-lg"></div>
                   </div>
                   <div className="rounded-xl border border-border bg-surface p-5 card-glow animate-pulse opacity-60">
                     <div className="h-6 w-1/3 bg-surface-2 mb-4 rounded"></div>
                     <div className="h-20 w-full bg-surface-2 rounded-lg"></div>
                   </div>
                 </div>
              ) : (
                <GeminiPanel
                  slices={r.slices}
                  totalCount={r.slices.length}
                  highlightedSliceId={activeSliceId}
                />
              )}
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
                {!fixes ? (
                  <div className="space-y-2">
                    <div className="h-24 w-full bg-surface-2 animate-pulse rounded-lg"></div>
                    <div className="h-24 w-full bg-surface-2 animate-pulse rounded-lg opacity-60"></div>
                  </div>
                ) : (
                  fixes.slice(0, 3).map((f, i) => (
                    <FixCard key={f.title} fix={f} index={i} />
                  ))
                )}
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
                  “{!r.geminiAnalysisComplete ? "Waiting for Gemini analysis..." : impactStory}”
                </p>
              </blockquote>
              <p className="mt-2 text-[11px] text-text-dim">
                Generated by Gemini · Illustrative estimate based on
                dataset disparity rates
              </p>
            </div>
          </div>
        </div>
      </div>

      {emailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in"
             onClick={() => { setEmailModalOpen(false); setEmailStatus('idle'); }}>
          <div className="w-full max-w-[420px] rounded-2xl border border-border bg-surface p-8 shadow-2xl"
               onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-[17px] font-semibold text-text-primary">
                Email Report
              </h3>
              <button onClick={() => { setEmailModalOpen(false); setEmailStatus('idle'); }} className="text-text-secondary hover:text-text-primary transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Score summary inside modal */}
            <div className="mb-5 flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3.5">
              <span className="text-[13px] text-text-secondary truncate pr-4">
                {r.filename}
              </span>
              <span className={`font-mono text-[16px] font-bold ${scoreColor}`}>
                {r.fairscanScore}/100
              </span>
            </div>

            {/* Email input */}
            {emailStatus !== 'sent' && (
              <>
                <label className="mb-2 block text-[13px] text-text-secondary">
                  Send to
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={emailInput}
                  autoFocus
                  onChange={e => setEmailInput(e.target.value)}
                  className="mb-3 w-full rounded-xl border border-border-2 bg-surface-2 px-4 py-3 text-[14px] text-text-primary outline-none focus:border-brand transition-colors"
                />

                <p className="mb-5 text-[12px] leading-relaxed text-text-dim">
                  You'll receive the full report with the PDF attached and a summary
                  of all flagged slices. Your dataset is never included.
                </p>

                {/* Error message */}
                {emailStatus === 'error' && (
                  <p className="mb-3 text-[13px] text-critical">
                    {emailError}
                  </p>
                )}

                {/* Send button */}
                <button
                  disabled={emailStatus === 'sending' || !emailInput.includes('@')}
                  onClick={handleEmailReport}
                  className="w-full rounded-xl bg-brand py-3.5 text-[15px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {emailStatus === 'sending' ? 'Generating PDF & sending...' : 'Send Report →'}
                </button>
              </>
            )}

            {/* Success state */}
            {emailStatus === 'sent' && (
              <div className="py-5 text-center animate-fade-in">
                <div className="mb-3 text-4xl">✅</div>
                <p className="mb-1 text-[16px] font-semibold text-text-primary">
                  Report sent!
                </p>
                <p className="text-[13px] text-text-secondary">
                  Check your inbox at {emailInput}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NewAuditButton({ onConfirm }: { onConfirm: () => void }) {
  const [showConfirm, setShowConfirm] = useState(false);

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-surface-2 px-2 py-1 border border-brand/20 animate-fade-in">
        <span className="text-[11px] text-text-secondary font-medium px-1">Discard results?</span>
        <button onClick={() => setShowConfirm(false)} className="text-[11px] font-bold text-text-dim hover:text-text-primary px-1.5 py-0.5">Cancel</button>
        <button onClick={onConfirm} className="text-[11px] font-bold text-brand hover:underline px-1.5 py-0.5">Start New</button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setShowConfirm(true)}
      className="inline-flex items-center gap-1.5 rounded-md border border-border-2 bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-brand hover:text-text-primary"
    >
      <RotateCcw size={12} />
      New Audit
    </button>
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
