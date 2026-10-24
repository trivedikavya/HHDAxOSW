import { describe, it, expect } from "vitest";
import { FindingSchema, ScanResultSchema } from "./finding.js";

function validFinding(overrides = {}) {
  return {
    id: "finding-1",
    ruleId: "README_MISSING",
    title: "Repository README is missing",
    severity: "low",
    category: "documentation",
    message: "No recognized README file was found at the repository root.",
    evidence: [
      {
        file: "repository-root",
        description: "Checked recognized README filenames at the root.",
      },
    ],
    affectedFile: null,
    recommendation:
      "Add a README describing the project's purpose, setup, usage, and contribution workflow.",
    verifiedBy: "deterministic-rule",
    ...overrides,
  };
}

describe("FindingSchema", () => {
  it("accepts a well-formed finding", () => {
    const result = FindingSchema.safeParse(validFinding());
    expect(result.success).toBe(true);
  });

  it("rejects an invalid severity value", () => {
    const result = FindingSchema.safeParse(
      validFinding({ severity: "catastrophic" })
    );
    expect(result.success).toBe(false);
  });

  it("rejects an invalid category value", () => {
    const result = FindingSchema.safeParse(
      validFinding({ category: "made-up-category" })
    );
    expect(result.success).toBe(false);
  });

  it("requires at least one evidence entry", () => {
    const result = FindingSchema.safeParse(validFinding({ evidence: [] }));
    expect(result.success).toBe(false);
  });

  it("allows affectedFile to be null", () => {
    const result = FindingSchema.safeParse(validFinding({ affectedFile: null }));
    expect(result.success).toBe(true);
  });

  it("accepts a non-null affectedFile", () => {
    const result = FindingSchema.safeParse(
      validFinding({ affectedFile: "src/index.js" })
    );
    expect(result.success).toBe(true);
  });
});

describe("ScanResultSchema", () => {
  it("accepts a scan result with zero findings", () => {
    const result = ScanResultSchema.safeParse({
      scanId: "scan-1",
      repository: {
        name: "demo-repo",
        projectType: "node-javascript",
        fileCount: 12,
        isDemo: true,
      },
      findings: [],
      completedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
  });

  it("accepts a scan result with findings", () => {
    const result = ScanResultSchema.safeParse({
      scanId: "scan-2",
      repository: {
        name: "demo-repo",
        projectType: "node-javascript",
        fileCount: 12,
        isDemo: true,
      },
      findings: [validFinding()],
      completedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
  });
});
