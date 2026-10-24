import crypto from "node:crypto";
import { ScanResultSchema } from "@repomedic/shared";
import { buildRepoSnapshot } from "../scanner/repoSnapshot.js";
import { runScan } from "../scanner/engine.js";

/**
 * Runs the full scanner pipeline (snapshot -> rules -> schema validation)
 * against a flat list of extracted files. This is the single function
 * used by both the upload route and the demo route, which is what
 * guarantees they share the exact same analysis pipeline.
 *
 * @param {{files: Array<{path:string, buffer:Buffer}>, repositoryName: string, isDemo: boolean}} params
 * @returns {import("../../../shared/schemas/finding.js").ScanResult}
 */
export function performScan({ files, repositoryName, isDemo }) {
  const snapshot = buildRepoSnapshot(files);
  const { projectType, findings } = runScan(snapshot);

  const scanResult = {
    scanId: crypto.randomUUID(),
    repository: {
      name: repositoryName,
      projectType,
      fileCount: snapshot.files.length,
      isDemo,
    },
    findings,
    completedAt: new Date().toISOString(),
  };

  // Fail loudly if our own pipeline ever produces a result that doesn't
  // satisfy the shared contract - this should never happen in normal
  // operation and indicates a bug, not bad user input.
  return ScanResultSchema.parse(scanResult);
}
