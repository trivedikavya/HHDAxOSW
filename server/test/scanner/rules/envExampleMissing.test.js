import { describe, it, expect } from "vitest";
import { buildRepoSnapshot } from "../../../src/scanner/repoSnapshot.js";
import { rule } from "../../../src/scanner/rules/envExampleMissing.js";

function file(path, content = "") {
  return { path, buffer: Buffer.from(content, "utf-8") };
}

describe("ENV_EXAMPLE_MISSING rule", () => {
  it("flags process.env usage with no .env.example", () => {
    const snapshot = buildRepoSnapshot([
      file("src/index.js", "const key = process.env.API_KEY;"),
    ]);
    const findings = rule.evaluate({ snapshot });
    expect(findings).toHaveLength(1);
    expect(findings[0].evidence[0].description).toContain("API_KEY");
  });

  it("does not flag when .env.example exists", () => {
    const snapshot = buildRepoSnapshot([
      file("src/index.js", "const key = process.env.API_KEY;"),
      file(".env.example", "API_KEY="),
    ]);
    expect(rule.evaluate({ snapshot })).toHaveLength(0);
  });

  it("does not flag when no env vars are referenced", () => {
    const snapshot = buildRepoSnapshot([file("src/index.js", "console.log(1);")]);
    expect(rule.evaluate({ snapshot })).toHaveLength(0);
  });

  it("ignores references inside node_modules (edge case)", () => {
    const snapshot = buildRepoSnapshot([
      file("node_modules/dep/index.js", "process.env.SOME_DEP_VAR"),
    ]);
    expect(rule.evaluate({ snapshot })).toHaveLength(0);
  });

  it("accepts .env.sample as a recognized variant", () => {
    const snapshot = buildRepoSnapshot([
      file("src/index.js", "process.env.API_KEY"),
      file(".env.sample", "API_KEY="),
    ]);
    expect(rule.evaluate({ snapshot })).toHaveLength(0);
  });

  it("detects bracket-notation access (process.env['FOO'])", () => {
    const snapshot = buildRepoSnapshot([
      file("src/index.js", "const key = process.env['API_KEY'];"),
    ]);
    const findings = rule.evaluate({ snapshot });
    expect(findings).toHaveLength(1);
    expect(findings[0].evidence[0].description).toContain("API_KEY");
  });

  it("detects double-quoted bracket-notation access (process.env[\"FOO\"])", () => {
    const snapshot = buildRepoSnapshot([
      file("src/index.js", 'const key = process.env["API_KEY"];'),
    ]);
    const findings = rule.evaluate({ snapshot });
    expect(findings).toHaveLength(1);
  });

  it("deduplicates a variable referenced via both dot and bracket notation", () => {
    const snapshot = buildRepoSnapshot([
      file(
        "src/index.js",
        "const a = process.env.API_KEY; const b = process.env['API_KEY'];"
      ),
    ]);
    const findings = rule.evaluate({ snapshot });
    expect(findings).toHaveLength(1);
    expect(findings[0].message).toContain("Found 1 referenced");
  });
});
