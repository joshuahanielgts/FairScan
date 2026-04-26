import { ShieldCheck } from "lucide-react";
import type { AppView } from "@/types";
import { StepIndicator } from "./StepIndicator";

interface NavbarProps {
  currentView: AppView;
  onNewAudit: () => void;
}

export function Navbar({ currentView, onNewAudit }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-bg/90 px-6 backdrop-blur">
      <button
        type="button"
        onClick={onNewAudit}
        className="flex items-center gap-2"
      >
        <ShieldCheck size={20} className="text-brand" strokeWidth={2.25} />
        <span className="text-[18px] font-semibold tracking-tight text-text-primary">
          FairScan
        </span>
      </button>

      <div className="hidden md:block">
        <StepIndicator currentView={currentView as AppView} />
      </div>

      <div className="flex items-center gap-3 relative">
        <button
          type="button"
          onClick={onNewAudit}
          className="rounded-md border border-border-2 bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-brand hover:text-text-primary"
        >
          New Audit
        </button>
      </div>
    </header>
  );
}
