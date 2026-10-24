# Contributing to RepoMedic AI

Thanks for considering a contribution. This project is designed to be
approachable for first-time contributors — the deterministic scanner in
particular was built around a plugin-style rule registry specifically so
you can add a check without touching unrelated code.

This guide covers the mechanics of contributing. For the "why" behind
specific design decisions, see the main [README](./README.md) and
[docs/](./docs).

## Code of Conduct

By participating in this project, you agree to abide by the
[Code of Conduct](./CODE_OF_CONDUCT.md).

## Ways to contribute

- **Add a scanner rule.** See [docs/adding-a-rule.md](./docs/adding-a-rule.md) —
  this is the single best starting point for a first contribution.
- **Add a new AI model adapter** (e.g. a different local inference
  server). See [docs/model-adapter.md](./docs/model-adapter.md).
- **Improve the UI** — components live under `client/src/components` and
  `client/src/features`; keep the design tokens in
  `client/src/styles/index.css` as the single source of truth for colors
  and typography.
- **Improve documentation.** Found something confusing or inaccurate?
  Docs fixes are genuinely welcome and don't require writing code.
- **Report a bug.** See [issue templates](.github/ISSUE_TEMPLATE/) when
  opening an issue — a bug report with reproduction steps is far more
  actionable than "this doesn't work."

## Project structure

See the [Architecture](./README.md#architecture) section of the README
for the full layout. In short: `client/` (React), `server/` (Express),
`shared/` (code used by both, as a real npm workspace package).

## Local setup

```bash
npm install
npm run dev:server   # terminal 1
npm run dev:client   # terminal 2
```

See the README's [Quick start](./README.md#quick-start) for more detail,
including optional local AI setup.

## Before opening a pull request

1. **Run the full test suite** and make sure it passes:
   ```bash
   npm test
   ```
2. **Run the production build** to catch anything the dev server hides:
   ```bash
   npm run build
   ```
3. **Add tests for your change.** A new scanner rule needs positive,
   negative, and at least one edge-case test (see any file under
   `server/test/scanner/rules/` for the pattern). A new UI component
   needs a meaningful Vitest + React Testing Library test, not just a
   smoke test.
4. **Keep the product principle intact:** evidence first, AI second,
   human control always. Deterministic findings must never be weakened
   or replaced by AI output. AI suggestions must stay visually and
   structurally distinct from deterministic findings
   (`verifiedBy: "ai-suggestion"` vs `"deterministic-rule"`).
5. **Don't fabricate results.** Never hardcode a "passing" test, a fake
   scan result, or a claim that something was verified when it wasn't.
   This project takes that principle seriously in its own design (see
   `docs/ai-model.md` for an example of being explicit about what was and
   wasn't actually tested) and expects contributions to match it.

## Pull request checklist

Use the [pull request template](.github/PULL_REQUEST_TEMPLATE.md) — it
mirrors the checklist above.

## Style

- Small, descriptive functions over clever abstractions.
- No new dependency without checking it's actively maintained and that
  its current API is being used correctly (don't guess at package APIs).
- No secrets, API keys, or real credentials in code, tests, or examples.
  `.env.example` must only ever contain placeholders.

## Reporting a security concern

This project has limited, documented safety checks (see
[Archive safety](./README.md#archive-safety)) — it is explicitly **not**
a full security audit tool. If you find an actual vulnerability in how
RepoMedic AI itself handles untrusted input (e.g. a way to escape the
in-memory archive extraction, or trigger code execution), please open an
issue describing the problem. There is currently no dedicated private
disclosure channel for this project; use your judgment about how much
detail to include in a public issue for a serious finding.
