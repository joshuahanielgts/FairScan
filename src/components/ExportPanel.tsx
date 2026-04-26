import { useEffect } from "react";
import { Download, Eye, FileDown, X } from "lucide-react";
import type { ScanResult } from "@/types";

interface ExportPanelProps {
  open: boolean;
  onClose: () => void;
  result: ScanResult;
}

export function ExportPanel({ open, onClose, result }: ExportPanelProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
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
    // Static mock — produce a tiny placeholder text blob so the click feels real,
    // no server, no real PDF generation.
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
  };

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
          <div className="mb-3 flex items-center gap-2 text-[12px] uppercase tracking-wide text-text-dim">
            <Eye size={13} />
            Live preview
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
                {result.slices.slice(0, 5).map((s) => (
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

            <div className="mt-4 text-[10px] italic text-[#6b7280]">
              Page 1 of 4 · Generated by FairScan · Mock preview
            </div>
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
              <span className="font-mono text-text-primary">~4</span>
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
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border-2 bg-surface text-[13px] font-medium text-text-primary transition-colors hover:border-brand"
            >
              <FileDown size={14} />
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
