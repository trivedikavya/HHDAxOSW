/**
 * Rule: README_SCRIPT_MISMATCH
 * Purpose: Flag `npm run <script>` commands documented in README code
 * blocks that do not correspond to any script defined in package.json.
 * Only fenced code blocks are scanned (not prose) to keep the check
 * reliable, and only the unambiguous `npm run <name>` form is checked -
 * `npm start`/`npm test` are skipped because npm has built-in defaults
 * for those that do not require an explicit script entry.
 * Applies to: node-javascript projects with a readable package.json.
 */

const README_CANDIDATES = [
  "README.md",
  "README",
  "README.txt",
  "README.rst",
  "Readme.md",
];

const CODE_FENCE_PATTERN = /```[\s\S]*?```/g;
const NPM_RUN_PATTERN = /\bnpm run ([a-zA-Z0-9_:.-]+)/g;

function extractDocumentedScripts(readmeContent) {
  const scriptNames = new Set();
  const fences = readmeContent.match(CODE_FENCE_PATTERN) ?? [];

  for (const fence of fences) {
    let match;
    NPM_RUN_PATTERN.lastIndex = 0;
    while ((match = NPM_RUN_PATTERN.exec(fence)) !== null) {
      scriptNames.add(match[1]);
    }
  }

  return [...scriptNames];
}

export const rule = {
  id: "README_SCRIPT_MISMATCH",
  category: "consistency",
  appliesTo(projectType) {
    return projectType === "node-javascript";
  },
  evaluate({ snapshot, packageManifest }) {
    if (!packageManifest) return [];

    const readme = snapshot.findRootFile(README_CANDIDATES);
    if (!readme || !readme.content) return [];

    const documentedScripts = extractDocumentedScripts(readme.content);
    if (documentedScripts.length === 0) return [];

    const availableScripts = packageManifest.scripts ?? {};
    const missingScripts = documentedScripts.filter(
      (name) => !(name in availableScripts)
    );

    if (missingScripts.length === 0) return [];

    return [
      {
        title: "README documents npm scripts that do not exist",
        severity: "medium",
        message: `README documents ${missingScripts.length} "npm run" command(s) with no matching script in package.json.`,
        evidence: missingScripts.map((name) => ({
          file: readme.path,
          description: `README documents "npm run ${name}", but package.json has no "${name}" script.`,
        })),
        affectedFile: "package.json",
        recommendation:
          "Align the README instructions with the scripts actually defined in package.json, or add the missing script.",
      },
    ];
  },
};
