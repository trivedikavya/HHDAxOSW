import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FindingsPage } from "./FindingsPage.jsx";
import { renderPageWithProviders, sampleScanResult } from "../../test/testUtils.jsx";

describe("FindingsPage", () => {
  it("shows an empty state prompting a scan when there is no scan result", () => {
    render(renderPageWithProviders("/findings", <FindingsPage />, { scanResult: null }));
    expect(screen.getByText("No scan results yet")).toBeInTheDocument();
  });

  it("renders findings from the current scan result", () => {
    render(
      renderPageWithProviders("/findings", <FindingsPage />, {
        scanResult: sampleScanResult(),
      })
    );
    expect(screen.getByText("Repository README is missing")).toBeInTheDocument();
    expect(
      screen.getByText("Environment variables referenced without an example file")
    ).toBeInTheDocument();
  });

  it("shows an honest empty state when there are zero findings", () => {
    render(
      renderPageWithProviders("/findings", <FindingsPage />, {
        scanResult: sampleScanResult({ findings: [] }),
      })
    );
    expect(screen.getByText("No findings detected")).toBeInTheDocument();
  });

  it("filters findings by search query", async () => {
    render(
      renderPageWithProviders("/findings", <FindingsPage />, {
        scanResult: sampleScanResult(),
      })
    );

    await userEvent.type(screen.getByLabelText("Search findings"), "README");

    expect(screen.getByText("Repository README is missing")).toBeInTheDocument();
    expect(
      screen.queryByText("Environment variables referenced without an example file")
    ).not.toBeInTheDocument();
  });

  it("filters findings by severity", async () => {
    render(
      renderPageWithProviders("/findings", <FindingsPage />, {
        scanResult: sampleScanResult(),
      })
    );

    // Click the "medium" severity count chip.
    await userEvent.click(screen.getByText("medium"));

    expect(
      screen.getByText("Environment variables referenced without an example file")
    ).toBeInTheDocument();
    expect(screen.queryByText("Repository README is missing")).not.toBeInTheDocument();
  });

  it("exposes severity and category filters as accessible toggle buttons (not color-only)", async () => {
    render(
      renderPageWithProviders("/findings", <FindingsPage />, {
        scanResult: sampleScanResult(),
      })
    );

    const mediumFilter = screen.getByRole("button", {
      name: /filter by medium severity/i,
    });
    expect(mediumFilter).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(mediumFilter);
    expect(mediumFilter).toHaveAttribute("aria-pressed", "true");

    const categoryFilter = screen.getByRole("button", { name: "Documentation" });
    expect(categoryFilter).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(categoryFilter);
    expect(categoryFilter).toHaveAttribute("aria-pressed", "true");
  });

  it("expands a finding to reveal evidence and recommendation", async () => {
    render(
      renderPageWithProviders("/findings", <FindingsPage />, {
        scanResult: sampleScanResult(),
      })
    );

    const [firstDetailButton] = screen.getAllByRole("button", { name: /view details/i });
    await userEvent.click(firstDetailButton);

    expect(screen.getByText("Recommendation")).toBeInTheDocument();
  });

  it("triggers generateInsights with the current scan result when 'Explain with AI' is clicked", async () => {
    const generateInsights = vi.fn();
    const scanResult = sampleScanResult();
    render(
      renderPageWithProviders(
        "/findings",
        <FindingsPage />,
        { scanResult },
        { generateInsights }
      )
    );

    await userEvent.click(screen.getByRole("button", { name: /explain with ai/i }));
    expect(generateInsights).toHaveBeenCalledWith(scanResult);
  });

  it("disables the AI button while insights are being generated", () => {
    render(
      renderPageWithProviders(
        "/findings",
        <FindingsPage />,
        { scanResult: sampleScanResult() },
        { insightStatus: "loading" }
      )
    );
    expect(screen.getByRole("button", { name: /explain with ai/i })).toBeDisabled();
  });

  it("shows the AI connection status badge", () => {
    render(
      renderPageWithProviders(
        "/findings",
        <FindingsPage />,
        { scanResult: sampleScanResult() },
        { connectionStatus: "available", modelId: "qwen2.5:1.5b" }
      )
    );
    expect(screen.getByText("AI: connected")).toBeInTheDocument();
  });

  it("renders a generated AI insight inside the expanded finding card", async () => {
    const scanResult = sampleScanResult();
    const insight = {
      findingId: scanResult.findings[0].id,
      explanation: "A README helps new contributors get started quickly.",
      priority: "medium",
      remediationSteps: ["Add a README.md."],
      verificationSteps: ["Confirm it renders on GitHub."],
      issueDraft: null,
      verifiedBy: "ai-suggestion",
    };

    render(
      renderPageWithProviders(
        "/findings",
        <FindingsPage />,
        { scanResult },
        { insightStatus: "ready", insightsByFindingId: { [insight.findingId]: insight } }
      )
    );

    const [firstDetailButton] = screen.getAllByRole("button", { name: /view details/i });
    await userEvent.click(firstDetailButton);

    expect(screen.getByText("AI-generated suggestion")).toBeInTheDocument();
    expect(
      screen.getByText("A README helps new contributors get started quickly.")
    ).toBeInTheDocument();
  });
});
