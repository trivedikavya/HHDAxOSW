import { useMemo } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Download, FileText, FolderSearch } from "lucide-react";
import { generateMarkdownReport } from "@repomedic/shared";
import { Topbar } from "../components/Topbar.jsx";
import { Button } from "../components/Button.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import { useScan } from "../features/scan/ScanContext.jsx";
import { useToast } from "../components/Toast.jsx";

export function ReportsPage() {
  const { onOpenMenu } = useOutletContext();
  const navigate = useNavigate();
  const { scanResult } = useScan();
  const { showToast } = useToast();

  const markdown = useMemo(
    () => (scanResult ? generateMarkdownReport(scanResult) : ""),
    [scanResult]
  );

  if (!scanResult) {
    return (
      <>
        <Topbar title="Reports" description="Export a Markdown report of your scan." onOpenMenu={onOpenMenu} />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          <EmptyState
            icon={FolderSearch}
            title="No scan results yet"
            description="Scan a repository or load the demo repository before exporting a report."
            action={<Button onClick={() => navigate("/scan")}>Scan Repository</Button>}
          />
        </main>
      </>
    );
  }

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `repomedic-report-${scanResult.repository.name}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("Report downloaded.");
  };

  return (
    <>
      <Topbar
        title="Reports"
        description={`Markdown report for ${scanResult.repository.name}`}
        onOpenMenu={onOpenMenu}
      />

      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-ink-soft">
              <FileText size={16} className="text-ink-faint" aria-hidden="true" />
              {scanResult.findings.length} finding
              {scanResult.findings.length === 1 ? "" : "s"} included
            </div>
            <Button onClick={handleDownload}>
              <Download size={16} aria-hidden="true" />
              Download .md
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Preview
            </h2>
            <pre className="mt-3 max-h-[60vh] overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-ink-soft">
              {markdown}
            </pre>
          </div>
        </div>
      </main>
    </>
  );
}
