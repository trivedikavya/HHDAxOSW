# Adding a new scanner rule

This is the most approachable way to contribute to RepoMedic AI — rules
are small, self-contained, and don't require touching the UI, the AI
layer, or the engine itself.

## The rule interface

A rule is a plain object exported as `rule` from a file under
`server/src/scanner/rules/`:

```js
export const rule = {
  id: "YOUR_RULE_ID",          // stable, unique, SCREAMING_SNAKE_CASE
  category: "documentation",    // see "Categories" below
  appliesTo(projectType) {      // OPTIONAL - omit to apply to all project types
    return projectType === "node-javascript";
  },
  evaluate(context) {
    // return an array of 0+ finding inputs (see below)
  },
};
```

`context` passed to `evaluate()`:

| Field | Type | Description |
| --- | --- | --- |
| `snapshot` | `RepoSnapshot` | Read-only view of the repository's files (see below). |
| `projectType` | `string` | One of `PROJECT_TYPES` from `shared/schemas/enums.js` (currently `"node-javascript"` or `"unknown"`). |
| `packageManifest` | `object \| null` | Parsed `package.json`, if present and valid JSON. |
| `packageManifestParseError` | `boolean` | `true` if `package.json` exists but isn't valid JSON. |

### The `RepoSnapshot`

Built by `server/src/scanner/repoSnapshot.js` — the same object, built
from the same code path, regardless of whether the files came from an
uploaded ZIP or the bundled demo repository.

```js
snapshot.files        // RepoFileRecord[] - every file: { path, size, isBinary, content }
snapshot.getFile(path)             // exact-path lookup, or null
snapshot.findRootFile(["A", "B"])  // case-insensitive root-level lookup, or null
```

`content` is `null` for binary files (detected by extension and a NUL-byte
heuristic) — never assume `content` is a string without checking.

### What `evaluate()` should return

An array of **finding inputs** — the engine fills in `id`, `ruleId`, and
`verifiedBy` for you:

```js
{
  title: "Short, specific title",
  severity: "low",          // "critical" | "high" | "medium" | "low" | "info"
  message: "One sentence explaining what was (or wasn't) found.",
  evidence: [
    { file: "path/or/repository-root", description: "What was actually observed." },
  ],
  affectedFile: "path/to/file.js",  // or null if genuinely not reliably known
  recommendation: "A concrete, actionable suggestion.",
}
```

Return an empty array `[]` when the rule has nothing to report — this is
the common case and should be the default outcome for a well-formed
repository.

## Rules to follow when writing a rule

1. **Only report what you can verify from `snapshot`.** Never guess, and
   never claim something is "broken" — RepoMedic AI reports gaps and
   inconsistencies, not verdicts.
2. **Evidence must be real.** Every `evidence[].description` must
   describe something the rule actually checked or found in the
   repository content — not a template placeholder.
3. **Report conservatively.** If a check can't be done reliably (e.g. a
   README link using non-standard syntax, or a path that climbs above
   the repository root), skip it rather than guessing. See
   `readmeDeadLinks.js` for an example of this in practice.
4. **Avoid duplicate findings for the same underlying issue.** If your
   rule could fire multiple times for one root cause, consolidate into a
   single finding with multiple evidence entries instead (see
   `envExampleMissing.js`).
5. **Gate on `projectType` when the check genuinely requires it.** Don't
   assume every repository is a Node/JavaScript project — use
   `appliesTo()` rather than defensive `if` checks scattered through
   `evaluate()`.
6. **Never execute anything.** Rules only ever read `snapshot` data that
   was already safely extracted — no shelling out, no `require()`-ing
   repository code, no network calls.
7. **Pick the right category:** `documentation`, `testing`,
   `configuration`, `security-hygiene`, `consistency`, or
   `project-metadata` (see `shared/schemas/enums.js` — this is the single
   source of truth; both the API and the UI read from it).

## Registering the rule

Add it to `server/src/scanner/rules/index.js`:

```js
import { rule as yourRule } from "./yourRule.js";

export const rules = [
  // ...existing rules,
  yourRule,
];
```

Nothing else needs to change — the engine (`server/src/scanner/engine.js`)
iterates this array generically, and isolates a throwing rule so it can
never take down the rest of a scan.

## Testing

Create `server/test/scanner/rules/yourRule.test.js` covering, at minimum:

- **Positive case:** a repository state that should NOT trigger a finding.
- **Negative case:** a repository state that SHOULD trigger a finding.
- **At least one edge case** (e.g. an empty repository, a file that looks
  similar but doesn't match, a nested file that shouldn't be confused
  with a root-level one).

Use `buildRepoSnapshot()` directly in tests rather than going through the
HTTP layer — see any existing rule test for the pattern, e.g.
`server/test/scanner/rules/readmeMissing.test.js`.

Run just your test file while iterating:

```bash
cd server
npx vitest run test/scanner/rules/yourRule.test.js
```

Then run the full suite before opening a PR:

```bash
npm test
```

## Example: a minimal complete rule

```js
// server/src/scanner/rules/packageLockMissing.js

/**
 * Rule: PACKAGE_LOCK_MISSING
 * Purpose: Suggest committing a lockfile for reproducible installs.
 * Applies to: node-javascript projects with a package.json.
 */
export const rule = {
  id: "PACKAGE_LOCK_MISSING",
  category: "configuration",
  appliesTo(projectType) {
    return projectType === "node-javascript";
  },
  evaluate({ snapshot }) {
    const hasLockfile = snapshot.findRootFile([
      "package-lock.json",
      "yarn.lock",
      "pnpm-lock.yaml",
    ]);
    if (hasLockfile) return [];

    return [
      {
        title: "No lockfile found",
        severity: "info",
        message: "No package-lock.json, yarn.lock, or pnpm-lock.yaml was found at the root.",
        evidence: [
          {
            file: "repository-root",
            description: "Checked for package-lock.json, yarn.lock, pnpm-lock.yaml; none found.",
          },
        ],
        affectedFile: null,
        recommendation: "Commit a lockfile so installs are reproducible across machines.",
      },
    ];
  },
};
```
