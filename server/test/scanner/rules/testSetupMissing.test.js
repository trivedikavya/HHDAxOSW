import { describe, it, expect } from "vitest";
import { buildRepoSnapshot } from "../../../src/scanner/repoSnapshot.js";
import { rule } from "../../../src/scanner/rules/testSetupMissing.js";

function file(path, content = "") {
  return { path, buffer: Buffer.from(content, "utf-8") };
}

describe("TEST_SETUP_MISSING rule", () => {
  it("only applies to node-javascript projects", () => {
    expect(rule.appliesTo("unknown")).toBe(false);
    expect(rule.appliesTo("node-javascript")).toBe(true);
  });

  it("flags a project with no test script and no test files", () => {
    const snapshot = buildRepoSnapshot([file("src/index.js", "console.log(1)")]);
    const findings = rule.evaluate({ snapshot, packageManifest: { scripts: {} } });
    expect(findings).toHaveLength(1);
  });

  it("flags a project with the default npm placeholder test script", () => {
    const snapshot = buildRepoSnapshot([file("src/index.js", "console.log(1)")]);
    const findings = rule.evaluate({
      snapshot,
      packageManifest: { scripts: { test: 'echo "Error: no test specified" && exit 1' } },
    });
    expect(findings).toHaveLength(1);
  });

  it("does not flag when a real test script is defined", () => {
    const snapshot = buildRepoSnapshot([file("src/index.js", "console.log(1)")]);
    const findings = rule.evaluate({
      snapshot,
      packageManifest: { scripts: { test: "vitest run" } },
    });
    expect(findings).toHaveLength(0);
  });

  it("does not flag when test files exist even without a test script (edge case)", () => {
    const snapshot = buildRepoSnapshot([
      file("src/index.js", "console.log(1)"),
      file("src/index.test.js", "it('works', () => {})"),
    ]);
    const findings = rule.evaluate({ snapshot, packageManifest: { scripts: {} } });
    expect(findings).toHaveLength(0);
  });

  it("recognizes a tests/ directory as a valid test setup", () => {
    const snapshot = buildRepoSnapshot([
      file("src/index.js", "console.log(1)"),
      file("tests/index.spec.js", "it('works', () => {})"),
    ]);
    const findings = rule.evaluate({ snapshot, packageManifest: { scripts: {} } });
    expect(findings).toHaveLength(0);
  });
});
