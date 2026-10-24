import { useNavigate, useOutletContext } from "react-router-dom";
import { Upload, PlayCircle, ShieldCheck, Bug, ArrowRight } from "lucide-react";
import { Topbar } from "../components/Topbar.jsx";
import { Button } from "../components/Button.jsx";
import { useScan } from "../features/scan/ScanContext.jsx";

export function OverviewPage() {
  const { onOpenMenu } = useOutletContext();
  const navigate = useNavigate();
  const { scanResult, status } = useScan();

  return (
    <>
      <Topbar
        title="Overview"
        description="Know your repository before you change it."
        onOpenMenu={onOpenMenu}
      />

      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mx-auto flex max-w-4xl flex-col gap-8">
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold text-ink">
              Understand a repository before you touch it
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
              RepoMedic AI inspects an uploaded repository's files and runs a set
              of deterministic checks to surface onboarding and maintenance
              gaps &mdash; missing documentation, broken local references,
              inconsistent scripts, and more. Every finding comes with real
              evidence drawn from the repository itself.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={() => navigate("/app/scan")}>
                <Upload size={16} aria-hidden="true" />
                Upload repository ZIP
              </Button>
              <Button variant="secondary" onClick={() => navigate("/app/scan?demo=1")}>
                <PlayCircle size={16} aria-hidden="true" />
                Load demo repository
              </Button>
            </div>

            <div className="mt-5 flex items-start gap-2 rounded-lg border border-border bg-raised px-4 py-3 text-xs text-ink-soft">
              <ShieldCheck
                size={16}
                className="mt-0.5 shrink-0 text-success"
                aria-hidden="true"
              />
              <p>
                RepoMedic AI only reads repository files to look for patterns.
                It never executes uploaded code, installs dependencies, or
                runs build/test scripts.
              </p>
            </div>
          </section>

          {status === "success" && scanResult ? (
            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-ink">Current scan</h2>
              <p className="mt-1 font-mono text-sm text-ink-soft">
                {scanResult.repository.name}
              </p>
              <p className="mt-2 text-sm text-ink-soft">
                {scanResult.findings.length} finding
                {scanResult.findings.length === 1 ? "" : "s"} from the most
                recent scan in this session.
              </p>
              <button
                type="button"
                onClick={() => navigate("/app/findings")}
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
              >
                View findings
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            </section>
          ) : null}

          <section>
            <h2 className="text-lg font-semibold text-ink">Getting started</h2>
            <ol className="mt-3 flex flex-col gap-3 text-sm text-ink-soft">
              <li className="flex gap-3 rounded-lg border border-border bg-card p-4">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-raised text-xs font-semibold text-ink">
                  1
                </span>
                <span>
                  Upload a repository as a <code className="font-mono text-ink">.zip</code> archive,
                  or load the bundled demo repository to see RepoMedic AI in
                  action immediately.
                </span>
              </li>
              <li className="flex gap-3 rounded-lg border border-border bg-card p-4">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-raised text-xs font-semibold text-ink">
                  2
                </span>
                <span>
                  Review the findings: each one lists the affected file,
                  severity, evidence, and a recommended action.
                </span>
              </li>
              <li className="flex gap-3 rounded-lg border border-border bg-card p-4">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-raised text-xs font-semibold text-ink">
                  3
                </span>
                <span className="flex items-center gap-2">
                  <Bug size={14} className="shrink-0 text-ink-faint" aria-hidden="true" />
                  Export a Markdown report to share with your team or attach
                  to an issue.
                </span>
              </li>
            </ol>
          </section>
        </div>
      </main>
    </>
  );
}
