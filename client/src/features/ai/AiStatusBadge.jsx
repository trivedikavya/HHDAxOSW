import { useEffect, useRef } from "react";
import { BrainCircuit, Loader2 } from "lucide-react";
import { useAi } from "./AiContext.jsx";

const STATUS_CONFIG = {
  unknown: { label: "AI: checking…", className: "text-ink-faint border-border bg-raised" },
  checking: { label: "AI: checking…", className: "text-ink-faint border-border bg-raised" },
  available: { label: "AI: connected", className: "text-accent border-accent/30 bg-accent/10" },
  unavailable: { label: "AI: unavailable", className: "text-ink-soft border-border bg-raised" },
};

/**
 * Small, honest connection indicator for the local AI model. Checked once
 * on mount. This never implies a confidence score or fabricated
 * percentage - only whether the configured local model is reachable.
 */
export function AiStatusBadge() {
  const { connectionStatus, connectionMessage, modelId, checkConnection } = useAi();
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!checkedRef.current) {
      checkedRef.current = true;
      checkConnection();
    }
  }, [checkConnection]);

  const config = STATUS_CONFIG[connectionStatus] ?? STATUS_CONFIG.unknown;
  const isChecking = connectionStatus === "checking" || connectionStatus === "unknown";

  return (
    <button
      type="button"
      onClick={() => checkConnection()}
      title={connectionMessage ?? "AI model connection status"}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-150 hover:opacity-90 ${config.className}`}
    >
      {isChecking ? (
        <Loader2 size={13} className="animate-spin" aria-hidden="true" />
      ) : (
        <BrainCircuit size={13} aria-hidden="true" />
      )}
      {config.label}
      {connectionStatus === "available" && modelId ? (
        <span className="font-mono text-[11px] text-ink-faint">({modelId})</span>
      ) : null}
    </button>
  );
}
