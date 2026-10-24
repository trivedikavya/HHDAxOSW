import { describe, it, expect } from "vitest";
import { buildRepoSnapshot } from "../../../src/scanner/repoSnapshot.js";
import { rule } from "../../../src/scanner/rules/licenseMissing.js";

function file(path, content = "") {
  return { path, buffer: Buffer.from(content, "utf-8") };
}

describe("LICENSE_MISSING rule", () => {
  it("flags a repository with no license file", () => {
    const snapshot = buildRepoSnapshot([file("package.json", "{}")]);
    const findings = rule.evaluate({ snapshot });
    expect(findings).toHaveLength(1);
    expect(findings[0].message).toContain("completeness");
  });

  it("does not flag when LICENSE exists", () => {
    const snapshot = buildRepoSnapshot([file("LICENSE", "MIT")]);
    expect(rule.evaluate({ snapshot })).toHaveLength(0);
  });

  it("accepts LICENSE.md as a recognized variant", () => {
    const snapshot = buildRepoSnapshot([file("LICENSE.md", "MIT")]);
    expect(rule.evaluate({ snapshot })).toHaveLength(0);
  });

  it("accepts COPYING as a recognized variant (edge case)", () => {
    const snapshot = buildRepoSnapshot([file("COPYING", "GPL")]);
    expect(rule.evaluate({ snapshot })).toHaveLength(0);
  });
});
