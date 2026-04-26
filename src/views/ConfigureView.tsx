import { useState } from "react";
import { ArrowLeft, ArrowRight, Zap } from "lucide-react";
import { mockColumns } from "@/data/mockData";
import type { ColumnRole, DatasetColumn } from "@/types";

interface ConfigureViewProps {
  onBack: () => void;
  onRunScan: () => void;
}

const ROLE_LABEL: Record<ColumnRole, string> = {
  sensitive: "Sensitive Attribute",
  outcome: "Outcome Column",
  ignore: "Ignore",
};

const ROLE_INDICATOR: Record<ColumnRole, string> = {
  sensitive: "bg-brand",
  outcome: "bg-low",
  ignore: "bg-text-dim",
};

export function ConfigureView({ onBack, onRunScan }: ConfigureViewProps) {
  const [columns, setColumns] = useState<DatasetColumn[]>(mockColumns);

  const setRole = (name: string, role: ColumnRole) => {
    setColumns((prev) =>
      prev.map((c) => (c.name === name ? { ...c, role } : c)),
    );
  };

  return (
    <div className="mx-auto max-w-[1080px] px-6 pb-24 pt-12">
      <h1 className="font-display text-[36px] leading-tight text-text-primary">
        Configure your audit
      </h1>
      <p className="mt-2 text-sm text-text-secondary">
        FairScan detected 14 columns. Confirm which represent sensitive
        attributes and which is the outcome.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-border bg-surface-2 px-5 py-4 text-[13px]">
        <div className="flex items-center gap-2">
          <span>📄</span>
          <span className="text-text-primary">adult_income.csv</span>
        </div>
        <div className="text-text-dim">|</div>
        <span className="font-mono text-text-secondary">48,842 rows</span>
        <div className="text-text-dim">|</div>
        <span className="font-mono text-text-secondary">14 columns</span>
        <div className="text-text-dim">|</div>
        <span className="font-mono text-text-secondary">2.3 MB</span>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-2 text-left text-[11px] font-medium uppercase tracking-wide text-text-secondary">
              <th className="px-5 py-3">Column Name</th>
              <th className="px-5 py-3">Sample Values</th>
              <th className="px-5 py-3">Data Type</th>
              <th className="px-5 py-3">Role</th>
            </tr>
          </thead>
          <tbody>
            {columns.map((col, i) => (
              <tr
                key={col.name}
                className={`h-14 ${i < columns.length - 1 ? "border-b border-border" : ""}`}
              >
                <td className="px-5 py-3 text-[13px] font-medium text-text-primary">
                  {col.name}
                </td>
                <td className="px-5 py-3 font-mono text-[12px] text-text-secondary">
                  {col.sampleValues}
                </td>
                <td className="px-5 py-3">
                  <span className="rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-[11px] text-text-secondary">
                    {col.dataType}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    {col.autoDetected && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-brand/40 bg-brand-glow px-2 py-0.5 text-[11px] font-medium text-brand">
                        <Zap size={10} className="fill-brand" />
                        Auto-detected
                      </span>
                    )}
                    <RoleSelect
                      value={col.role}
                      onChange={(r) => setRole(col.name, r)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-[52px] items-center justify-center gap-2 rounded-xl border border-border-2 bg-surface px-5 text-[14px] font-medium text-text-primary transition-colors hover:border-brand"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <button
          type="button"
          onClick={onRunScan}
          className="inline-flex h-[52px] flex-1 items-center justify-center gap-2 rounded-xl bg-brand text-[16px] font-medium text-white transition-opacity hover:opacity-90"
        >
          Run Fairness Scan
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

function RoleSelect({
  value,
  onChange,
}: {
  value: ColumnRole;
  onChange: (r: ColumnRole) => void;
}) {
  return (
    <div className="relative inline-flex h-8 w-[200px] items-center overflow-hidden rounded-md border border-border bg-surface-2">
      <span className={`h-full w-1 ${ROLE_INDICATOR[value]}`} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ColumnRole)}
        className="h-full flex-1 appearance-none bg-transparent px-3 text-[12px] text-text-primary focus:outline-none"
      >
        <option value="sensitive">{ROLE_LABEL.sensitive}</option>
        <option value="outcome">{ROLE_LABEL.outcome}</option>
        <option value="ignore">{ROLE_LABEL.ignore}</option>
      </select>
      <span className="pointer-events-none pr-3 text-text-dim">▼</span>
    </div>
  );
}
