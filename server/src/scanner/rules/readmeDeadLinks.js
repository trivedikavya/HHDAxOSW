/**
 * Rule: README_DEAD_LOCAL_LINKS
 * Purpose: Flag local file references inside the README that point to
 * files which do not exist in the repository. Only reliably parseable
 * markdown link/image syntax is checked; external URLs, anchors-only
 * links, and references that climb above the repository root are
 * skipped rather than guessed at.
 * Applies to: all project types (operates on the README, not the manifest).
 */

const README_CANDIDATES = [
  "README.md",
  "README",
  "README.txt",
  "README.rst",
  "Readme.md",
];

// Matches both [text](target) and ![alt](target).
const MARKDOWN_LINK_PATTERN = /\[[^\]]*\]\(([^)]+)\)/g;

function isExternalOrSkippable(rawTarget) {
  const target = rawTarget.trim();
  if (target.length === 0) return true;
  if (target.startsWith("#")) return true; // anchor-only
  if (/^[a-z][a-z0-9+.-]*:/i.test(target)) return true; // has a URL scheme (http:, mailto:, etc.)
  if (target.startsWith("//")) return true; // protocol-relative URL
  return false;
}

/**
 * Extracts the path portion of a markdown link target, stripping an
 * optional quoted title and any trailing anchor/query fragment.
 */
function extractPath(rawTarget) {
  const firstToken = rawTarget.trim().split(/\s+/)[0];
  return firstToken.split("#")[0].split("?")[0];
}

function normalizeRelativeToRoot(path) {
  let normalized = path.startsWith("/") ? path.slice(1) : path;
  if (normalized.startsWith("./")) normalized = normalized.slice(2);

  const segments = normalized.split("/").filter((seg) => seg.length > 0);
  if (segments.includes("..")) {
    // Cannot reliably resolve references that climb above the README's
    // directory (root). Report conservatively by skipping.
    return null;
  }
  return segments.join("/");
}

export const rule = {
  id: "README_DEAD_LOCAL_LINKS",
  category: "consistency",
  evaluate({ snapshot }) {
    const readme = snapshot.findRootFile(README_CANDIDATES);
    if (!readme || !readme.content) return [];

    const brokenReferences = [];
    const seenTargets = new Set();
    let match;

    MARKDOWN_LINK_PATTERN.lastIndex = 0;
    while ((match = MARKDOWN_LINK_PATTERN.exec(readme.content)) !== null) {
      const rawTarget = match[1];
      if (isExternalOrSkippable(rawTarget)) continue;

      const path = extractPath(rawTarget);
      const normalized = normalizeRelativeToRoot(path);
      if (normalized === null || normalized.length === 0) continue;
      if (seenTargets.has(normalized)) continue;
      seenTargets.add(normalized);

      const fileExists = Boolean(snapshot.getFile(normalized));
      const directoryExists = snapshot.files.some((f) =>
        f.path.startsWith(`${normalized}/`)
      );

      if (!fileExists && !directoryExists) {
        brokenReferences.push(normalized);
      }
    }

    if (brokenReferences.length === 0) return [];

    return [
      {
        title: "README references local files that do not exist",
        severity: "medium",
        message: `${brokenReferences.length} local reference(s) in the README point to paths that were not found in the repository.`,
        evidence: brokenReferences.map((path) => ({
          file: readme.path,
          description: `README links to "${path}", which was not found in the repository.`,
        })),
        affectedFile: readme.path,
        recommendation:
          "Update or remove README links that point to files or folders that no longer exist.",
      },
    ];
  },
};
