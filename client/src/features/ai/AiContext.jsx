import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { fetchAiStatus, requestAiInsights } from "../../lib/api.js";

export const AiContext = createContext(null);

/**
 * Holds AI connection status and generated insights, kept entirely
 * separate from ScanContext: the deterministic scan result must remain
 * usable regardless of what happens here. Nothing in this context is
 * required for the Scan/Findings/Reports deterministic flows to work.
 */
export function AiProvider({ children }) {
  const [connectionStatus, setConnectionStatus] = useState("unknown"); // unknown | checking | available | unavailable
  const [connectionMessage, setConnectionMessage] = useState(null);
  const [modelId, setModelId] = useState(null);

  const [insightStatus, setInsightStatus] = useState("idle"); // idle | loading | ready | unavailable | error
  const [insightsByFindingId, setInsightsByFindingId] = useState({});
  const [insightMessage, setInsightMessage] = useState(null);
  const [insightWarnings, setInsightWarnings] = useState([]);

  const checkConnection = useCallback(async () => {
    setConnectionStatus("checking");
    const status = await fetchAiStatus();
    setModelId(status.modelId);
    setConnectionMessage(status.message);
    setConnectionStatus(status.available ? "available" : "unavailable");
    return status;
  }, []);

  const generateInsights = useCallback(async (scanResult) => {
    setInsightStatus("loading");
    setInsightMessage(null);
    const result = await requestAiInsights(scanResult);

    if (result.status === "ok") {
      const map = {};
      for (const insight of result.insights) {
        map[insight.findingId] = insight;
      }
      setInsightsByFindingId(map);
      setInsightWarnings(result.warnings ?? []);
      setInsightStatus("ready");
      setModelId(result.modelId ?? modelId);
    } else {
      setInsightsByFindingId({});
      setInsightWarnings([]);
      setInsightStatus(result.status); // "unavailable" | "error"
      setInsightMessage(result.message);
    }

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetInsights = useCallback(() => {
    setInsightStatus("idle");
    setInsightsByFindingId({});
    setInsightMessage(null);
    setInsightWarnings([]);
  }, []);

  const value = useMemo(
    () => ({
      connectionStatus,
      connectionMessage,
      modelId,
      checkConnection,
      insightStatus,
      insightsByFindingId,
      insightMessage,
      insightWarnings,
      generateInsights,
      resetInsights,
    }),
    [
      connectionStatus,
      connectionMessage,
      modelId,
      checkConnection,
      insightStatus,
      insightsByFindingId,
      insightMessage,
      insightWarnings,
      generateInsights,
      resetInsights,
    ]
  );

  return <AiContext.Provider value={value}>{children}</AiContext.Provider>;
}

export function useAi() {
  const context = useContext(AiContext);
  if (!context) {
    throw new Error("useAi must be used within an AiProvider");
  }
  return context;
}
