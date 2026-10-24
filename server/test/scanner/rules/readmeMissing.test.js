import { describe, it, expect } from "vitest";
import { buildRepoSnapshot } from "../../../src/scanner/repoSnapshot.js";
import { rule } from "../../../src/scanner/rules/readmeMissing.js";

function file(path, content = "") {
  return { path, buffer: Buffer.from(content, "utf-8") };
}

describe("README_MISSING rule", () => {
  it("flags a repository with no README (negative case: missing)", () => {
    const snapshot = buildRepoSnapshot([file("package.json", "{}")]);
    const findings = rule.evaluate({ snapshot });
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe("low");
    expect(findings[0].affectedFile).toBeNull();
  });

  it("does not flag when README.md exists (positive case)", () => {
    const snapshot = buildRepoSnapshot([file("README.md", "# Hi")]);
    expect(rule.evaluate({ snapshot })).toHaveLength(0);
  });

  it("matches README case-insensitively (edge case)", () => {
    const snapshot = buildRepoSnapshot([file("readme.md", "# Hi")]);
    expect(rule.evaluate({ snapshot })).toHaveLength(0);
  });

  it("does not match a README nested in a subdirectory", () => {
    const snapshot = buildRepoSnapshot([file("docs/README.md", "# Hi")]);
    expect(rule.evaluate({ snapshot })).toHaveLength(1);
  });
});
