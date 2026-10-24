import { useState } from "react";
import { ChevronDown, ChevronUp, FileText, ShieldCheck } from "lucide-react";
import { SeverityBadge } from "../../components/SeverityBadge.jsx";
import { CategoryBadge } from "../../components/CategoryBadge.jsx";

export function FindingCard({ finding }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="rounded-xl border border-border bg-card p-5 transition-colors duration-150 hover:border-border/80">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-ink">{finding.title}</h3>
          <p className="mt-1 text-sm text-ink-soft">{finding.message}</p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="flex shrink-0 items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:bg-raised hover:text-ink"
          aria-expanded={expanded}
        >
          {expanded ? "Hide details" : "View details"}
          {expanded ? (
            <ChevronUp size={14} aria-hidden="true" />
          ) : (
            <ChevronDown size={14} aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <SeverityBadge severity={finding.severity} />
        <CategoryBadge category={finding.category} />
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-raised px-2.5 py-1 font-mono text-xs text-ink-soft">
          <FileText size={12} aria-hidden="true" />
          {finding.affectedFile ?? "Not reliably determined"}
        </span>
      </div>

      {expanded ? (
        <div className="mt-4 flex flex-col gap-4 border-t border-border pt-4">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Evidence
            </h4>
            <ul className="mt-2 flex flex-col gap-1.5">
              {finding.evidence.map((item, index) => (
                <li key={index} className="text-sm text-ink-soft">
                  <span className="font-mono text-xs text-ink-faint">{item.file}</span>
                  {" — "}
                  {item.description}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Recommendation
            </h4>
            <p className="mt-2 text-sm text-ink-soft">{finding.recommendation}</p>
          </div>

          <div className="flex items-center justify-between gap-3 text-xs text-ink-faint">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-success" aria-hidden="true" />
              Verified by: deterministic rule
            </span>
            <span className="font-mono">{finding.id}</span>
          </div>
        </div>
      ) : null}
    </article>
  );
}
