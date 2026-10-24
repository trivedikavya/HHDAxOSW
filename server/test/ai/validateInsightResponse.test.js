import { describe, it, expect } from "vitest";
import { validateInsightResponse } from "../../src/ai/validateInsightResponse.js";

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

function validWireInsight(overrides = {}) {
  return {
    findingId: "README_MISSING::root",
    explanation: "A README helps new contributors get started quickly.",
    priority: "medium",
    remediationSteps: ["Add a README.md describing setup and usage."],
    verificationSteps: ["Confirm the README renders correctly."],
    hasIssueDraft: false,
    issueDraftTitle: "",
    issueDraftBody: "",
    referencedFiles: [],
    ...overrides,
  };
}

describe("validateInsightResponse", () => {
  it("rejects the whole response on malformed JSON", () => {
    const result = validateInsightResponse("{not valid json", [sampleFinding()]);
    expect(result.fatalError).toMatch(/not valid JSON/);
    expect(result.insights).toHaveLength(0);
  });

  it("rejects the whole response when it doesn't match the wire schema", () => {
    const result = validateInsightResponse(JSON.stringify({ oops: true }), [sampleFinding()]);
    expect(result.fatalError).toMatch(/did not match the expected structure/);
  });

  it("accepts a well-formed insight for a known finding", () => {
    const result = validateInsightResponse(
      JSON.stringify({ insights: [validWireInsight()] }),
      [sampleFinding()]
    );
    expect(result.fatalError).toBeNull();
    expect(result.insights).toHaveLength(1);
    expect(result.insights[0].verifiedBy).toBe("ai-suggestion");
    expect(result.insights[0].issueDraft).toBeNull();
  });

  it("drops an insight referencing an unknown finding ID", () => {
    const result = validateInsightResponse(
      JSON.stringify({ insights: [validWireInsight({ findingId: "DOES_NOT_EXIST::x" })] }),
      [sampleFinding()]
    );
    expect(result.insights).toHaveLength(0);
    expect(result.droppedCount).toBe(1);
    expect(result.warnings[0]).toMatch(/unknown finding ID/);
  });

  it("drops an insight that references a file not present in the finding's evidence", () => {
    const result = validateInsightResponse(
      JSON.stringify({
        insights: [validWireInsight({ referencedFiles: ["some/made-up-file.js"] })],
      }),
      [sampleFinding()]
    );
    expect(result.insights).toHaveLength(0);
    expect(result.warnings[0]).toMatch(/not present in that finding's evidence/);
  });

  it("accepts a referencedFiles entry that matches the finding's affectedFile", () => {
    const finding = sampleFinding({ affectedFile: "package.json" });
    const result = validateInsightResponse(
      JSON.stringify({ insights: [validWireInsight({ referencedFiles: ["package.json"] })] }),
      [finding]
    );
    expect(result.insights).toHaveLength(1);
  });

  it("drops an insight that claims to have run or tested something", () => {
    const result = validateInsightResponse(
      JSON.stringify({
        insights: [
          validWireInsight({
            explanation: "I ran the tests and confirmed this works correctly.",
          }),
        ],
      }),
      [sampleFinding()]
    );
    expect(result.insights).toHaveLength(0);
    expect(result.warnings[0]).toMatch(/executed or verified/);
  });

  it("keeps the first and drops subsequent duplicate insights for the same finding", () => {
    const result = validateInsightResponse(
      JSON.stringify({ insights: [validWireInsight(), validWireInsight()] }),
      [sampleFinding()]
    );
    expect(result.insights).toHaveLength(1);
    expect(result.droppedCount).toBe(1);
  });

  it("converts hasIssueDraft with populated fields into a non-null issueDraft", () => {
    const result = validateInsightResponse(
      JSON.stringify({
        insights: [
          validWireInsight({
            hasIssueDraft: true,
            issueDraftTitle: "Add a README",
            issueDraftBody: "This repository has no README. Please add one.",
          }),
        ],
      }),
      [sampleFinding()]
    );
    expect(result.insights[0].issueDraft).toEqual({
      title: "Add a README",
      body: "This repository has no README. Please add one.",
    });
  });

  it("falls back to a null issueDraft when hasIssueDraft is true but fields are empty", () => {
    const result = validateInsightResponse(
      JSON.stringify({
        insights: [validWireInsight({ hasIssueDraft: true, issueDraftTitle: "", issueDraftBody: "" })],
      }),
      [sampleFinding()]
    );
    expect(result.insights).toHaveLength(1);
    expect(result.insights[0].issueDraft).toBeNull();
  });

  it("keeps valid insights while dropping invalid ones in the same response", () => {
    const findingTwo = sampleFinding({ id: "LICENSE_MISSING::root", ruleId: "LICENSE_MISSING" });
    const result = validateInsightResponse(
      JSON.stringify({
        insights: [
          validWireInsight(),
          validWireInsight({ findingId: "LICENSE_MISSING::root", referencedFiles: ["nope.js"] }),
        ],
      }),
      [sampleFinding(), findingTwo]
    );
    expect(result.insights).toHaveLength(1);
    expect(result.insights[0].findingId).toBe("README_MISSING::root");
    expect(result.droppedCount).toBe(1);
  });

  it("returns an empty, non-fatal result when the model legitimately returns zero insights", () => {
    const result = validateInsightResponse(JSON.stringify({ insights: [] }), [sampleFinding()]);
    expect(result.fatalError).toBeNull();
    expect(result.insights).toHaveLength(0);
    expect(result.droppedCount).toBe(0);
  });
});
