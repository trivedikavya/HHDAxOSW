# RepoMedic AI

RepoMedic AI is an open-source repository onboarding and maintenance
assistant. It inspects a repository's files and runs a set of
**deterministic, rule-based checks** to surface common onboarding and
documentation gaps — missing READMEs, broken local links, inconsistent
npm scripts, and more — each backed by real evidence from the repository
itself.

**Product principle: Evidence first. AI second. Human control always.**

> **Current status: Phase 3 — Open-Source Polish and Release Readiness.**
> The deterministic scanner (Phase 1) and the local AI layer (Phase 2)
> are both complete. Phase 3 adds a public landing page, a one-click
> hosted demo deployment, contributor documentation, and release polish.
> See [docs/ai-model.md](./docs/ai-model.md) for exactly what AI model is
> used and its license, and [Scope](#scope--roadmap) for what's still
> optional/ahead.

## Try it

| | |
| --- | --- |
| **Live demo** (no install) | Open the deployed URL (see your Vercel project, or ask whoever deployed this instance). The landing page explains how it works; click **Try the live demo** to reach the dashboard. The deterministic scanner, findings, and report export all work fully there. The AI badge will honestly show **"AI: unavailable"** on the hosted demo, since it has no local Ollama instance attached (see [Local vs. deployed](#local-vs-deployed) below). |
| **Run it locally** (full features, incl. AI) | See [Quick start](#quick-start) below. Two terminals, no accounts, and optionally a local [Ollama](https://ollama.com) model for real AI explanations. |
| **Deploy your own instance** | See [DEPLOYMENT.md](./DEPLOYMENT.md) for the exact Vercel setup (single project, frontend + API on one domain). |

### Local vs. deployed

These are genuinely different experiences, on purpose:

- **Local:** both the deterministic scanner and the AI layer (if you run
  Ollama) work. This is the only way to see real AI explanations today,
  since the AI layer is local-only by design (no paid API, no sending
  your repository to a third party).
- **Deployed (e.g. Vercel):** the deterministic scanner, upload flow,
  demo repository, findings UI, and Markdown export all work exactly the
  same. The AI layer will report itself as unavailable, honestly, because
  a hosted serverless function cannot reach a model running on your own
  machine.

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

Open `http://localhost:5173` — you'll land on the public landing page.
Click **Try the live demo** (or go straight to `http://localhost:5173/app`)
to reach the working dashboard. Click **Load demo repository** to run the
scanner against a small bundled Node.js project, or upload your own
`.zip` archive.

Copy `.env.example` to `.env` if you want to override any default limit
(upload size, extracted-size cap, file-count cap, per-file size cap, the
port, or the AI model settings below). No real credentials belong in
`.env` — there is no API key to configure; the AI layer is local-only.
Everything in `.env` is optional — sensible defaults apply with no file
at all.

To use the AI layer (optional — the app works fully without it), install
[Ollama](https://ollama.com) and pull the default model:

```bash
ollama pull qwen2.5:1.5b
```

See [docs/ai-model.md](./docs/ai-model.md) for the exact model, its
license, and more detail.

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
since it is plain ESM JavaScript. For a hosted deployment, see
[DEPLOYMENT.md](./DEPLOYMENT.md) (Vercel: frontend + API as one project).

## Architecture

```
repomedic-ai/
  api/
    index.js          Vercel serverless entry point (re-exports server/src/app.js)
  client/             React + Vite + Tailwind CSS SPA
    src/
      components/     Shared UI (Sidebar, Topbar, badges, Button, CodeBlock, Toast...)
      features/       Feature-scoped logic:
        scan/            Scan workflow context, upload dropzone
        findings/        Finding card/list rendering
        ai/              AI status badge, AI context, AI insight section
      pages/          Route-level pages:
                       LandingPage (public, at "/")
                       Overview/Scan/Findings/Reports/About (dashboard, at "/app/*")
      lib/             API client
      styles/         Tailwind entry + design tokens (@theme)
  server/             Node.js + Express API
    src/
      routes/          HTTP routes (scan, ai, health)
      middleware/      Upload (multer) + error handling
      scanner/         The deterministic scanner engine
        rules/          One file per rule + registry (rules/index.js)
        fixtures/        Bundled demo repository
      ai/              Model adapter interface + Ollama adapter + prompt
                       builder + AI response validation (Phase 2)
      services/        Archive safety, scan orchestration, demo repo
                       loader, AI insight orchestration
  shared/             Code shared by client and server (npm workspace package)
    schemas/          Zod schemas: Finding, Evidence, ScanResult, AiInsight, enums
    report/           Markdown report generator (single source of truth)
  docs/
    ai-model.md        Exact AI model, license, local setup, data handling
    adding-a-rule.md   Scanner rule authoring guide
    model-adapter.md   Guide for adding a new AI provider adapter
    release-checklist.md
  vercel.json          Deployment config (see DEPLOYMENT.md)
  DEPLOYMENT.md         Step-by-step Vercel deployment walkthrough
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
7. Optionally, the client calls `POST /api/ai/explain` with that same
   `ScanResult`. The server builds a bounded prompt from it
   (`server/src/ai/promptBuilder.js`), asks the configured local Ollama
   model for JSON matching a strict schema, and validates every insight
   (`server/src/ai/validateInsightResponse.js`) before returning it. See
   [AI layer (Phase 2)](#ai-layer-phase-2) below.

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

## AI layer (Phase 2)

The AI layer **interprets existing findings — it never produces new
ones.** It is entirely optional: every deterministic feature (scanning,
filtering, search, Markdown export) works identically whether or not
Ollama is installed or running.

**Architecture:**

- `server/src/ai/modelAdapter.js` documents the adapter interface (any
  future provider implements the same three methods: `checkStatus()`,
  `generateJson()`, plus an `id`/`modelId`).
- `server/src/ai/ollamaAdapter.js` is the only implementation shipped: a
  local [Ollama](https://ollama.com) adapter. No API key, no remote
  provider, no paid dependency.
- `server/src/ai/promptBuilder.js` builds a bounded prompt from the
  scanner's own sanitized output only (see [docs/ai-model.md](./docs/ai-model.md#data-sent-to-the-model)
  for exactly what's sent — never raw file contents or secrets).
- `server/src/ai/validateInsightResponse.js` is the trust boundary: every
  model response must match a strict schema, reference only finding IDs
  and file paths that genuinely exist in the original scan, and avoid
  language that claims the model executed or verified something it
  didn't. Invalid insights are dropped individually, never crashing the
  rest of the response.
- The JSON Schema sent to Ollama's `format` parameter (constraining
  generation) is derived directly from the same Zod schema used to
  validate the response (`z.toJSONSchema(AiModelWireResponseSchema)`),
  so the "ask" and the "check" can never drift apart.

**API:**

- `GET /api/ai/status` — reachability + whether the configured model is
  installed. Never triggers a download.
- `POST /api/ai/explain` — body `{ scanResult }`. Always responds
  `HTTP 200` with a `status` of `"ok" | "unavailable" | "error"` rather
  than a transport-level failure, so the client can keep the rest of the
  UI fully usable no matter what happens here.

**UI:** a small, honest connection badge (no fabricated confidence
scores) next to the Findings page title, an **Explain with AI** action,
and a clearly distinct purple-accented "AI-generated suggestion" panel
inside each finding's detail view — visually and structurally separate
from the deterministic evidence above it, including a "this is a
suggestion, not a verified fact" disclaimer and an optional
contributor-ready issue draft with a copy-to-clipboard action.

See **[docs/ai-model.md](./docs/ai-model.md)** for the exact model used,
its confirmed license, local setup steps, and — importantly — an honest
account of what was and wasn't live-tested against a real running model
during development.

## Scope & roadmap

- **Phase 1 (complete):** deterministic scanner, safe upload, demo
  repository, findings UI, Markdown export. Works fully without AI.
- **Phase 2 (complete):** Ollama-compatible local model adapter, AI
  explanations/prioritization/remediation for existing findings,
  contributor-ready issue drafts, Zod-validated AI responses, graceful
  fallback when the model is unavailable or its response is malformed.
- **Phase 3 (this build):** public landing page explaining the product
  and linking to both the live demo and local setup; a single-project
  Vercel deployment (frontend + API, same domain); contributor docs
  (scanner rule authoring guide, model-adapter guide, `CONTRIBUTING.md`,
  `CODE_OF_CONDUCT.md`, issue/PR templates); an accessibility pass;
  expanded regression tests; a `NOTICE` file for third-party attribution;
  and a release checklist. Deployment is genuinely live-able (see
  [DEPLOYMENT.md](./DEPLOYMENT.md)), not just "prepared but unverified."

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
- **No live model call was made during development** (Ollama is not
  installed in the build environment). The adapter/route/validation
  logic is tested against mocked HTTP responses matching Ollama's
  documented API, and the "service unavailable" path was verified live
  against a genuinely absent Ollama instance. See
  [docs/ai-model.md](./docs/ai-model.md) for the full, honest account.
- The fabricated-claim heuristic in `validateInsightResponse.js` (e.g.
  catching "I ran the tests") is a best-effort quality guard based on
  common phrasing, not an exhaustive or guaranteed filter — a
  differently-worded false claim could still pass through. The primary
  safeguard against invented facts remains the prompt instructions plus
  the structural checks (unknown finding IDs / unsupported file
  references are rejected deterministically, not heuristically).
- AI insights are requested for up to 25 findings per call
  (`MAX_FINDINGS_PER_REQUEST` in `promptBuilder.js`); a scan with more
  findings than that will only receive AI insights for the first 25 in
  the current implementation.
- **No real Vercel deployment was performed while building this** (no
  account/token available in this environment). The deployment config
  was written directly from Vercel's current official documentation and
  the exact file Vercel deploys (`api/index.js`) is tested end-to-end
  with real HTTP requests (`server/test/vercelEntry.test.js`), but the
  platform-specific rewrite/bundling behavior has not been exercised
  against the real platform. See [DEPLOYMENT.md](./DEPLOYMENT.md#what-wasnt-live-verified)
  for the full, honest account and a troubleshooting section.
- **Live-demo upload size is intentionally smaller than local** (4 MB vs
  25 MB by default) because Vercel Functions hard-cap request bodies at
  4.5 MB with no override available on standard Functions. This is
  surfaced truthfully in the UI via `VITE_MAX_UPLOAD_SIZE_MB`, not hidden.
- **No automated accessibility testing tool was added** (e.g. axe-core);
  the accessibility pass in this phase was a manual audit (keyboard
  navigation, focus rings, contrast, aria-labels). Automated a11y testing
  is a reasonable follow-up, deliberately not added without verifying a
  current, well-maintained package first.

## License

Apache License 2.0 — see [LICENSE](./LICENSE).
