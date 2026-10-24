import { describe, it, expect } from "vitest";
import { ScanResultSchema } from "@repomedic/shared";
import { loadDemoRepoFiles, DEMO_REPO_NAME } from "../../src/services/demoRepoService.js";
import { performScan } from "../../src/services/scanService.js";

/**
 * A strong regression guard: scans the REAL bundled demo repository
 * fixture (reading actual files from disk, not a synthetic snapshot) and
 * validates the full result against the shared schema. If a future
 * change to a rule, the engine, or the fixture itself breaks the
 * contract, this test fails loudly instead of silently drifting.
 */
describe("demo repository regression", () => {
  it("produces a ScanResult that fully satisfies the shared schema", async () => {
    const files = await loadDemoRepoFiles();
    const scanResult = performScan({ files, repositoryName: DEMO_REPO_NAME, isDemo: true });

    const result = ScanResultSchema.safeParse(scanResult);
    expect(result.success).toBe(true);
  });

  it("detects exactly the expected set of rule violations in the demo repo", async () => {
    const files = await loadDemoRepoFiles();
    const scanResult = performScan({ files, repositoryName: DEMO_REPO_NAME, isDemo: true });

    const ruleIds = scanResult.findings.map((f) => f.ruleId).sort();
    expect(ruleIds).toEqual(
      [
        "LICENSE_MISSING",
        "CONTRIBUTING_MISSING",
        "TEST_SETUP_MISSING",
        "README_DEAD_LOCAL_LINKS",
        "README_SCRIPT_MISMATCH",
        "ENV_EXAMPLE_MISSING",
      ].sort()
    );
  });

  it("does not flag README_MISSING for the demo repo (it has a real README)", async () => {
    const files = await loadDemoRepoFiles();
    const scanResult = performScan({ files, repositoryName: DEMO_REPO_NAME, isDemo: true });
    expect(scanResult.findings.some((f) => f.ruleId === "README_MISSING")).toBe(false);
  });

  it("detects the demo repo as a node-javascript project", async () => {
    const files = await loadDemoRepoFiles();
    const scanResult = performScan({ files, repositoryName: DEMO_REPO_NAME, isDemo: true });
    expect(scanResult.repository.projectType).toBe("node-javascript");
  });
});
