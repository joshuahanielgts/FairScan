import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { ArrowRight, Brain, FileText, Lock, UploadCloud, Check, Loader2 } from "lucide-react";
import { parseCSV, analyzeColumns, detectOutcomeColumn } from "@/lib/csvParser";
import { analyzeModelDescription } from "@/lib/geminiClient";
import type { CSVRow, ColumnMeta, TextModeResult } from "@/types";

interface UploadViewProps {
  onContinueCSV: (ctx: { file: File | null; rows: CSVRow[]; columns: ColumnMeta[]; detectedOutcome: string | null }) => void;
  onContinueTextMode: (res: TextModeResult) => void;
}

type UploadTab = "csv" | "model";

const SAMPLES = ["adult_income.csv", "loan_approval.csv", "hiring.csv", "credit_risk_large.csv"];

export function UploadView({ onContinueCSV, onContinueTextMode }: UploadViewProps) {
  const [tab, setTab] = useState<UploadTab>("csv");
  const [modelText, setModelText] = useState("");
  
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<CSVRow[]>([]);
  const [columns, setColumns] = useState<ColumnMeta[]>([]);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isAnalyzingText, setIsAnalyzingText] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const canContinue =
    (tab === "csv" && rows.length > 0) ||
    (tab === "model" && modelText.trim().length > 0);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      await processFile(droppedFile);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      await processFile(selectedFile);
    }
  };

  const processFile = async (f: File) => {
    setError(null);
    if (!f.name.toLowerCase().endsWith('.csv')) {
      setError("Only .csv files are supported");
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      setError("File must be smaller than 50MB");
      return;
    }

    setIsParsing(true);
    try {
      const { rows, headers } = await parseCSV(f);
      if (rows.length < 2) {
        throw new Error("Dataset too small");
      }
      const columns = analyzeColumns(rows, headers);
      setFile(f);
      setRows(rows);
      setColumns(columns);
    } catch (err: any) {
      setError(err.message || "Failed to parse CSV");
      setFile(null);
      setRows([]);
      setColumns([]);
    } finally {
      setIsParsing(false);
    }
  };

  const loadSample = async (sampleName: string) => {
    setError(null);
    setIsParsing(true);
    try {
      const res = await fetch('/samples/' + sampleName);
      if (!res.ok) throw new Error('Failed to load sample ' + sampleName);
      const blob = await res.blob();
      const sampleFile = new File([blob], sampleName, { type: 'text/csv' });
      await processFile(sampleFile);
    } catch (err: any) {
      setError(err.message || "Failed to load sample");
    } finally {
      setIsParsing(false);
    }
  };

  const handleContinue = async () => {
    if (tab === "csv") {
      const detectedOutcome = detectOutcomeColumn(columns);
      onContinueCSV({ file, rows, columns, detectedOutcome });
    } else {
      setIsAnalyzingText(true);
      setError(null);
      try {
        const result = await analyzeModelDescription(modelText);
        onContinueTextMode(result);
      } catch (err: any) {
        setError(err.message || "Failed to analyze description");
      } finally {
        setIsAnalyzingText(false);
      }
    }
  };

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
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !file && !isParsing && fileInputRef.current?.click()}
              className={"group relative flex h-[280px] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-all " + (
                isDragging ? "border-brand bg-brand-glow" :
                file && !error ? "border-low bg-low-tint cursor-default" :
                "border-border-2 bg-surface hover:border-brand hover:bg-brand-glow cursor-pointer"
              )}
            >
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
              />

              {isParsing ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 size={32} className="animate-spin text-brand" />
                  <div className="text-[14px] text-text-secondary">Parsing CSV...</div>
                </div>
              ) : file && !error ? (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-low/20">
                    <Check size={24} className="text-low" strokeWidth={2.5} />
                  </div>
                  <div className="text-[16px] font-medium text-text-primary">
                    {file.name} loaded
                  </div>
                  <div className="font-mono text-[12px] text-text-secondary">
                    {rows.length.toLocaleString()} rows · ready to scan
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setRows([]);
                      setColumns([]);
                    }}
                    className="mt-4 text-[12px] text-brand hover:underline"
                  >
                    Remove file
                  </button>
                </>
              ) : (
                <>
                  <UploadCloud size={48} className={isDragging ? "text-brand" : "text-brand"} />
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
            </div>

            {error && (
              <div className="mt-3 text-[13px] text-critical">
                {error}
              </div>
            )}

            <div className="mt-6">
              <div className="text-[13px] text-text-secondary">
                Or try a sample dataset:
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {SAMPLES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => loadSample(s)}
                    disabled={isParsing}
                    className="rounded-full border border-border bg-surface-2 px-4 py-2 text-[13px] text-text-secondary transition-colors hover:border-brand hover:text-text-primary disabled:opacity-50"
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
              placeholder={'Example: "Loan approval model using income, age, ZIP code,\\nand employment history to determine creditworthiness..."'}
              className="mt-2 h-[240px] w-full resize-none rounded-xl border border-border bg-surface-2 p-4 font-mono text-[13px] text-text-primary placeholder:text-text-dim focus:border-brand focus:outline-none"
              disabled={isAnalyzingText}
            />
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[12px] text-text-secondary">
                <Brain size={13} className="text-brand" />
                Gemini will identify proxy features and bias risks automatically.
              </div>
              {error && (
                <div className="text-[12px] text-critical">{error}</div>
              )}
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={!canContinue || isParsing || isAnalyzingText}
        onClick={handleContinue}
        className={"mt-10 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-xl text-[16px] font-medium transition-opacity " + (
          (canContinue && !isParsing && !isAnalyzingText)
            ? "bg-brand text-white hover:opacity-90"
            : "cursor-not-allowed bg-surface-2 text-text-dim"
        )}
      >
        {isAnalyzingText ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Gemini is analyzing...
          </>
        ) : (
          <>
            Continue <ArrowRight size={16} />
          </>
        )}
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
      className={"inline-flex items-center gap-2 rounded-md px-4 py-2 text-[13px] font-medium transition-all " + (
        active
          ? "border-b-2 border-brand bg-surface text-text-primary"
          : "text-text-secondary hover:text-text-primary"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
