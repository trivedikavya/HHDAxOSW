import { describe, it, expect } from "vitest";
import { buildRepoSnapshot } from "../../src/scanner/repoSnapshot.js";
import { runScan } from "../../src/scanner/engine.js";
import { FindingSchema } from "@repomedic/shared";

function file(path, content = "") {
  return { path, buffer: Buffer.from(content, "utf-8") };
}

describe("runScan", () => {
  it("produces zero findings for a complete, well-formed repository", () => {
    const snapshot = buildRepoSnapshot([
      file("README.md", "# My Project\n\n## Usage\n\n```\nnpm run build\n```"),
      file("LICENSE", "MIT"),
      file("CONTRIBUTING.md", "Guide"),
      file(".env.example", ""),
      file(
        "package.json",
        JSON.stringify({ scripts: { build: "tsc", test: "vitest run" } })
      ),
      file("src/index.test.js", "it('works', () => {})"),
    ]);

    const { findings } = runScan(snapshot);
    expect(findings).toHaveLength(0);
  });

  it("produces findings that all satisfy the shared Finding schema", () => {
    const snapshot = buildRepoSnapshot([file("package.json", "{}")]);
    const { findings } = runScan(snapshot);

    expect(findings.length).toBeGreaterThan(0);
    for (const finding of findings) {
      const result = FindingSchema.safeParse(finding);
      expect(result.success).toBe(true);
    }
  });

  it("produces stable IDs across repeated scans of the same snapshot", () => {
    const snapshot = buildRepoSnapshot([file("package.json", "{}")]);
    const first = runScan(snapshot);
    const second = runScan(snapshot);

    const firstIds = first.findings.map((f) => f.id).sort();
    const secondIds = second.findings.map((f) => f.id).sort();
    expect(firstIds).toEqual(secondIds);
  });

  it("gates node-specific rules on detected project type", () => {
    const snapshot = buildRepoSnapshot([file("README.md", "# Hi"), file("LICENSE", "MIT"), file("CONTRIBUTING.md", "x")]);
    const { findings, projectType } = runScan(snapshot);
    expect(projectType).toBe("unknown");
    // TEST_SETUP_MISSING and ENV_EXAMPLE_MISSING only apply to node-javascript.
    expect(findings.some((f) => f.ruleId === "TEST_SETUP_MISSING")).toBe(false);
    expect(findings.some((f) => f.ruleId === "ENV_EXAMPLE_MISSING")).toBe(false);
  });
});
