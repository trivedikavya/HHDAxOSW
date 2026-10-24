import { PROJECT_TYPES } from "@repomedic/shared";

/**
 * Detects the project type from actual manifest files, never from
 * directory naming conventions alone. Also returns the parsed
 * package.json (when present and valid) so rules can reuse it without
 * re-parsing.
 *
 * @param {import("./repoSnapshot.js").RepoFileRecord[]} _records unused, kept for signature symmetry
 * @param {ReturnType<import("./repoSnapshot.js").buildRepoSnapshot>} snapshot
 * @returns {{ projectType: (typeof PROJECT_TYPES)[number], packageManifest: object|null, packageManifestParseError: boolean }}
 */
export function detectProjectType(snapshot) {
  const packageJsonFile = snapshot.findRootFile(["package.json"]);

  if (!packageJsonFile || packageJsonFile.content === null) {
    return {
      projectType: "unknown",
      packageManifest: null,
      packageManifestParseError: false,
    };
  }

  try {
    const parsed = JSON.parse(packageJsonFile.content);
    return {
      projectType: "node-javascript",
      packageManifest: parsed,
      packageManifestParseError: false,
    };
  } catch {
    // A package.json exists but is not valid JSON. We still know enough
    // to call this a node-javascript project; a dedicated rule can flag
    // the invalid manifest itself in a future iteration.
    return {
      projectType: "node-javascript",
      packageManifest: null,
      packageManifestParseError: true,
    };
  }
}
