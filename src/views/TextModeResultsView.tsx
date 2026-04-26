import { AlertTriangle, RotateCcw, ShieldAlert, Wrench } from "lucide-react";
import type { TextModeResult } from "@/types";
import { RiskBadge } from "@/components/RiskBadge";
import { FixCard } from "@/components/FixCard";

interface TextModeResultsViewProps {
  result: TextModeResult;
  onNewAudit: () => void;
}

export function TextModeResultsView({ result, onNewAudit }: TextModeResultsViewProps) {
  return (
    <div className="pb-24">
      {/* Top summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-8 py-5">
        <div className="font-mono text-[12px] text-text-secondary">
          Model Description Scan · {new Date().toLocaleDateString()}
        </div>
        <button
          type="button"
          onClick={onNewAudit}
          className="inline-flex items-center gap-1.5 rounded-md border border-border-2 bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-brand hover:text-text-primary"
        >
          <RotateCcw size={12} />
          New Audit
        </button>
      </div>

      <div className="mx-auto max-w-[1280px] px-6 pt-6 lg:px-8">
        {/* Score hero */}
        <div className="rounded-2xl border border-border bg-surface p-8 card-glow">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="text-[13px] font-medium uppercase tracking-wide text-text-secondary">
                Overall Model Risk
              </div>
              <div className="mt-4 flex items-center gap-4">
                <span className={`font-display text-[48px] leading-none text-${result.overallRisk}`}>
                  {result.overallRisk.toUpperCase()}
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-full border-l-[3px] px-3 py-1 text-[13px] font-medium uppercase tracking-wide border-l-${result.overallRisk} bg-${result.overallRisk}-tint text-${result.overallRisk}`}>
                  <ShieldAlert size={16} strokeWidth={2.25} />
                  Risk Detected
                </span>
              </div>
              <p className="mt-4 text-sm text-text-secondary max-w-[600px] leading-relaxed">
                Gemini analyzed your model description and identified potential bias vectors based on the data requirements and problem context.
              </p>
            </div>

            <div className="flex-1 w-full bg-surface-2 border border-border p-5 rounded-xl">
              <div className="text-[12px] uppercase tracking-wider text-text-dim mb-3">Model Description Analyzed</div>
              <div className="text-[13px] text-text-primary font-mono line-clamp-4">
                "{result.modelDescription}"
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-surface p-5 card-glow">
              <h2 className="text-[16px] font-medium text-text-primary mb-4">
                Direct Sensitive Features
              </h2>
              {result.identifiedSensitiveFeatures.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {result.identifiedSensitiveFeatures.map(f => (
                    <span key={f} className="inline-flex items-center rounded-full border border-brand/30 bg-brand-glow px-3 py-1 text-[13px] font-medium text-brand">
                      {f}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-text-dim">No direct sensitive features identified.</div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-surface p-5 card-glow">
              <h2 className="text-[16px] font-medium text-text-primary mb-4">
                Proxy Risk Analysis
              </h2>
              {result.proxyFeatures.length > 0 ? (
                <div className="overflow-hidden rounded-lg border border-border">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-surface-2 text-left text-[11px] font-medium uppercase text-text-secondary">
                        <th className="px-4 py-2">Feature</th>
                        <th className="px-4 py-2">Proxies For</th>
                        <th className="px-4 py-2 text-right">Risk Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.proxyFeatures.map((p, i) => (
                        <tr key={i} className={i < result.proxyFeatures.length - 1 ? "border-b border-border" : ""}>
                          <td className="px-4 py-2 text-[13px] text-text-primary">{p.feature}</td>
                          <td className="px-4 py-2 text-[13px] text-text-secondary">{p.proxiesFor}</td>
                          <td className="px-4 py-2 text-right">
                            <RiskBadge severity={p.risk as any || 'medium'} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-text-dim">No proxy features identified.</div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-surface p-5 card-glow">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle size={16} className="text-medium" />
                <h3 className="text-sm font-medium text-text-primary">
                  Potential Bias Vectors
                </h3>
              </div>
              <div className="space-y-3 mt-4">
                {result.biasTypeMap.length > 0 ? (
                  result.biasTypeMap.map((bt, i) => (
                    <div key={i} className="border-l-2 border-brand bg-surface-2 p-3 rounded-r-md">
                      <div className="text-[13px] font-medium text-text-primary mb-1">{bt.type}</div>
                      <div className="text-[13px] text-text-secondary">{bt.description}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-text-dim">No specific bias vectors identified.</div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5 card-glow">
              <div className="mb-3 flex items-center gap-2">
                <Wrench size={16} className="text-medium" />
                <h3 className="text-sm font-medium text-text-primary">
                  Recommended Guardrails
                </h3>
              </div>
              <div className="space-y-2 mt-4">
                {result.recommendations.length > 0 ? (
                  result.recommendations.map((f: any, i: number) => (
                    <FixCard key={i} fix={{ id: `fix-${i}`, number: `${i+1}`.padStart(2, '0'), ...f, tags: f.tags.map((t: string) => ({ label: t, tone: "blue" })) }} />
                  ))
                ) : (
                  <div className="text-sm text-text-dim">No specific recommendations provided.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
