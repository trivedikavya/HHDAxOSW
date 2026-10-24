import { Copy, Check } from "lucide-react";
import { useState } from "react";

/**
 * A copyable, monospace code block for shell commands shown on the
 * landing page. Falls back silently (no crash) if the Clipboard API is
 * unavailable, since this is a non-critical convenience action.
 */
export function CodeBlock({ code, label }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) - no-op.
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-raised">
      {label ? (
        <div className="border-b border-border px-4 py-2 text-xs font-medium text-ink-faint">
          {label}
        </div>
      ) : null}
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <pre className="min-w-0 flex-1 overflow-x-auto whitespace-pre font-mono text-sm text-ink">
          {code}
        </pre>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy command"
          className="shrink-0 rounded-md p-1.5 text-ink-faint hover:bg-card hover:text-ink"
        >
          {copied ? (
            <Check size={14} className="text-success" aria-hidden="true" />
          ) : (
            <Copy size={14} aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}
