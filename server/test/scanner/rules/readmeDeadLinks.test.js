import { describe, it, expect } from "vitest";
import { buildRepoSnapshot } from "../../../src/scanner/repoSnapshot.js";
import { rule } from "../../../src/scanner/rules/readmeDeadLinks.js";

function file(path, content = "") {
  return { path, buffer: Buffer.from(content, "utf-8") };
}

describe("README_DEAD_LOCAL_LINKS rule", () => {
  it("flags a README link to a file that does not exist", () => {
    const snapshot = buildRepoSnapshot([
      file("README.md", "See [usage](docs/USAGE.md) for details."),
    ]);
    const findings = rule.evaluate({ snapshot });
    expect(findings).toHaveLength(1);
    expect(findings[0].evidence[0].description).toContain("docs/USAGE.md");
  });

  it("does not flag a link to a file that exists (positive case)", () => {
    const snapshot = buildRepoSnapshot([
      file("README.md", "See [usage](docs/USAGE.md) for details."),
      file("docs/USAGE.md", "# Usage"),
    ]);
    expect(rule.evaluate({ snapshot })).toHaveLength(0);
  });

  it("does not flag a link pointing to an existing directory", () => {
    const snapshot = buildRepoSnapshot([
      file("README.md", "See the [docs](docs) folder."),
      file("docs/USAGE.md", "# Usage"),
    ]);
    expect(rule.evaluate({ snapshot })).toHaveLength(0);
  });

  it("skips external URLs", () => {
    const snapshot = buildRepoSnapshot([
      file("README.md", "See [the spec](https://example.com/spec.md)."),
    ]);
    expect(rule.evaluate({ snapshot })).toHaveLength(0);
  });

  it("skips anchor-only links", () => {
    const snapshot = buildRepoSnapshot([
      file("README.md", "Jump to [install](#install)."),
    ]);
    expect(rule.evaluate({ snapshot })).toHaveLength(0);
  });

  it("skips references that climb above the repository root (edge case)", () => {
    const snapshot = buildRepoSnapshot([
      file("README.md", "See [sibling project](../other-repo/README.md)."),
    ]);
    expect(rule.evaluate({ snapshot })).toHaveLength(0);
  });

  it("does nothing when there is no README (handled by README_MISSING instead)", () => {
    const snapshot = buildRepoSnapshot([file("package.json", "{}")]);
    expect(rule.evaluate({ snapshot })).toHaveLength(0);
  });

  it("deduplicates repeated references to the same missing path", () => {
    const snapshot = buildRepoSnapshot([
      file(
        "README.md",
        "See [usage](docs/USAGE.md) and also [usage again](docs/USAGE.md)."
      ),
    ]);
    const findings = rule.evaluate({ snapshot });
    expect(findings).toHaveLength(1);
    expect(findings[0].evidence).toHaveLength(1);
  });
});
