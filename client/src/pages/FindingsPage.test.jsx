import { describe, it, expect } from "vitest";
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
});
