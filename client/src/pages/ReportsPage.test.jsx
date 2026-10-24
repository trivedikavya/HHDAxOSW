import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReportsPage } from "./ReportsPage.jsx";
import { renderPageWithProviders, sampleScanResult } from "../../test/testUtils.jsx";

describe("ReportsPage", () => {
  beforeEach(() => {
    global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = vi.fn();
  });

  it("shows an empty state when there is no scan result", () => {
    render(renderPageWithProviders("/reports", <ReportsPage />, { scanResult: null }));
    expect(screen.getByText("No scan results yet")).toBeInTheDocument();
  });

  it("renders a Markdown preview of the current scan result", () => {
    render(
      renderPageWithProviders("/reports", <ReportsPage />, {
        scanResult: sampleScanResult(),
      })
    );
    expect(screen.getByText(/RepoMedic AI Report/)).toBeInTheDocument();
    expect(screen.getByText(/Repository README is missing/)).toBeInTheDocument();
  });

  it("triggers a download when the Download button is clicked", async () => {
    render(
      renderPageWithProviders("/reports", <ReportsPage />, {
        scanResult: sampleScanResult(),
      })
    );

    await userEvent.click(screen.getByRole("button", { name: /download \.md/i }));

    expect(global.URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Report downloaded.")).toBeInTheDocument();
  });
});
