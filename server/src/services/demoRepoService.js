import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEMO_REPO_ROOT = path.join(__dirname, "..", "scanner", "fixtures", "demo-repo");

/**
 * Recursively reads the bundled demo repository fixture from disk into
 * the same {path, buffer} shape produced by extractZipSafely(), so the
 * demo flow runs through the identical buildRepoSnapshot() + runScan()
 * pipeline as an uploaded archive.
 *
 * @returns {Promise<Array<{path: string, buffer: Buffer}>>}
 */
export async function loadDemoRepoFiles() {
  const files = [];

  async function walk(currentDir, relativePrefix) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = path.join(currentDir, entry.name);
      const relativePath = relativePrefix
        ? `${relativePrefix}/${entry.name}`
        : entry.name;

      if (entry.isDirectory()) {
        await walk(absolutePath, relativePath);
      } else if (entry.isFile()) {
        const buffer = await fs.readFile(absolutePath);
        files.push({ path: relativePath, buffer });
      }
      // Symlinks inside the bundled fixture are not expected; any that
      // somehow appear are silently skipped (isFile()/isDirectory() are
      // both false for an unresolved symlink entry type here since we
      // did not pass followSymlinks).
    }
  }

  await walk(DEMO_REPO_ROOT, "");
  return files;
}

export const DEMO_REPO_NAME = "demo-task-cli";
