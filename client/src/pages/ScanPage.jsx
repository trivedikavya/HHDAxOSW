import { useEffect, useRef } from "react";
import { useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import { PlayCircle, Loader2, AlertTriangle } from "lucide-react";
import { Topbar } from "../components/Topbar.jsx";
import { Button } from "../components/Button.jsx";
import { UploadDropzone } from "../features/scan/UploadDropzone.jsx";
import { useScan } from "../features/scan/ScanContext.jsx";

export function ScanPage() {
  const { onOpenMenu } = useOutletContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { status, error, runUpload, runDemo, reset } = useScan();
  const autoDemoTriggered = useRef(false);

  const isLoading = status === "loading";

  useEffect(() => {
    if (status === "success") {
      navigate("/findings");
    }
  }, [status, navigate]);

  useEffect(() => {
    if (searchParams.get("demo") === "1" && !autoDemoTriggered.current) {
      autoDemoTriggered.current = true;
      runDemo();
    }
  }, [searchParams, runDemo]);

  return (
    <>
      <Topbar
        title="Scan Repository"
        description="Upload a ZIP archive or load the bundled demo repository."
        onOpenMenu={onOpenMenu}
      />

      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mx-auto flex max-w-2xl flex-col gap-6">
          {isLoading ? (
            <div
              className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-16 text-center"
              role="status"
              aria-live="polite"
            >
              <Loader2 size={28} className="animate-spin text-accent" aria-hidden="true" />
              <p className="text-sm font-medium text-ink">Scanning repository&hellip;</p>
              <p className="text-xs text-ink-soft">
                Reading files and running deterministic checks. No code is
                executed during this process.
              </p>
            </div>
          ) : (
            <>
              {status === "error" && error ? (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3"
                >
                  <AlertTriangle
                    size={18}
                    className="mt-0.5 shrink-0 text-danger"
                    aria-hidden="true"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">Scan failed</p>
                    <p className="mt-0.5 text-sm text-ink-soft">{error}</p>
                  </div>
                  <Button variant="ghost" onClick={reset}>
                    Dismiss
                  </Button>
                </div>
              ) : null}

              <section>
                <h2 className="text-lg font-semibold text-ink">
                  Upload a repository
                </h2>
                <p className="mt-1 text-sm text-ink-soft">
                  Files are inspected safely in memory. Nothing is executed,
                  installed, or run.
                </p>
                <div className="mt-4">
                  <UploadDropzone onSubmit={runUpload} disabled={isLoading} />
                </div>
              </section>

              <div className="flex items-center gap-3 text-xs text-ink-faint">
                <div className="h-px flex-1 bg-border" />
                or
                <div className="h-px flex-1 bg-border" />
              </div>

              <section className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-base font-semibold text-ink">
                  Try the demo repository
                </h2>
                <p className="mt-1 text-sm text-ink-soft">
                  A small, real Node.js project bundled with RepoMedic AI. It
                  runs through the exact same scanner pipeline as an upload.
                </p>
                <Button
                  variant="secondary"
                  className="mt-4"
                  onClick={runDemo}
                  disabled={isLoading}
                >
                  <PlayCircle size={16} aria-hidden="true" />
                  Load demo repository
                </Button>
              </section>
            </>
          )}
        </div>
      </main>
    </>
  );
}
