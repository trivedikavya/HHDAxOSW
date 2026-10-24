/**
 * Rule: ENV_EXAMPLE_MISSING
 * Purpose: Flag projects that reference environment variables in source
 * code (via process.env.X) but provide no .env example/template file to
 * help a new contributor discover what configuration is expected.
 * Applies to: node-javascript projects.
 */

const SOURCE_FILE_EXTENSIONS = /\.(js|jsx|ts|tsx|mjs|cjs)$/i;
const IGNORED_PATH_SEGMENTS = /(^|\/)(node_modules|\.git|dist|build)\//;
const ENV_VAR_PATTERN = /process\.env\.([A-Z0-9_]+)/g;

const ENV_EXAMPLE_CANDIDATES = [
  ".env.example",
  ".env.sample",
  ".env.template",
];

const MAX_EXAMPLE_VARS_IN_EVIDENCE = 8;

export const rule = {
  id: "ENV_EXAMPLE_MISSING",
  category: "configuration",
  appliesTo(projectType) {
    return projectType === "node-javascript";
  },
  evaluate({ snapshot }) {
    const hasEnvExample = ENV_EXAMPLE_CANDIDATES.some(
      (name) => snapshot.findRootFile([name]) !== null
    );
    if (hasEnvExample) return [];

    const referencedVars = new Set();
    const filesWithReferences = new Set();

    for (const file of snapshot.files) {
      if (file.isBinary || !file.content) continue;
      if (!SOURCE_FILE_EXTENSIONS.test(file.path)) continue;
      if (IGNORED_PATH_SEGMENTS.test(`${file.path}/`)) continue;

      let match;
      ENV_VAR_PATTERN.lastIndex = 0;
      while ((match = ENV_VAR_PATTERN.exec(file.content)) !== null) {
        referencedVars.add(match[1]);
        filesWithReferences.add(file.path);
      }
    }

    if (referencedVars.size === 0) return [];

    const sampleVars = [...referencedVars].slice(0, MAX_EXAMPLE_VARS_IN_EVIDENCE);
    const sampleFiles = [...filesWithReferences].slice(0, MAX_EXAMPLE_VARS_IN_EVIDENCE);

    return [
      {
        title: "Environment variables referenced without an example file",
        severity: "medium",
        message: `Found ${referencedVars.size} referenced environment variable(s) via process.env, but no .env.example (or .env.sample/.env.template) file exists.`,
        evidence: [
          {
            file: "repository-root",
            description: `No .env.example/.env.sample/.env.template found. Variables referenced include: ${sampleVars.join(", ")}${referencedVars.size > sampleVars.length ? ", ..." : ""}.`,
          },
          {
            file: sampleFiles[0] ?? "repository-root",
            description: `Referenced in ${filesWithReferences.size} file(s), e.g. ${sampleFiles.join(", ")}${filesWithReferences.size > sampleFiles.length ? ", ..." : ""}.`,
          },
        ],
        affectedFile: null,
        recommendation:
          "Add a .env.example file listing the expected environment variables with placeholder values, so contributors know what configuration is required.",
      },
    ];
  },
};
