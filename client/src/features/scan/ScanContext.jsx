import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { uploadRepository, scanDemoRepository, ApiError } from "../../lib/api.js";

export const ScanContext = createContext(null);

/**
 * Holds the current scan workflow state (idle/loading/success/error) and
 * the most recent scan result, shared across the Scan, Findings, and
 * Reports pages. There is intentionally no persistence beyond the
 * in-memory session - Phase 1 has no accounts or scan history storage.
 */
export function ScanProvider({ children }) {
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [scanResult, setScanResult] = useState(null);
  const [extractionWarnings, setExtractionWarnings] = useState([]);
  const [error, setError] = useState(null);

  const runUpload = useCallback(async (file) => {
    setStatus("loading");
    setError(null);
    try {
      const { scanResult: result, extractionWarnings: warnings } =
        await uploadRepository(file);
      setScanResult(result);
      setExtractionWarnings(warnings ?? []);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof ApiError ? err.message : "An unexpected error occurred.");
    }
  }, []);

  const runDemo = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const { scanResult: result, extractionWarnings: warnings } =
        await scanDemoRepository();
      setScanResult(result);
      setExtractionWarnings(warnings ?? []);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof ApiError ? err.message : "An unexpected error occurred.");
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setScanResult(null);
    setExtractionWarnings([]);
    setError(null);
  }, []);

  const value = useMemo(
    () => ({ status, scanResult, extractionWarnings, error, runUpload, runDemo, reset }),
    [status, scanResult, extractionWarnings, error, runUpload, runDemo, reset]
  );

  return <ScanContext.Provider value={value}>{children}</ScanContext.Provider>;
}

export function useScan() {
  const context = useContext(ScanContext);
  if (!context) {
    throw new Error("useScan must be used within a ScanProvider");
  }
  return context;
}
