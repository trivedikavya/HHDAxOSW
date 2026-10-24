import { describe, it, expect } from "vitest";
import { buildRepoSnapshot } from "../../../src/scanner/repoSnapshot.js";
import { rule } from "../../../src/scanner/rules/contributingMissing.js";

function file(path, content = "") {
  return { path, buffer: Buffer.from(content, "utf-8") };
}

describe("CONTRIBUTING_MISSING rule", () => {
  it("flags a repository with no CONTRIBUTING file", () => {
    const snapshot = buildRepoSnapshot([file("package.json", "{}")]);
    expect(rule.evaluate({ snapshot })).toHaveLength(1);
  });

  it("does not flag when CONTRIBUTING.md exists at root", () => {
    const snapshot = buildRepoSnapshot([file("CONTRIBUTING.md", "Guide")]);
    expect(rule.evaluate({ snapshot })).toHaveLength(0);
  });

  it("does not flag when CONTRIBUTING.md exists under .github/ (edge case)", () => {
    const snapshot = buildRepoSnapshot([file(".github/CONTRIBUTING.md", "Guide")]);
    expect(rule.evaluate({ snapshot })).toHaveLength(0);
  });

  it("produces an info-level finding, not a hard error", () => {
    const snapshot = buildRepoSnapshot([file("package.json", "{}")]);
    const [finding] = rule.evaluate({ snapshot });
    expect(finding.severity).toBe("info");
  });
});
