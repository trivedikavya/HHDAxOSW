/**
 * Rule: CONTRIBUTING_MISSING
 * Purpose: Flag repositories with no CONTRIBUTING guide, which is a
 * common onboarding gap for first-time contributors. Checked at the
 * repository root and inside .github/, the two conventional locations.
 * Applies to: all project types.
 */

const CONTRIBUTING_ROOT_CANDIDATES = [
  "CONTRIBUTING.md",
  "CONTRIBUTING",
  "CONTRIBUTING.txt",
];

export const rule = {
  id: "CONTRIBUTING_MISSING",
  category: "documentation",
  evaluate({ snapshot }) {
    const atRoot = snapshot.findRootFile(CONTRIBUTING_ROOT_CANDIDATES);
    const inGithub = snapshot.getFile(".github/CONTRIBUTING.md");

    if (atRoot || inGithub) return [];

    return [
      {
        title: "No CONTRIBUTING guide found",
        severity: "info",
        message:
          "No CONTRIBUTING file was found at the repository root or in .github/.",
        evidence: [
          {
            file: "repository-root",
            description:
              "Checked for CONTRIBUTING.md (root and .github/); none were found.",
          },
        ],
        affectedFile: null,
        recommendation:
          "Consider adding a CONTRIBUTING.md explaining how to set up the project, run tests, and submit changes.",
      },
    ];
  },
};
