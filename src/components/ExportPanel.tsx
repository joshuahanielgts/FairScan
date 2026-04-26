import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileDown,
  Link2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { ScanResult } from "@/types";

interface ExportPanelProps {
  open: boolean;
  onClose: () => void;
  result: ScanResult;
}

const TOTAL_PAGES = 4;
const STORAGE_KEY = "fairscan.exportPanel.v1";

interface PersistedState {
  open: boolean;
  page: number;
}

function readPersisted(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    if (typeof parsed.open !== "boolean") return null;
    const page =
      typeof parsed.page === "number" &&
      parsed.page >= 1 &&
      parsed.page <= TOTAL_PAGES
        ? parsed.page
        : 1;
    return { open: parsed.open, page };
  } catch {
    return null;
  }
}

export function ExportPanel({ open, onClose, result }: ExportPanelProps) {
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Restore last selected page on mount
  useEffect(() => {
    const persisted = readPersisted();
    if (persisted) setCurrentPage(persisted.page);
  }, []);

  // Persist open state + current page
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ open, page: currentPage } satisfies PersistedState),
      );
    } catch {
      // ignore quota errors
    }
  }, [open, currentPage]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight")
        setCurrentPage((p) => Math.min(TOTAL_PAGES, p + 1));
      if (e.key === "ArrowLeft") setCurrentPage((p) => Math.max(1, p - 1));
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleMockDownload = () => {
    const blob = new Blob(
      [
        `FairScan Report (mock)\n` +
          `=======================\n\n` +
          `Dataset:    ${result.fileName}\n` +
          `Rows:       ${result.rowCount.toLocaleString()}\n` +
          `Score:      ${result.fairScanScore}/100\n` +
          `Flagged:    ${result.slices.length} slices\n\n` +
          `This is a mock export. Real PDF generation is not wired up.\n`,
      ],
      { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fairscan-report.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    toast.success("Report downloaded", {
      description: "fairscan-report.txt saved to your downloads.",
    });
  };

  const handleCopyShareUrl = async () => {
    // Mock share URL — deterministic-ish per dataset
    const slug = result.fileName.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    const id = Math.abs(
      [...result.fileName].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7),
    )
      .toString(36)
      .padStart(6, "0");
    const shareUrl = `https://fairscan.app/r/${slug}-${id}`;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const ta = document.createElement("textarea");
        ta.value = shareUrl;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      toast.success("Share link copied", {
        description: shareUrl,
      });
    } catch {
      toast.error("Couldn't copy link", { description: shareUrl });
    }
  };

  const goPrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goNext = () => setCurrentPage((p) => Math.min(TOTAL_PAGES, p + 1));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
        className="relative grid w-full max-w-[960px] grid-cols-1 overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl md:grid-cols-[1fr_360px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Preview pane */}
        <div className="flex flex-col bg-surface-2 p-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[12px] uppercase tracking-wide text-text-dim">
              <Eye size={13} />
              Live preview
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={goPrev}
                disabled={currentPage === 1}
                aria-label="Previous page"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border-2 bg-surface text-text-secondary transition-colors hover:border-brand hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border-2 disabled:hover:text-text-secondary"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="min-w-[58px] text-center font-mono text-[11px] text-text-secondary">
                {currentPage} / {TOTAL_PAGES}
              </span>
              <button
                type="button"
                onClick={goNext}
                disabled={currentPage === TOTAL_PAGES}
                aria-label="Next page"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border-2 bg-surface text-text-secondary transition-colors hover:border-brand hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border-2 disabled:hover:text-text-secondary"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Mock PDF page */}
          <div className="flex-1 overflow-auto rounded-lg border border-border-2 bg-[#f5f6fa] p-6 text-[#1a1f2c] shadow-inner">
            <div className="mb-4 flex items-center justify-between border-b border-[#d1d5db] pb-3">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-brand" />
                <span className="font-semibold text-[#0c0f14]">
                  FairScan Report
                </span>
              </div>
              <span className="font-mono text-[11px] text-[#6b7280]">
                {new Date().toISOString().slice(0, 10)}
              </span>
            </div>

            <PdfPage page={currentPage} result={result} />

            <div className="mt-4 text-[10px] italic text-[#6b7280]">
              Page {currentPage} of {TOTAL_PAGES} · Generated by FairScan · Mock
              preview
            </div>
          </div>

          {/* Page dots */}
          <div className="mt-3 flex items-center justify-center gap-1.5">
            {Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setCurrentPage(p)}
                aria-label={`Go to page ${p}`}
                className={`h-1.5 rounded-full transition-all ${
                  p === currentPage
                    ? "w-6 bg-brand"
                    : "w-1.5 bg-border-2 hover:bg-text-dim"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Side controls */}
        <div className="flex flex-col gap-5 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2
                id="export-title"
                className="font-display text-[22px] leading-tight text-text-primary"
              >
                Generate PDF report
              </h2>
              <p className="mt-1 text-[12px] text-text-secondary">
                A consulting-grade fairness report you can share with your team.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-md p-1 text-text-dim transition-colors hover:bg-surface-2 hover:text-text-primary"
            >
              <X size={16} />
            </button>
          </div>

          <div className="rounded-lg border border-border bg-surface-2 p-3 text-[12px]">
            <div className="mb-2 font-medium uppercase tracking-wide text-text-dim">
              Includes
            </div>
            <ul className="space-y-1.5 text-text-secondary">
              <li>• FairScan score & risk summary</li>
              <li>• Top {result.slices.length} flagged slices</li>
              <li>• Gemini explanations</li>
              <li>• Recommended fixes</li>
              <li>• Real-world impact estimate</li>
            </ul>
          </div>

          <div className="rounded-lg border border-border bg-surface-2 p-3">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-text-dim">Format</span>
              <span className="font-mono text-text-primary">PDF · A4</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[12px]">
              <span className="text-text-dim">Pages</span>
              <span className="font-mono text-text-primary">{TOTAL_PAGES}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[12px]">
              <span className="text-text-dim">Generated</span>
              <span className="font-mono text-text-primary">browser-side</span>
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-2">
            <button
              type="button"
              onClick={handleMockDownload}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand text-[14px] font-medium text-white transition-opacity hover:opacity-90"
            >
              <Download size={15} />
              Download report
            </button>
            <button
              type="button"
              onClick={handleCopyShareUrl}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border-2 bg-surface text-[13px] font-medium text-text-primary transition-colors hover:border-brand"
            >
              <Link2 size={14} />
              Copy share link
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg text-[12px] font-medium text-text-dim transition-colors hover:text-text-primary"
            >
              <FileDown size={12} />
              Open full preview
            </button>
            <p className="text-center text-[11px] text-text-dim">
              Mock export · no data leaves your browser
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PdfPage({ page, result }: { page: number; result: ScanResult }) {
  if (page === 1) {
    return (
      <>
        <div className="mb-4">
          <div className="text-[10px] uppercase tracking-wide text-[#6b7280]">
            Dataset
          </div>
          <div className="font-mono text-[12px] text-[#1a1f2c]">
            {result.fileName} · {result.rowCount.toLocaleString()} rows
          </div>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-3">
          <div className="rounded border border-[#d1d5db] bg-white p-3">
            <div className="text-[10px] uppercase tracking-wide text-[#6b7280]">
              FairScan Score
            </div>
            <div className="mt-1 font-display text-[28px] leading-none text-[#f97316]">
              {result.fairScanScore}
              <span className="text-[12px] text-[#6b7280]">/100</span>
            </div>
          </div>
          <div className="rounded border border-[#d1d5db] bg-white p-3">
            <div className="text-[10px] uppercase tracking-wide text-[#6b7280]">
              Flagged slices
            </div>
            <div className="mt-1 font-mono text-[20px] font-bold text-[#1a1f2c]">
              {result.slices.length}
            </div>
          </div>
          <div className="rounded border border-[#d1d5db] bg-white p-3">
            <div className="text-[10px] uppercase tracking-wide text-[#6b7280]">
              Sensitive attrs
            </div>
            <div className="mt-1 font-mono text-[20px] font-bold text-[#1a1f2c]">
              {result.sensitiveAttributeCount}
            </div>
          </div>
        </div>

        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]">
          Executive summary
        </div>
        <p className="text-[12px] leading-relaxed text-[#374151]">
          This audit identified {result.slices.length} statistically significant
          bias slices across {result.sensitiveAttributeCount} sensitive
          attributes. The dataset shows disparities that warrant remediation
          before deployment in production decisioning systems.
        </p>
      </>
    );
  }

  if (page === 2) {
    return (
      <>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]">
          Top flagged slices
        </div>
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-[#d1d5db] text-left text-[#6b7280]">
              <th className="py-1 pr-2">Slice</th>
              <th className="py-1 pr-2">Metric</th>
              <th className="py-1 pr-2 text-right">Value</th>
              <th className="py-1 text-right">Severity</th>
            </tr>
          </thead>
          <tbody>
            {result.slices.slice(0, 8).map((s) => (
              <tr key={s.id} className="border-b border-[#e5e7eb]">
                <td className="py-1.5 pr-2 text-[#1a1f2c]">{s.slice}</td>
                <td className="py-1.5 pr-2 text-[#4b5563]">{s.metric}</td>
                <td className="py-1.5 pr-2 text-right font-mono text-[#1a1f2c]">
                  {s.value.toFixed(2)}
                </td>
                <td className="py-1.5 text-right capitalize text-[#1a1f2c]">
                  {s.severity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  }

  if (page === 3) {
    return (
      <>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]">
          Gemini explanations
        </div>
        <div className="space-y-3">
          {result.explanations.slice(0, 3).map((e) => (
            <div
              key={e.sliceId}
              className="rounded border border-[#d1d5db] bg-white p-3"
            >
              <div className="mb-1 font-mono text-[10px] uppercase text-[#6b7280]">
                {e.sliceId}
              </div>
              <p className="text-[11px] leading-relaxed text-[#1a1f2c]">
                {e.text}
              </p>
            </div>
          ))}
        </div>
      </>
    );
  }

  // page 4
  return (
    <>
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]">
        Recommended fixes
      </div>
      <ol className="list-decimal space-y-2 pl-5 text-[12px] text-[#1a1f2c]">
        {result.fixes.slice(0, 5).map((f) => (
          <li key={f.id}>
            <span className="font-medium">{f.title}</span>
            <div className="text-[11px] text-[#4b5563]">{f.body}</div>
          </li>
        ))}
      </ol>

      <div className="mt-5 rounded border-l-[3px] border-[#f97316] bg-[#fff7ed] p-3">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-[#9a3412]">
          Real-world impact
        </div>
        <p className="mt-1 text-[11px] italic leading-relaxed text-[#7c2d12]">
          “{result.impactStory}”
        </p>
      </div>
    </>
  );
}
