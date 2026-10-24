/**
 * Rule: README_MISSING
 * Purpose: Flag repositories that have no recognizable README file at the
 * repository root, since this is usually the first thing a new
 * contributor looks for.
 * Applies to: all project types.
 */

const README_CANDIDATES = [
  "README.md",
  "README",
  "README.txt",
  "README.rst",
  "Readme.md",
];

export const rule = {
  id: "README_MISSING",
  category: "documentation",
  evaluate({ snapshot }) {
    const readme = snapshot.findRootFile(README_CANDIDATES);
    if (readme) return [];

    return [
      {
        title: "Repository README is missing",
        severity: "low",
        message: "No recognized README file was found at the repository root.",
        evidence: [
          {
            file: "repository-root",
            description: `Checked for ${README_CANDIDATES.join(", ")} at the root; none were found.`,
          },
        ],
        affectedFile: null,
        recommendation:
          "Add a README describing the project's purpose, setup steps, usage, and how to contribute.",
      },
    ];
  },
};
