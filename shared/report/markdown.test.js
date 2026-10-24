import { describe, it, expect } from "vitest";
import { generateMarkdownReport } from "./markdown.js";

function baseScanResult(overrides = {}) {
  return {
    scanId: "scan-123",
    repository: {
      name: "my-repo",
      projectType: "node-javascript",
      fileCount: 5,
      isDemo: false,
    },
    findings: [],
    completedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function sampleFinding(overrides = {}) {
  return {
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
    ...overrides,
  };
}

describe("generateMarkdownReport", () => {
  it("includes repository metadata", () => {
    const report = generateMarkdownReport(baseScanResult());
    expect(report).toContain("my-repo");
    expect(report).toContain("node-javascript");
    expect(report).toContain("scan-123");
  });

  it("honestly reports when there are no findings", () => {
    const report = generateMarkdownReport(baseScanResult());
    expect(report).toContain("No findings were produced");
    expect(report).not.toContain("## Findings");
  });

  it("includes each finding's evidence and recommendation", () => {
    const report = generateMarkdownReport(
      baseScanResult({ findings: [sampleFinding()] })
    );
    expect(report).toContain("Repository README is missing");
    expect(report).toContain("Checked root.");
    expect(report).toContain("Add a README.");
    expect(report).toContain("Not reliably determined");
  });

  it("shows the real affected file path when known", () => {
    const report = generateMarkdownReport(
      baseScanResult({
        findings: [sampleFinding({ affectedFile: "package.json" })],
      })
    );
    expect(report).toContain("`package.json`");
  });

  it("sorts findings from most to least severe", () => {
    const report = generateMarkdownReport(
      baseScanResult({
        findings: [
          sampleFinding({ id: "a", severity: "low", title: "Low issue" }),
          sampleFinding({ id: "b", severity: "critical", title: "Critical issue" }),
        ],
      })
    );
    const criticalIndex = report.indexOf("Critical issue");
    const lowIndex = report.indexOf("Low issue");
    expect(criticalIndex).toBeGreaterThan(-1);
    expect(criticalIndex).toBeLessThan(lowIndex);
  });

  it("never claims AI involvement in Phase 1", () => {
    const report = generateMarkdownReport(baseScanResult());
    expect(report.toLowerCase()).toContain("no ai model involved");
  });
});
