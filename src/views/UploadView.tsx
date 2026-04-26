import { useState } from "react";
import { ArrowRight, Brain, FileText, Lock, UploadCloud, Check } from "lucide-react";

interface UploadViewProps {
  onContinue: () => void;
}

type UploadTab = "csv" | "model";

const SAMPLES = ["UCI Adult Income", "Loan Approval", "Hiring Dataset"];

export function UploadView({ onContinue }: UploadViewProps) {
  const [tab, setTab] = useState<UploadTab>("csv");
  const [loadedSample, setLoadedSample] = useState<string | null>(null);
  const [modelText, setModelText] = useState("");

  const canContinue =
    (tab === "csv" && loadedSample !== null) ||
    (tab === "model" && modelText.trim().length > 0);

  return (
    <div className="mx-auto max-w-[720px] px-6 pb-24 pt-12">
      <h1 className="font-display text-[36px] leading-tight text-text-primary">
        Upload your dataset
      </h1>
      <p className="mt-2 flex items-center gap-1.5 text-sm text-text-secondary">
        <Lock size={14} className="text-low" />
        Your file never leaves your browser. All processing happens locally.
      </p>

      <div className="mt-8 inline-flex items-center gap-1 rounded-lg bg-surface-2 p-1">
        <TabButton
          active={tab === "csv"}
          onClick={() => setTab("csv")}
          icon={<FileText size={14} />}
          label="CSV Upload"
        />
        <TabButton
          active={tab === "model"}
          onClick={() => setTab("model")}
          icon={<Brain size={14} />}
          label="Model Description"
        />
      </div>

      <div className="mt-6">
        {tab === "csv" ? (
          <div>
            <button
              type="button"
              onClick={() => setLoadedSample("adult_income.csv")}
              className={`group flex h-[280px] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-all ${
                loadedSample
                  ? "border-low bg-low-tint"
                  : "border-border-2 bg-surface hover:border-brand hover:bg-brand-glow"
              }`}
            >
              {loadedSample ? (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-low/20">
                    <Check size={24} className="text-low" strokeWidth={2.5} />
                  </div>
                  <div className="text-[16px] font-medium text-text-primary">
                    {loadedSample} loaded
                  </div>
                  <div className="font-mono text-[12px] text-text-secondary">
                    48,842 rows · ready to scan
                  </div>
                </>
              ) : (
                <>
                  <UploadCloud size={48} className="text-brand" />
                  <div className="text-[16px] font-medium text-text-primary">
                    Drop your CSV here
                  </div>
                  <div className="text-[13px] text-text-secondary">
                    or click to browse
                  </div>
                  <div className="mt-2 text-[12px] text-text-dim">
                    Supports CSV files up to 50MB
                  </div>
                </>
              )}
            </button>

            <div className="mt-6">
              <div className="text-[13px] text-text-secondary">
                Or try a sample dataset:
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {SAMPLES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setLoadedSample("adult_income.csv")}
                    className="rounded-full border border-border bg-surface-2 px-4 py-2 text-[13px] text-text-secondary transition-colors hover:border-brand hover:text-text-primary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <label className="text-[13px] font-medium text-text-primary">
              Paste your model description or LLM system prompt
            </label>
            <textarea
              value={modelText}
              onChange={(e) => setModelText(e.target.value)}
              rows={10}
              placeholder={`Example: "Loan approval model using income, age, ZIP code,\nand employment history to determine creditworthiness..."`}
              className="mt-2 h-[240px] w-full resize-none rounded-xl border border-border bg-surface-2 p-4 font-mono text-[13px] text-text-primary placeholder:text-text-dim focus:border-brand focus:outline-none"
            />
            <div className="mt-2 flex items-center gap-1.5 text-[12px] text-text-secondary">
              <Brain size={13} className="text-brand" />
              Gemini will identify proxy features and bias risks automatically.
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={!canContinue}
        onClick={onContinue}
        className={`mt-10 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-xl text-[16px] font-medium transition-opacity ${
          canContinue
            ? "bg-brand text-white hover:opacity-90"
            : "cursor-not-allowed bg-surface-2 text-text-dim"
        }`}
      >
        Continue <ArrowRight size={16} />
      </button>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-[13px] font-medium transition-all ${
        active
          ? "border-b-2 border-brand bg-surface text-text-primary"
          : "text-text-secondary hover:text-text-primary"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
