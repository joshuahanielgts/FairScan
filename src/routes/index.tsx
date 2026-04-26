import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { AppView } from "@/types";
import { LandingView } from "@/views/LandingView";
import { UploadView } from "@/views/UploadView";
import { ConfigureView } from "@/views/ConfigureView";
import { ScanningView } from "@/views/ScanningView";
import { ResultsView } from "@/views/ResultsView";
import { Navbar } from "@/components/Navbar";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [view, setView] = useState<AppView>("landing");

  const handleNewAudit = () => setView("upload");

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
          <UploadView onContinue={() => setView("configure")} />
        )}
        {view === "configure" && (
          <ConfigureView
            onBack={() => setView("upload")}
            onRunScan={() => setView("scanning")}
          />
        )}
        {view === "scanning" && (
          <ScanningView onComplete={() => setView("results")} />
        )}
        {view === "results" && (
          <ResultsView onNewAudit={() => setView("upload")} />
        )}
      </div>
    </div>
  );
}
