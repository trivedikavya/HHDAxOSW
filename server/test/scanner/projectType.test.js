import { describe, it, expect } from "vitest";
import { buildRepoSnapshot } from "../../src/scanner/repoSnapshot.js";
import { detectProjectType } from "../../src/scanner/projectType.js";

function file(path, content = "") {
  return { path, buffer: Buffer.from(content, "utf-8") };
}

describe("detectProjectType", () => {
  it("detects node-javascript from a valid package.json", () => {
    const snapshot = buildRepoSnapshot([file("package.json", '{"name":"x"}')]);
    const result = detectProjectType(snapshot);
    expect(result.projectType).toBe("node-javascript");
    expect(result.packageManifest).toEqual({ name: "x" });
  });

  it("returns unknown when there is no package.json", () => {
    const snapshot = buildRepoSnapshot([file("README.md", "hi")]);
    const result = detectProjectType(snapshot);
    expect(result.projectType).toBe("unknown");
    expect(result.packageManifest).toBeNull();
  });

  it("handles invalid JSON in package.json without throwing (edge case)", () => {
    const snapshot = buildRepoSnapshot([file("package.json", "{ not valid json")]);
    const result = detectProjectType(snapshot);
    expect(result.projectType).toBe("node-javascript");
    expect(result.packageManifest).toBeNull();
    expect(result.packageManifestParseError).toBe(true);
  });

  it("does not detect a nested package.json as the project manifest", () => {
    const snapshot = buildRepoSnapshot([file("packages/app/package.json", "{}")]);
    const result = detectProjectType(snapshot);
    expect(result.projectType).toBe("unknown");
  });
});
