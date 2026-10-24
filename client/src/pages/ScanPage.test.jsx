import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route, Outlet } from "react-router-dom";
import { ScanPage } from "./ScanPage.jsx";
import { ScanContext } from "../features/scan/ScanContext.jsx";
import { AiContext } from "../features/ai/AiContext.jsx";
import { ToastProvider } from "../components/Toast.jsx";

function StubShell() {
  return <Outlet context={{ onOpenMenu: () => {} }} />;
}

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
};

function renderScanPage(initialPath, scanContextValue) {
  const value = {
    status: "idle",
    scanResult: null,
    extractionWarnings: [],
    error: null,
    runUpload: () => {},
    runDemo: () => {},
    reset: () => {},
    ...scanContextValue,
  };

  return render(
    <ToastProvider>
      <ScanContext.Provider value={value}>
        <AiContext.Provider value={defaultAiValue}>
          <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
              <Route element={<StubShell />}>
                <Route path="/scan" element={<ScanPage />} />
                <Route path="/app/findings" element={<div>FINDINGS_PAGE_SENTINEL</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </AiContext.Provider>
      </ScanContext.Provider>
    </ToastProvider>
  );
}

describe("ScanPage", () => {
  it("shows the upload and demo sections when idle", () => {
    renderScanPage("/scan");
    expect(screen.getByText("Upload a repository")).toBeInTheDocument();
    expect(screen.getByText("Try the demo repository")).toBeInTheDocument();
  });

  it("shows a loading state and disables actions while scanning", () => {
    renderScanPage("/scan", { status: "loading" });
    expect(screen.getByRole("status")).toHaveTextContent("Scanning repository");
    expect(screen.queryByText("Upload a repository")).not.toBeInTheDocument();
  });

  it("shows an error state with a dismiss action", async () => {
    const reset = vi.fn();
    renderScanPage("/scan", { status: "error", error: "Something went wrong.", reset });
    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong.");
    await userEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("navigates to /app/findings once the scan succeeds", () => {
    renderScanPage("/scan", { status: "success" });
    expect(screen.getByText("FINDINGS_PAGE_SENTINEL")).toBeInTheDocument();
  });

  it("automatically triggers the demo scan when ?demo=1 is present", () => {
    const runDemo = vi.fn();
    renderScanPage("/scan?demo=1", { runDemo });
    expect(runDemo).toHaveBeenCalledTimes(1);
  });

  it("does not auto-trigger the demo scan without the query param", () => {
    const runDemo = vi.fn();
    renderScanPage("/scan", { runDemo });
    expect(runDemo).not.toHaveBeenCalled();
  });

  it("calls runDemo when the 'Load demo repository' button is clicked", async () => {
    const runDemo = vi.fn();
    renderScanPage("/scan", { runDemo });
    await userEvent.click(screen.getByRole("button", { name: /load demo repository/i }));
    expect(runDemo).toHaveBeenCalledTimes(1);
  });
});
