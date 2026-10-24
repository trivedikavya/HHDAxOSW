# RepoMedic AI

RepoMedic AI is an open-source repository onboarding and maintenance
assistant. It inspects a repository's files and runs a set of
**deterministic, rule-based checks** to surface common onboarding and
documentation gaps — missing READMEs, broken local links, inconsistent
npm scripts, and more — each backed by real evidence from the repository
itself.

**Product principle: Evidence first. AI second. Human control always.**

> **Current status: Phase 1 — Functional Foundation and Deterministic
> Repository Scanner.** There is no AI model connected yet. Nothing in
> this build explains, prioritizes, or drafts anything using AI — see
> [Scope](#scope--roadmap) below.

## What RepoMedic AI is not

- Not a full security audit.
- Not a code-quality or style linter.
- Not an autonomous coding agent — it never modifies your repository and
  never executes, builds, installs, or runs anything inside an uploaded
  repository.
- Not a generic chatbot.

## Quick start

Requirements: Node.js >= 18.18 (developed and tested on Node 24).

```bash
# from the repository root
npm install

# terminal 1 — start the API server (http://localhost:5174)
npm run dev:server

# terminal 2 — start the web app (http://localhost:5173)
npm run dev:client
```

Open `http://localhost:5173`. Click **Load demo repository** to run the
scanner against a small bundled Node.js project, or upload your own
`.zip` archive.

Copy `.env.example` to `.env` if you want to override any default limit
(upload size, extracted-size cap, file-count cap, per-file size cap, or
the port). No real credentials belong in `.env` — Phase 1 has none to
configure.

### Running tests

```bash
npm test              # shared + server + client, in order
npm run test:shared
npm run test:server
npm run test:client
```

### Building for production

```bash
npm run build          # builds the client (dist/) via Vite
```

The server has no separate build step — `npm run dev:server` (watch
mode) or `node server/src/index.js` (production) both run it directly
since it is plain ESM JavaScript.

## Architecture

```
repomedic-ai/
  client/             React + Vite + Tailwind CSS SPA
    src/
      components/     Shared UI (Sidebar, Topbar, badges, Button, Toast...)
      features/       Feature-scoped logic (scan context, upload dropzone, finding card)
      pages/          Route-level pages (Overview, Scan, Findings, Reports, About)
      lib/             API client
      styles/         Tailwind entry + design tokens (@theme)
  server/             Node.js + Express API
    src/
      routes/          HTTP routes (scan, health)
      middleware/      Upload (multer) + error handling
      scanner/         The deterministic scanner engine
        rules/          One file per rule + registry (rules/index.js)
        fixtures/        Bundled demo repository
      services/        Archive safety, scan orchestration, demo repo loader
  shared/             Code shared by client and server (npm workspace package)
    schemas/          Zod schemas: Finding, Evidence, ScanResult, enums
    report/           Markdown report generator (single source of truth)
```

This is an **npm workspaces** monorepo (`client`, `server`, `shared`).
`shared` is a real workspace dependency (`@repomedic/shared`) consumed by
both the client and the server, so the Finding schema, severity/category
enums, and the Markdown report generator can never drift between the UI,
the API, and the exported report — they are the same code.

### Request flow

1. Client uploads a `.zip` (or requests the demo repo) → `POST
   /api/scan/upload` or `POST /api/scan/demo`.
2. The server extracts the archive **entirely in memory** with strict
   safety guards (see below), never touching disk.
3. The extracted files are turned into a `RepoSnapshot` (read-only,
   in-memory file list with binary detection).
4. `runScan()` iterates every rule in the registry
   (`server/src/scanner/rules/index.js`) against the snapshot and
   produces `Finding` objects validated against the shared Zod schema.
5. The server returns a `ScanResult` (repository metadata + findings).
6. The client renders findings, and can generate a Markdown report
   client-side using the same `generateMarkdownReport()` function the
   server package ships (from `@repomedic/shared`).

### Adding a new scanner rule

1. Create `server/src/scanner/rules/yourRule.js` exporting a `rule`
   object: `{ id, category, appliesTo?(projectType), evaluate(context) }`.
   `evaluate` returns an array of finding inputs (title, severity,
   message, evidence, affectedFile, recommendation).
2. Register it in `server/src/scanner/rules/index.js`.
3. Add tests under `server/test/scanner/rules/` covering a positive case
   (no finding), a negative case (finding produced), and at least one
   edge case.

The engine (`server/src/scanner/engine.js`) fills in `id`, `ruleId`, and
`verifiedBy` for you, and isolates a throwing rule so it can never take
down the whole scan.

## Deterministic scanner rules (Phase 1)

| Rule ID | Category | Applies to | What it checks |
| --- | --- | --- | --- |
| `README_MISSING` | documentation | all | No recognized README at the repo root. |
| `LICENSE_MISSING` | documentation | all | No recognized license file (completeness gap, not a legal conclusion). |
| `CONTRIBUTING_MISSING` | documentation | all | No `CONTRIBUTING.md` at root or in `.github/`. |
| `TEST_SETUP_MISSING` | testing | node-javascript | No usable `test` npm script **and** no files matching common test conventions. |
| `README_DEAD_LOCAL_LINKS` | consistency | all | Local markdown links/images in the README pointing to files/folders that don't exist. |
| `README_SCRIPT_MISMATCH` | consistency | node-javascript | `npm run <script>` commands documented in fenced code blocks with no matching `package.json` script. |
| `ENV_EXAMPLE_MISSING` | configuration | node-javascript | `process.env.X` referenced in source with no `.env.example`/`.env.sample`/`.env.template`. |

Notes on interpretation: the brief also lists "presence of a package
manifest and available scripts" and "presence of common configuration
files" as potential checks. These are **not problems** by themselves, so
Phase 1 treats them as repository metadata (`repository.projectType`,
detected via an actual `package.json`) rather than fabricated findings —
consistent with "not every repository needs every file" and "avoid
unsupported claims."

Every rule is deterministic, re-running the same repository produces the
same finding IDs (`ruleId::affectedFile`), and every finding satisfies
the shared `FindingSchema` (`shared/schemas/finding.js`).

## Archive safety

Uploaded ZIPs are treated as untrusted input. `server/src/services/archiveSafety.js`:

- Extracts **entirely in memory** — nothing is ever written to disk, so
  there is no temp-directory cleanup needed and no way for a crafted
  entry to escape onto the filesystem. (This is a deliberate, stronger
  alternative to the more common "extract to a temp dir and clean up"
  pattern — see [Known limitations](#known-limitations--decisions-for-your-review).)
- Validates the ZIP magic bytes before parsing.
- Rejects path traversal (`../`) and absolute-path entries.
- Skips symbolic-link entries instead of extracting them.
- Enforces a per-file size limit, a total file-count limit, and a
  cumulative extracted-size limit (zip-bomb guard), with a defensive
  re-check after decompression in case a crafted header lies about size.
- Rejects case-insensitive duplicate paths (e.g. `README.md` vs
  `readme.md`) instead of silently overwriting one with the other.
- Returns safe, user-facing error messages (`{ error: { code, message } }`)
  — never a raw stack trace.
- Never executes uploaded files, installs dependencies, or runs any
  script from the uploaded repository.
- Skips known binary file extensions and NUL-byte-containing files when
  building the in-memory snapshot, so binary content never reaches
  text-based rules (or logs).

All of the above is covered by automated tests
(`server/test/services/archiveSafety.test.js`), including malformed
ZIPs, path traversal, absolute paths, symlinks, oversized files,
zip-bomb-style cumulative size, too many files, and duplicate paths.

## Scope & roadmap

- **Phase 1 (this build):** deterministic scanner, safe upload, demo
  repository, findings UI, Markdown export. No AI.
- **Phase 2 (not started):** Ollama-compatible local model adapter, AI
  explanations/prioritization/remediation for existing findings,
  contributor-ready issue drafts, Zod-validated AI responses, graceful
  fallback when the model is unavailable.
- **Phase 3 (not started):** expanded contributor docs, accessibility
  audit, finalized license/attribution, issue/PR templates, polish.

## Known limitations & decisions (for your review)

- **In-memory extraction instead of temp-directory extraction.** The
  brief describes "use temporary directories... clean them up reliably"
  and "do not follow symlinks outside the extraction boundary." Phase 1
  satisfies the underlying goal (no filesystem escape, no leftover
  files) more simply by never writing extracted content to disk at all.
  Flagging this as a deliberate deviation from the literal wording.
- **README_DEAD_LOCAL_LINKS** only parses markdown link/image syntax
  (`[text](path)` / `![alt](path)`) inside the README and only resolves
  paths relative to the repository root. References that climb above
  the root (`../`) or use non-markdown syntax are skipped rather than
  guessed at.
- **README_SCRIPT_MISMATCH** only checks the unambiguous `npm run
  <name>` form inside fenced code blocks. `npm start` / `npm test` are
  intentionally not checked, since npm has built-in defaults for those
  that don't require an explicit script entry — checking them reliably
  would require executing npm's resolution logic, which Phase 1 will not
  do.
- **Symlink detection** relies on the unix file-mode bits in a ZIP
  entry's external attributes (the conventional place tools like `zip`
  store them). An archive built without unix attributes has nothing to
  detect, which is the safe default (no symlink entries are extracted as
  regular files either way).
- **No scan history.** State lives only in memory for the current
  browser session (React context). Reloading the page clears it — there
  is no database in Phase 1, by design.
- **Project-type detection** currently recognizes Node/JavaScript
  (`package.json` present and parses as JSON) and otherwise reports
  `unknown`. Rules gated on `node-javascript` are skipped for unknown
  project types rather than guessing.
- Windows PowerShell's `Invoke-RestMethod -Form` is not available on
  PowerShell 5.1 used in this environment; manual verification of the
  upload endpoint used `curl.exe` instead. This does not affect the
  application itself (the client uses the browser `fetch`/`FormData`
  APIs, which were exercised through the full Vitest + React Testing
  Library suite and the Vite dev server).

## License

Apache License 2.0 — see [LICENSE](./LICENSE).
