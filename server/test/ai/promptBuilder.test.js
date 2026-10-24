import { describe, it, expect } from "vitest";
import { buildInsightPrompt } from "../../src/ai/promptBuilder.js";

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

function sampleScanResult(findings) {
  return {
    scanId: "scan-1",
    repository: { name: "demo-repo", projectType: "node-javascript", fileCount: 10, isDemo: true },
    findings,
    completedAt: "2024-01-01T00:00:00.000Z",
  };
}

describe("buildInsightPrompt", () => {
  it("includes repository metadata and findings in the user prompt", () => {
    const { userPrompt, includedFindingIds } = buildInsightPrompt(
      sampleScanResult([sampleFinding()])
    );
    const parsed = JSON.parse(userPrompt);
    expect(parsed.repository.name).toBe("demo-repo");
    expect(parsed.findings).toHaveLength(1);
    expect(parsed.findings[0].id).toBe("README_MISSING::root");
    expect(includedFindingIds).toEqual(["README_MISSING::root"]);
  });

  it("instructs the model never to invent findings or claim execution", () => {
    const { systemPrompt } = buildInsightPrompt(sampleScanResult([sampleFinding()]));
    expect(systemPrompt).toMatch(/never invent/i);
    expect(systemPrompt).toMatch(/never claim to have executed/i);
  });

  it("caps the number of findings sent per request and notes the omission", () => {
    const manyFindings = Array.from({ length: 30 }, (_, i) =>
      sampleFinding({ id: `RULE::file-${i}` })
    );
    const { userPrompt, includedFindingIds } = buildInsightPrompt(sampleScanResult(manyFindings));
    const parsed = JSON.parse(userPrompt);
    expect(parsed.findings.length).toBeLessThanOrEqual(25);
    expect(includedFindingIds.length).toBeLessThanOrEqual(25);
    expect(parsed.note).toMatch(/additional finding/);
  });

  it("truncates unusually long finding fields instead of sending them whole", () => {
    const longMessage = "x".repeat(5000);
    const { userPrompt } = buildInsightPrompt(
      sampleScanResult([sampleFinding({ message: longMessage })])
    );
    const parsed = JSON.parse(userPrompt);
    expect(parsed.findings[0].message.length).toBeLessThan(600);
  });

  it("limits the number of evidence entries sent per finding", () => {
    const manyEvidence = Array.from({ length: 10 }, (_, i) => ({
      file: `file-${i}.js`,
      description: `evidence ${i}`,
    }));
    const { userPrompt } = buildInsightPrompt(
      sampleScanResult([sampleFinding({ evidence: manyEvidence })])
    );
    const parsed = JSON.parse(userPrompt);
    expect(parsed.findings[0].evidence.length).toBeLessThanOrEqual(5);
  });

  it("produces a valid JSON user prompt with no trailing garbage", () => {
    const { userPrompt } = buildInsightPrompt(sampleScanResult([sampleFinding()]));
    expect(() => JSON.parse(userPrompt)).not.toThrow();
  });
});
