# Release checklist

Run through this before tagging a release or pointing people at a fresh
deployment. Each item should be _actually verified_, not assumed — don't
check a box you haven't personally confirmed.

## Code quality

- [ ] `npm install` succeeds from a clean clone (no stale lockfile drift)
- [ ] `npm test` passes — all three workspaces (shared, server, client)
- [ ] `npm run build` succeeds with no errors or unexpected warnings
- [ ] No `console.log` debugging statements left in `server/src` or
      `client/src` (server error logging via `console.error` in
      `middleware/errorHandler.js` and route catch-blocks is intentional)
- [ ] No TODO/FIXME comments describing unfinished work that should
      actually block release

## Honesty checks (specific to this project's principles)

- [ ] No finding, UI copy, or documentation claims something was
      "verified," "tested," or "executed" unless it actually was
- [ ] AI-generated content remains visually and structurally distinct
      from deterministic findings everywhere in the UI
- [ ] `docs/ai-model.md` accurately reflects the exact model identifier,
      license, and what was/wasn't live-tested as of this release
- [ ] No fabricated scan history, health scores, or confidence
      percentages have been introduced anywhere in the UI

## Security / safety (scanner scope)

- [ ] Archive safety tests still cover: path traversal (forward and
      backslash), absolute paths, embedded NUL bytes, symlinks,
      oversized files, zip-bomb-style cumulative size, too many files,
      duplicate paths, malformed ZIPs, empty archives
- [ ] No secrets, API keys, or real credentials exist anywhere in the
      repository, including fixtures and `.env.example`
- [ ] `.env.example` contains only placeholder values

## Documentation

- [ ] README's "Current status" banner matches the actual implemented
      phase
- [ ] README's Quick Start commands work exactly as written, from a
      clean clone
- [ ] `DEPLOYMENT.md` matches the actual `vercel.json` / `api/index.js`
      configuration in the repository
- [ ] `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, issue templates, and the
      PR template exist and are current
- [ ] Known limitations sections (README, `docs/ai-model.md`,
      `DEPLOYMENT.md`) reflect reality, not an idealized version

## Deployment (if publishing a live demo)

- [ ] Landing page (`/`) loads and all links/CTAs resolve correctly
- [ ] Dashboard (`/app`) loads, demo repository scan works, upload works
      within the configured size limit
- [ ] AI status badge shows the expected state for this environment
      (honestly "unavailable" for a hosted deployment with no local
      Ollama attached)
- [ ] Markdown report export works and contains real scan data
- [ ] No horizontal overflow or broken layout at common mobile widths
- [ ] Environment variables set on the hosting platform match what
      `DEPLOYMENT.md` documents

## Licensing

- [ ] `LICENSE` file is present and correct (Apache License 2.0)
- [ ] `NOTICE` file's third-party dependency list is current
- [ ] No contributed code was knowingly copied from an incompatible
      license

## After release

- [ ] Tag the release in git with a version matching `package.json`
- [ ] If anything in this checklist couldn't be verified, note it
      explicitly in the release notes rather than omitting it
