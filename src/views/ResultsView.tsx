import { useState, useMemo } from "react";
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
import type { ScanResult, BiasSlice, Explanation } from "@/types";

interface ResultsViewProps {
  scanResult: ScanResult;
  onNewAudit: () => void;
}

type ChartTab = "outcome" | "fpr" | "intersectional" | "representation";

export function ResultsView({ scanResult: r, onNewAudit }: ResultsViewProps) {
  const [chartTab, setChartTab] = useState<ChartTab>("outcome");
  
  // Create explanations array from slices for GeminiPanel
  const explanations = useMemo(() => {
    return r.slices
      .filter(s => s.explanation)
      .map(s => ({
        id: s.id,
        sliceId: s.id,
        sliceLabel: s.groupLabel,
        biasType: s.biasType || 'measurement',
        text: s.explanation!
      }));
  }, [r.slices]);

  const [activeSliceId, setActiveSliceId] = useState<string | null>(
    explanations[0]?.sliceId ?? null,
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
    let worstDi = 1;
    let worstDp = 0;
    let worstRep = 0;
    for (const s of r.slices) {
      for (const m of s.metrics) {
        if (m.metricName === 'disparate_impact') {
          if (Math.abs(1 - m.value) > Math.abs(1 - worstDi)) worstDi = m.value;
        } else if (m.metricName === 'demographic_parity_gap') {
          if (m.value > worstDp) worstDp = m.value;
        } else if (m.metricName === 'representation_imbalance') {
          if (m.value > worstRep) worstRep = m.value;
        }
      }
    }
    return [
      { label: "Disparate Impact", value: worstDi, severity: r.riskLevel },
      { label: "Demographic Parity Gap", value: worstDp, severity: r.riskLevel },
      { label: "Representation Imbalance", value: worstRep, severity: r.riskLevel },
    ];
  }, [r.slices, r.riskLevel]);

  // Extract fixes from slices
  const fixes = useMemo(() => {
    const allFixes = r.slices.flatMap(s => s.fixes || []);
    // deduplicate
    const map = new Map();
    for (const f of allFixes) {
      if (!map.has(f.title)) {
        map.set(f.title, { id: crypto.randomUUID(), number: `${map.size + 1}`.padStart(2, '0'), ...f });
      }
    }
    return Array.from(map.values()).slice(0, 3); // top 3
  }, [r.slices]);

  const impactStory = r.slices[0]?.impactStory || "No impact story generated.";

  const severityCounts = {
    critical: r.overallStats.criticalCount,
    high: r.overallStats.highCount,
    medium: r.overallStats.mediumCount,
    low: r.overallStats.lowCount,
  };

  return (
    <div className="pb-24">
      {/* Top summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-8 py-5">
        <div className="font-mono text-[12px] text-text-secondary">
          {r.filename} · {r.rowCount.toLocaleString()} rows ·{" "}
          {r.sensitiveColumns.length} sensitive attributes · Scanned just now
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
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <FileDown size={12} />
            {isExporting ? "Preparing PDF..." : "Download PDF"}
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
                  {r.fairscanScore}
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
                  className={`absolute left-0 top-0 h-full rounded-full ${barColor}`}
                  style={{ width: `${r.fairscanScore}%` }}
                />
                <div
                  className="absolute -top-1 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-bg bg-text-primary"
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
                <MetricCard key={m.label} metric={m as any} />
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
              <SliceTable
                slices={r.slices as any} // mapping in SliceTable needed
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
                {chartTab === "outcome" && <OutcomeRatesChart scanResult={r} type="outcome" />}
                {chartTab === "fpr" && <ChartPlaceholder kind="fpr" />}
                {chartTab === "intersectional" && (
                  <ChartPlaceholder kind="intersectional" /> // TODO: plot.ly implementation later
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
                 <div className="rounded-xl border border-border bg-surface p-5 card-glow animate-pulse">
                   <div className="h-6 w-1/2 bg-surface-2 mb-4 rounded"></div>
                   <div className="h-24 w-full bg-surface-2 rounded-lg"></div>
                   <div className="text-[12px] text-text-secondary mt-2">Gemini analysis loading...</div>
                 </div>
              ) : (
                <GeminiPanel
                  explanations={explanations as any}
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
                {!r.geminiAnalysisComplete ? (
                  <div className="h-32 w-full bg-surface-2 animate-pulse rounded-lg"></div>
                ) : (
                  fixes.map((f: any) => (
                    <FixCard key={f.id} fix={{...f, tags: f.tags.map((t: string) => ({ label: t, tone: "blue" }))}} />
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
                Generated by Gemini 2.5 Flash · Illustrative estimate based on
                dataset disparity rates
              </p>
            </div>
          </div>
        </div>
      </div>

      {emailModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 50, backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: '16px', padding: '28px 32px', width: '100%', maxWidth: '420px'
          }}>

            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <h3 style={{ margin:0, fontSize:'17px', fontWeight:600, color:'var(--color-text-primary)' }}>
                Email Report
              </h3>
              <button onClick={() => { setEmailModalOpen(false); setEmailStatus('idle'); }} className="text-text-secondary hover:text-text-primary">
                <X size={18} />
              </button>
            </div>

            {/* Score summary inside modal */}
            <div style={{
              background:'var(--color-surface-2)', borderRadius:'10px',
              padding:'14px 16px', marginBottom:'20px', display:'flex',
              justifyContent:'space-between', alignItems:'center'
            }}>
              <span style={{ color:'var(--color-text-secondary)', fontSize:'13px' }}>
                {r.filename}
              </span>
              <span style={{ fontFamily:'monospace', fontSize:'16px', fontWeight:700 }} className={scoreColor}>
                {r.fairscanScore}/100
              </span>
            </div>

            {/* Email input */}
            {emailStatus !== 'sent' && (
              <>
                <label style={{ display:'block', fontSize:'13px',
                  color:'var(--color-text-secondary)', marginBottom:'8px' }}>
                  Send to
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  style={{
                    width:'100%', padding:'12px 14px', borderRadius:'10px',
                    background:'var(--color-surface-2)', border:'1px solid var(--color-border-2)',
                    color:'var(--color-text-primary)', fontSize:'14px',
                    outline:'none', boxSizing:'border-box', marginBottom:'12px'
                  }}
                />

                {/* What will be sent note */}
                <p style={{ margin:'0 0 20px', fontSize:'12px',
                  color:'var(--color-text-dim)', lineHeight:1.6 }}>
                  You'll receive the full report with the PDF attached and a summary
                  of all flagged slices. Your dataset is never included.
                </p>

                {/* Error message */}
                {emailStatus === 'error' && (
                  <p style={{ margin:'0 0 12px', fontSize:'13px', color:'var(--color-critical)' }}>
                    {emailError}
                  </p>
                )}

                {/* Send button */}
                <button
                  disabled={emailStatus === 'sending' || !emailInput.includes('@')}
                  onClick={handleEmailReport}
                  style={{
                    width:'100%', padding:'13px', borderRadius:'10px',
                    background:'var(--color-brand)', color:'#fff', border:'none',
                    fontSize:'15px', fontWeight:500, cursor:'pointer',
                    opacity: emailStatus === 'sending' ? 0.7 : 1
                  }}
                >
                  {emailStatus === 'sending' ? 'Generating PDF & sending...' : 'Send Report →'}
                </button>
              </>
            )}

            {/* Success state */}
            {emailStatus === 'sent' && (
              <div style={{ textAlign:'center', padding:'20px 0' }}>
                <div style={{ fontSize:'40px', marginBottom:'12px' }}>✅</div>
                <p style={{ margin:'0 0 4px', fontSize:'16px', fontWeight:600,
                  color:'var(--color-text-primary)' }}>
                  Report sent!
                </p>
                <p style={{ margin:0, fontSize:'13px', color:'var(--color-text-secondary)' }}>
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
