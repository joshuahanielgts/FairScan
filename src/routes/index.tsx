import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { AppView } from "@/types";
import { LandingView } from "@/views/LandingView";
import { UploadView } from "@/views/UploadView";
import { ConfigureView } from "@/views/ConfigureView";
import { ScanningView } from "@/views/ScanningView";
import { ResultsView } from "@/views/ResultsView";
import { TextModeResultsView } from "@/views/TextModeResultsView";
import { Navbar } from "@/components/Navbar";
import type { CSVRow, ColumnMeta, ScanResult, TextModeResult } from "@/types";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [view, setView] = useState<AppView | "textResults">("landing");
  
  const [datasetContext, setDatasetContext] = useState<{ file: File | null; rows: CSVRow[]; columns: ColumnMeta[]; detectedOutcome: string | null } | null>(null);
  const [columnOverrides, setColumnOverrides] = useState<{ name: string; role: ColumnMeta['role'] }[]>([]);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [textModeResult, setTextModeResult] = useState<TextModeResult | null>(null);
  const [summaryEmailOpts, setSummaryEmailOpts] = useState<{ wantsEmail: boolean; email: string }>({ wantsEmail: false, email: '' });

  const handleNewAudit = () => {
    setView("upload");
    setDatasetContext(null);
    setColumnOverrides([]);
    setScanResult(null);
    setTextModeResult(null);
    setSummaryEmailOpts({ wantsEmail: false, email: '' });
  };

  const showNavbar = view !== "landing";

  return (
    <div className="min-h-screen bg-bg text-text-primary">
      {showNavbar && (
        <Navbar currentView={view} onNewAudit={handleNewAudit} />
      )}

      <div key={view} className="animate-fade-in">
        {view === "landing" && (
          <LandingView onStart={() => setView("upload")} />
        )}
        {view === "upload" && (
          <UploadView 
            onContinueCSV={(ctx) => {
              setDatasetContext(ctx);
              setView("configure");
            }}
            onContinueTextMode={(res) => {
              setTextModeResult(res);
              setView("textResults");
            }}
          />
        )}
        {view === "configure" && datasetContext && (
          <ConfigureView
            columns={datasetContext.columns}
            onBack={() => setView("upload")}
            onRunScan={(overrides, wantsEmail, email) => {
              setColumnOverrides(overrides);
              setSummaryEmailOpts({ wantsEmail, email });
              setView("scanning");
            }}
          />
        )}
        {view === "scanning" && datasetContext && (
          <ScanningView 
            file={datasetContext.file!}
            columnOverrides={columnOverrides}
            outcomeColumn={datasetContext.detectedOutcome || ""}
            summaryEmailOpts={summaryEmailOpts}
            onComplete={(res) => {
              setScanResult(res);
              setView("results");
            }} 
            onBack={() => setView("configure")}
          />
        )}
        {view === "results" && scanResult && (
          <ResultsView scanResult={scanResult} onNewAudit={handleNewAudit} />
        )}
        {view === "textResults" && textModeResult && (
          <TextModeResultsView result={textModeResult} onNewAudit={handleNewAudit} />
        )}
      </div>
    </div>
  );
}
