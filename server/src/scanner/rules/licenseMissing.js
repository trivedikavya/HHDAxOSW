/**
 * Rule: LICENSE_MISSING
 * Purpose: Flag repositories with no recognized license file. This is
 * reported as a repository-completeness gap, not a legal conclusion -
 * RepoMedic AI never determines actual licensing status or obligations.
 * Applies to: all project types.
 */

const LICENSE_CANDIDATES = [
  "LICENSE",
  "LICENSE.md",
  "LICENSE.txt",
  "LICENCE",
  "LICENCE.md",
  "COPYING",
];

export const rule = {
  id: "LICENSE_MISSING",
  category: "documentation",
  evaluate({ snapshot }) {
    const license = snapshot.findRootFile(LICENSE_CANDIDATES);
    if (license) return [];

    return [
      {
        title: "No recognized license file found",
        severity: "low",
        message:
          "No recognized license file was found at the repository root. This is a completeness check, not a legal determination.",
        evidence: [
          {
            file: "repository-root",
            description: `Checked for ${LICENSE_CANDIDATES.join(", ")} at the root; none were found.`,
          },
        ],
        affectedFile: null,
        recommendation:
          "Consider adding a LICENSE file so contributors and users understand the terms under which the project is shared.",
      },
    ];
  },
};
