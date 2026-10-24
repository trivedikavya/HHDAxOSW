import { MemoryRouter, Routes, Route, Outlet } from "react-router-dom";
import { ScanContext } from "../src/features/scan/ScanContext.jsx";
import { AiContext } from "../src/features/ai/AiContext.jsx";
import { ToastProvider } from "../src/components/Toast.jsx";

function StubShell() {
  return <Outlet context={{ onOpenMenu: () => {} }} />;
}

/**
 * Renders a page component as it would appear inside the real AppShell
 * route (so useOutletContext() resolves), with controllable ScanContext
 * and AiContext values and no real network calls.
 */
export function renderPageWithProviders(path, element, scanContextValue, aiContextValue) {
  const defaultScanValue = {
    status: "idle",
    scanResult: null,
    extractionWarnings: [],
    error: null,
    runUpload: () => {},
    runDemo: () => {},
    reset: () => {},
    ...scanContextValue,
  };

  const defaultAiValue = {
    connectionStatus: "unknown",
    connectionMessage: null,
    modelId: null,
    checkConnection: () => {},
    insightStatus: "idle",
    insightsByFindingId: {},
    insightMessage: null,
    insightWarnings: [],
    generateInsights: () => {},
    resetInsights: () => {},
    ...aiContextValue,
  };

  return (
    <ToastProvider>
      <ScanContext.Provider value={defaultScanValue}>
        <AiContext.Provider value={defaultAiValue}>
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route element={<StubShell />}>
                <Route path={path} element={element} />
              </Route>
            </Routes>
          </MemoryRouter>
        </AiContext.Provider>
      </ScanContext.Provider>
    </ToastProvider>
  );
}

export function sampleScanResult(overrides = {}) {
  return {
    scanId: "scan-test-1",
    repository: {
      name: "sample-repo",
      projectType: "node-javascript",
      fileCount: 10,
      isDemo: false,
    },
    findings: [
      {
        id: "README_MISSING::root",
        ruleId: "README_MISSING",
        title: "Repository README is missing",
        severity: "low",
        category: "documentation",
        message: "No recognized README file was found at the repository root.",
        evidence: [{ file: "repository-root", description: "Checked root." }],
        affectedFile: null,
        recommendation: "Add a README.",
        verifiedBy: "deterministic-rule",
      },
      {
        id: "ENV_EXAMPLE_MISSING::root",
        ruleId: "ENV_EXAMPLE_MISSING",
        title: "Environment variables referenced without an example file",
        severity: "medium",
        category: "configuration",
        message: "Found referenced environment variables.",
        evidence: [{ file: "src/index.js", description: "References API_KEY." }],
        affectedFile: "src/index.js",
        recommendation: "Add a .env.example file.",
        verifiedBy: "deterministic-rule",
      },
    ],
    completedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}
