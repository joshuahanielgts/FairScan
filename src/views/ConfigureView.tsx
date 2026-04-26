import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Zap } from "lucide-react";
import type { ColumnRole, ColumnMeta } from "@/types";

interface ConfigureViewProps {
  columns: ColumnMeta[];
  onBack: () => void;
  onRunScan: (overrides: { name: string; role: ColumnRole }[], wantsEmail: boolean, emailInput: string) => void;
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

export function ConfigureView({ columns: initialColumns, onBack, onRunScan }: ConfigureViewProps) {
  const [columns, setColumns] = useState<ColumnMeta[]>(initialColumns);
  const [wantsSummaryEmail, setWantsSummaryEmail] = useState(false);
  const [summaryEmailInput, setSummaryEmailInput] = useState('');

  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  const setRole = (name: string, role: ColumnRole) => {
    setColumns((prev) =>
      prev.map((c) => (c.name === name ? { ...c, role } : c)),
    );
  };

  const handleRunScan = () => {
    const overrides = columns.map(c => ({ name: c.name, role: c.role }));
    onRunScan(overrides, wantsSummaryEmail, summaryEmailInput);
  };

  const outcomeColumnsCount = columns.filter(c => c.role === 'outcome').length;
  const canRunScan = outcomeColumnsCount === 1;

  return (
    <div className="mx-auto max-w-[1080px] px-6 pb-24 pt-12">
      <h1 className="font-display text-[36px] leading-tight text-text-primary">
        Configure your audit
      </h1>
      <p className="mt-2 text-sm text-text-secondary">
        FairScan detected {columns.length} columns. Confirm which represent sensitive
        attributes and which is the outcome.
      </p>

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
                className={`h-14 ${i < columns.length - 1 ? "border-b border-border" : ""} ${col.role === 'outcome' ? "bg-low/5" : ""}`}
              >
                <td className="px-5 py-3 text-[13px] font-medium text-text-primary">
                  {col.name}
                </td>
                <td className="px-5 py-3 font-mono text-[12px] text-text-secondary">
                  {col.sampleValues.join(', ')}
                </td>
                <td className="px-5 py-3">
                  <span className="rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-[11px] text-text-secondary">
                    {col.type}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    {col.isAutoDetectedSensitive && col.role === 'sensitive' && (
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
          onClick={handleRunScan}
          disabled={!canRunScan}
          className={`inline-flex h-[52px] flex-1 items-center justify-center gap-2 rounded-xl text-[16px] font-medium transition-opacity ${
            canRunScan ? "bg-brand text-white hover:opacity-90" : "bg-surface-2 text-text-dim cursor-not-allowed"
          }`}
        >
          {canRunScan ? "Run Fairness Scan" : "Select exactly 1 Outcome Column"}
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="mt-6 flex flex-col items-center">
        <label style={{ display:'flex', alignItems:'center', gap:'10px', marginTop:'12px', cursor:'pointer' }}>
          <input
            type="checkbox"
            checked={wantsSummaryEmail}
            onChange={e => setWantsSummaryEmail(e.target.checked)}
            style={{ width:'16px', height:'16px', accentColor:'var(--color-brand)' }}
          />
          <span style={{ fontSize:'13px', color:'var(--color-text-secondary)' }}>
            Email me a summary when the scan completes
          </span>
        </label>

        {wantsSummaryEmail && (
          <input
            type="email"
            placeholder="your@email.com"
            value={summaryEmailInput}
            onChange={e => setSummaryEmailInput(e.target.value)}
            style={{
              marginTop:'10px', width:'100%', maxWidth:'400px', padding:'11px 14px',
              borderRadius:'10px', background:'var(--color-surface-2)',
              border:'1px solid var(--color-border-2)',
              color:'var(--color-text-primary)', fontSize:'13px',
              outline:'none', boxSizing:'border-box'
            }}
          />
        )}
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
