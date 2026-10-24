import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OverviewPage } from "./OverviewPage.jsx";
import { renderPageWithProviders, sampleScanResult } from "../../test/testUtils.jsx";

describe("OverviewPage", () => {
  it("renders the welcome heading and both primary actions", () => {
    render(renderPageWithProviders("/", <OverviewPage />, { scanResult: null }));
    expect(screen.getByText("Know your repository before you change it.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /upload repository zip/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /load demo repository/i })).toBeInTheDocument();
  });

  it("explains that uploaded code is never executed", () => {
    render(renderPageWithProviders("/", <OverviewPage />, { scanResult: null }));
    expect(screen.getByText(/never executes uploaded code/i)).toBeInTheDocument();
  });

  it("does not show a current-scan section when there is no scan yet", () => {
    render(renderPageWithProviders("/", <OverviewPage />, { scanResult: null }));
    expect(screen.queryByText("Current scan")).not.toBeInTheDocument();
  });

  it("shows the current scan summary once a scan has completed", () => {
    render(
      renderPageWithProviders("/", <OverviewPage />, {
        status: "success",
        scanResult: sampleScanResult(),
      })
    );
    expect(screen.getByText("Current scan")).toBeInTheDocument();
    expect(screen.getByText("sample-repo")).toBeInTheDocument();
  });
});
