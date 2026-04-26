import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Zap, AlertCircle, Info } from "lucide-react";
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
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  const setRole = (name: string, role: ColumnRole) => {
    setColumns((prev) =>
      prev.map((c) => (c.name === name ? { ...c, role } : c)),
    );
  };

  const handleRunScan = () => {
    if (!canRunScan) {
      setShowError(true);
      return;
    }
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

      {/* Helper Tip */}
      <div className="mt-6 flex items-start gap-3 rounded-lg border-l-[3px] border-brand bg-surface-2 p-4">
        <Info size={18} className="mt-0.5 shrink-0 text-brand" />
        <p className="font-sans text-[13px] leading-relaxed text-text-secondary">
          FairScan works best with decision datasets (hiring, lending, medical).
          Mark demographic columns as <strong className="text-brand">Sensitive</strong> and the decision column
          (e.g. hired, approved, income) as <strong className="text-low">Outcome Column</strong>.
        </p>
      </div>

      <div className="mt-6 overflow-visible rounded-xl border border-border bg-surface">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr className="bg-surface-2 text-left text-[11px] font-medium uppercase tracking-wide text-text-secondary">
              <th className="rounded-tl-xl px-5 py-3">Column Name</th>
              <th className="px-5 py-3">Sample Values</th>
              <th className="px-5 py-3">Data Type</th>
              <th className="rounded-tr-xl px-5 py-3">Role</th>
            </tr>
          </thead>
          <tbody>
            {columns.map((col, i) => (
              <tr
                key={col.name}
                className={`h-14 ${i < columns.length - 1 ? "border-b border-border" : ""} ${col.role === 'outcome' ? "bg-low/5" : ""}`}
              >
                <td className={`px-5 py-3 text-[13px] font-medium text-text-primary ${i === columns.length - 1 ? "rounded-bl-xl" : ""}`}>
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
                <td className={`px-5 py-3 ${i === columns.length - 1 ? "rounded-br-xl" : ""}`}>
                  <div className="flex items-center gap-2">
                    {col.isAutoDetectedSensitive && col.role === 'sensitive' && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-brand/40 bg-brand-glow px-2 py-0.5 text-[11px] font-medium text-brand">
                        <Zap size={10} className="fill-brand" />
                        Auto-detected
                      </span>
                    )}
                    <RoleSelect
                      value={col.role}
                      onChange={(r) => {
                        setRole(col.name, r);
                        if (r === 'outcome') setShowError(false);
                      }}
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
          className={`inline-flex h-[52px] flex-1 items-center justify-center gap-2 rounded-xl text-[16px] font-medium transition-opacity ${
            canRunScan ? "bg-brand text-white hover:opacity-90" : "bg-surface-2 text-text-dim"
          }`}
        >
          Run Fairness Scan
          <ArrowRight size={16} />
        </button>
      </div>

      {showError && !canRunScan && (
        <div className="mt-4 flex items-center justify-center gap-2 text-[13px] font-medium text-critical">
          <AlertCircle size={14} />
          Please mark one column as the Outcome Column to continue.
        </div>
      )}

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
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = () => setIsOpen(false);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative w-[180px]" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-8 w-full items-center gap-2 overflow-hidden rounded-md border border-border bg-surface-2 pr-3 text-left transition-colors hover:border-border-2"
      >
        <span className={`h-full w-1 shrink-0 ${ROLE_INDICATOR[value]}`} />
        <span className="flex-1 text-[12px] text-text-primary">{ROLE_LABEL[value]}</span>
        <span className={`text-[10px] text-text-dim transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div 
          className="absolute left-0 top-[calc(100%+4px)] z-50 w-full rounded-lg border border-border-2 bg-surface-2 py-1 shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
        >
          {(['sensitive', 'outcome', 'ignore'] as ColumnRole[]).map((role) => (
            <div
              key={role}
              onClick={() => {
                onChange(role);
                setIsOpen(false);
              }}
              className={`cursor-pointer px-3 py-2 text-[12px] transition-colors hover:bg-brand-glow hover:text-brand ${
                value === role ? "bg-brand/20 font-medium text-brand" : "text-text-primary"
              }`}
            >
              {ROLE_LABEL[role]}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
