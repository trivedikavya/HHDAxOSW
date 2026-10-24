/**
 * Rule: TEST_SETUP_MISSING
 * Purpose: Suggest adding automated tests when a Node/JavaScript project
 * has neither a usable "test" npm script nor any files that look like
 * tests. This is reported as a suggestion, not proof that the project is
 * broken or untested by other means.
 * Applies to: node-javascript projects only (package.json required to
 * reliably evaluate the "test" script).
 */

const TEST_FILE_PATTERN = /(^|\/)(test|tests|__tests__)\//i;
const TEST_SUFFIX_PATTERN = /\.(test|spec)\.[jt]sx?$/i;

const NPM_DEFAULT_PLACEHOLDER = /Error: no test specified/i;

function hasTestFiles(snapshot) {
  return snapshot.files.some(
    (file) => TEST_FILE_PATTERN.test(file.path) || TEST_SUFFIX_PATTERN.test(file.path)
  );
}

function hasUsableTestScript(packageManifest) {
  const testScript = packageManifest?.scripts?.test;
  if (!testScript || typeof testScript !== "string") return false;
  if (NPM_DEFAULT_PLACEHOLDER.test(testScript)) return false;
  return true;
}

export const rule = {
  id: "TEST_SETUP_MISSING",
  category: "testing",
  appliesTo(projectType) {
    return projectType === "node-javascript";
  },
  evaluate({ snapshot, packageManifest }) {
    if (hasUsableTestScript(packageManifest)) return [];
    if (hasTestFiles(snapshot)) return [];

    return [
      {
        title: "No automated test setup detected",
        severity: "low",
        message:
          "No usable 'test' npm script and no files matching common test conventions (test/, tests/, __tests__/, *.test.js, *.spec.js) were found. This is a suggestion, not evidence that the project has defects.",
        evidence: [
          {
            file: "package.json",
            description: packageManifest
              ? `scripts.test is ${JSON.stringify(packageManifest?.scripts?.test ?? null)}.`
              : "package.json scripts field could not be read.",
          },
        ],
        affectedFile: "package.json",
        recommendation:
          "Consider adding a test runner and a 'test' npm script so contributors can verify changes before submitting them.",
      },
    ];
  },
};
