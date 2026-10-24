import { describe, it, expect } from "vitest";
import { buildRepoSnapshot } from "../../../src/scanner/repoSnapshot.js";
import { rule } from "../../../src/scanner/rules/readmeScriptMismatch.js";

function file(path, content = "") {
  return { path, buffer: Buffer.from(content, "utf-8") };
}

describe("README_SCRIPT_MISMATCH rule", () => {
  it("flags an npm run command documented but missing from package.json", () => {
    const snapshot = buildRepoSnapshot([
      file("README.md", "```\nnpm run format\n```"),
    ]);
    const findings = rule.evaluate({
      snapshot,
      packageManifest: { scripts: { build: "tsc" } },
    });
    expect(findings).toHaveLength(1);
    expect(findings[0].evidence[0].description).toContain("format");
  });

  it("does not flag when the documented script exists", () => {
    const snapshot = buildRepoSnapshot([
      file("README.md", "```\nnpm run build\n```"),
    ]);
    const findings = rule.evaluate({
      snapshot,
      packageManifest: { scripts: { build: "tsc" } },
    });
    expect(findings).toHaveLength(0);
  });

  it("ignores npm run mentions outside of code fences", () => {
    const snapshot = buildRepoSnapshot([
      file("README.md", "You could try running npm run format if you want."),
    ]);
    const findings = rule.evaluate({
      snapshot,
      packageManifest: { scripts: { build: "tsc" } },
    });
    expect(findings).toHaveLength(0);
  });

  it("does not run without a package manifest", () => {
    const snapshot = buildRepoSnapshot([
      file("README.md", "```\nnpm run format\n```"),
    ]);
    expect(rule.evaluate({ snapshot, packageManifest: null })).toHaveLength(0);
  });

  it("does not flag npm start/npm test (not checked, edge case)", () => {
    const snapshot = buildRepoSnapshot([
      file("README.md", "```\nnpm start\nnpm test\n```"),
    ]);
    const findings = rule.evaluate({
      snapshot,
      packageManifest: { scripts: {} },
    });
    expect(findings).toHaveLength(0);
  });
});
