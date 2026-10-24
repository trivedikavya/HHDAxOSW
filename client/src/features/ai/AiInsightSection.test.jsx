import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "../../components/Toast.jsx";
import { AiInsightSection } from "./AiInsightSection.jsx";

function renderSection(props) {
  return render(
    <ToastProvider>
      <AiInsightSection {...props} />
    </ToastProvider>
  );
}

function sampleInsight(overrides = {}) {
  return {
    findingId: "README_MISSING::root",
    explanation: "A README helps new contributors get started quickly.",
    priority: "medium",
    remediationSteps: ["Add a README.md with setup instructions."],
    verificationSteps: ["Confirm the README renders on GitHub."],
    issueDraft: null,
    verifiedBy: "ai-suggestion",
    ...overrides,
  };
}

describe("AiInsightSection", () => {
  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });

  it("renders nothing when idle", () => {
    const { container } = renderSection({ aiStatus: "idle", aiInsight: null, aiMessage: null });
    // ToastProvider always renders an (empty) live region, so assert no
    // visible text content rather than an entirely empty container.
    expect(container).toHaveTextContent("");
  });

  it("shows a loading indicator while generating", () => {
    renderSection({ aiStatus: "loading", aiInsight: null, aiMessage: null });
    expect(screen.getByText(/Generating AI explanation/)).toBeInTheDocument();
  });

  it("shows an unavailable message when the AI service could not be reached", () => {
    renderSection({ aiStatus: "unavailable", aiInsight: null, aiMessage: "Ollama is not running." });
    expect(screen.getByText(/AI explanation unavailable: Ollama is not running\./)).toBeInTheDocument();
  });

  it("shows a muted message when ready but no insight exists for this finding", () => {
    renderSection({ aiStatus: "ready", aiInsight: null, aiMessage: null });
    expect(screen.getByText("No AI suggestion was generated for this finding.")).toBeInTheDocument();
  });

  it("renders the explanation, remediation, and verification steps when an insight is present", () => {
    renderSection({ aiStatus: "ready", aiInsight: sampleInsight(), aiMessage: null });
    expect(screen.getByText("AI-generated suggestion")).toBeInTheDocument();
    expect(
      screen.getByText("A README helps new contributors get started quickly.")
    ).toBeInTheDocument();
    expect(screen.getByText("Add a README.md with setup instructions.")).toBeInTheDocument();
    expect(screen.getByText("Confirm the README renders on GitHub.")).toBeInTheDocument();
  });

  it("labels the content as a suggestion, not a verified fact", () => {
    renderSection({ aiStatus: "ready", aiInsight: sampleInsight(), aiMessage: null });
    expect(screen.getByText(/suggestion, not a/i)).toBeInTheDocument();
  });

  it("renders and copies a contributor-ready issue draft when present", async () => {
    const insight = sampleInsight({
      issueDraft: { title: "Add a README", body: "Please add a README file." },
    });
    renderSection({ aiStatus: "ready", aiInsight: insight, aiMessage: null });

    expect(screen.getByText("Add a README")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /copy/i }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "Add a README\n\nPlease add a README file."
    );
    expect(screen.getByText("Issue draft copied to clipboard.")).toBeInTheDocument();
  });

  it("does not render an issue draft section when none was produced", () => {
    renderSection({ aiStatus: "ready", aiInsight: sampleInsight({ issueDraft: null }), aiMessage: null });
    expect(screen.queryByText("Contributor-ready issue draft")).not.toBeInTheDocument();
  });
});
