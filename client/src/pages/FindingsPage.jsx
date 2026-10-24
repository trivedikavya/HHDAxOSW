import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Search, FolderSearch, ShieldCheck, BrainCircuit, Loader2 } from "lucide-react";
import { SEVERITY_LEVELS, FINDING_CATEGORIES } from "@repomedic/shared";
import { Topbar } from "../components/Topbar.jsx";
import { Button } from "../components/Button.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import { FindingCard } from "../features/findings/FindingCard.jsx";
import { useScan } from "../features/scan/ScanContext.jsx";
import { useAi } from "../features/ai/AiContext.jsx";
import { AiStatusBadge } from "../features/ai/AiStatusBadge.jsx";

const CATEGORY_LABELS = {
  documentation: "Documentation",
  testing: "Testing",
  configuration: "Configuration",
  "security-hygiene": "Security hygiene",
  consistency: "Consistency",
  "project-metadata": "Project metadata",
};

function toggleInSet(set, value) {
  const next = new Set(set);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return next;
}

export function FindingsPage() {
  const { onOpenMenu } = useOutletContext();
  const navigate = useNavigate();
  const { scanResult } = useScan();
  const {
    insightStatus,
    insightsByFindingId,
    insightMessage,
    insightWarnings,
    generateInsights,
  } = useAi();

  const [severityFilter, setSeverityFilter] = useState(new Set());
  const [categoryFilter, setCategoryFilter] = useState(new Set());
  const [query, setQuery] = useState("");

  const findings = scanResult?.findings ?? [];

  const severityCounts = useMemo(() => {
    const counts = Object.fromEntries(SEVERITY_LEVELS.map((level) => [level, 0]));
    for (const finding of findings) counts[finding.severity] += 1;
    return counts;
  }, [findings]);

  const filteredFindings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return findings.filter((finding) => {
      if (severityFilter.size > 0 && !severityFilter.has(finding.severity)) {
        return false;
      }
      if (categoryFilter.size > 0 && !categoryFilter.has(finding.category)) {
        return false;
      }
      if (normalizedQuery) {
        const haystack = `${finding.title} ${finding.affectedFile ?? ""}`.toLowerCase();
        if (!haystack.includes(normalizedQuery)) return false;
      }
      return true;
    });
  }, [findings, severityFilter, categoryFilter, query]);

  if (!scanResult) {
    return (
      <>
        <Topbar title="Findings" description="Review results from your most recent scan." onOpenMenu={onOpenMenu} />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          <EmptyState
            icon={FolderSearch}
            title="No scan results yet"
            description="Scan a repository or load the demo repository to see findings here."
            action={<Button onClick={() => navigate("/app/scan")}>Scan Repository</Button>}
          />
        </main>
      </>
    );
  }

  return (
    <>
      <Topbar
        title="Findings"
        description={`${scanResult.repository.name} · ${scanResult.repository.projectType}`}
        onOpenMenu={onOpenMenu}
        statusSlot={<AiStatusBadge />}
      />

      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mx-auto flex max-w-4xl flex-col gap-5">
          {findings.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/20 bg-accent/5 px-4 py-3">
              <div className="flex items-start gap-2 text-sm text-ink-soft">
                <BrainCircuit size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                <span>
                  Ask a local AI model to explain, prioritize, and suggest remediation for
                  these findings. Deterministic results above are never changed by this.
                </span>
              </div>
              <Button
                variant="secondary"
                onClick={() => generateInsights(scanResult)}
                disabled={insightStatus === "loading"}
              >
                {insightStatus === "loading" ? (
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                ) : (
                  <BrainCircuit size={16} aria-hidden="true" />
                )}
                Explain with AI
              </Button>
            </div>
          ) : null}

          {(insightStatus === "unavailable" || insightStatus === "error") && insightMessage ? (
            <p className="text-sm text-ink-faint">AI explanation unavailable: {insightMessage}</p>
          ) : null}

          {insightStatus === "ready" && insightWarnings.length > 0 ? (
            <p className="text-sm text-ink-faint">
              {insightWarnings.length} AI suggestion(s) were filtered out during validation.
            </p>
          ) : null}

          {/* Severity summary counts */}
          <div className="flex flex-wrap gap-2">
            {SEVERITY_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                aria-pressed={severityFilter.has(level)}
                aria-label={`Filter by ${level} severity (${severityCounts[level]} findings)`}
                onClick={() => setSeverityFilter((prev) => toggleInSet(prev, level))}
                className={`rounded-lg border px-3 py-2 text-left transition-colors duration-150 ${
                  severityFilter.has(level)
                    ? "border-accent bg-accent/10"
                    : "border-border bg-card hover:bg-raised"
                }`}
              >
                <div className="font-mono text-lg font-semibold tabular-nums text-ink">
                  {severityCounts[level]}
                </div>
                <div className="text-xs capitalize text-ink-soft">{level}</div>
              </button>
            ))}
          </div>

          {/* Search + category filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by title or file path&hellip;"
                aria-label="Search findings"
                className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-accent-2"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {FINDING_CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                aria-pressed={categoryFilter.has(category)}
                onClick={() => setCategoryFilter((prev) => toggleInSet(prev, category))}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                  categoryFilter.has(category)
                    ? "border-accent bg-accent/10 text-ink"
                    : "border-border bg-card text-ink-soft hover:bg-raised"
                }`}
              >
                {CATEGORY_LABELS[category] ?? category}
              </button>
            ))}
          </div>

          {/* Findings list */}
          {findings.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No findings detected"
              description="None of RepoMedic AI's current deterministic checks detected a problem in this repository. This does not guarantee the repository has no other issues."
            />
          ) : filteredFindings.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No findings match your filters"
              description="Try clearing the search or filters above."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {filteredFindings.map((finding) => (
                <FindingCard
                  key={finding.id}
                  finding={finding}
                  aiStatus={insightStatus}
                  aiInsight={insightsByFindingId[finding.id] ?? null}
                  aiMessage={insightMessage}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
