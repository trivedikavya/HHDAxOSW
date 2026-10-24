# Deploying RepoMedic AI to Vercel

This project is set up to deploy as a **single Vercel project**: the
React frontend is served as a static site, and the Express API runs as
one Vercel Function at `/api/*`, on the same domain. No separate backend
host, no CORS configuration needed.

This document is the exact, step-by-step process. Read
[What wasn't live-verified](#what-wasnt-live-verified) before you rely on
this for anything beyond a demo.

## Prerequisites

- A [Vercel](https://vercel.com) account, connected to the GitHub (or
  GitLab/Bitbucket) account hosting this repository.
- Nothing else. No database, no paid add-ons, no API keys.

## 1. Push this repository to GitHub (if you haven't already)

Vercel deploys from a Git repository.

## 2. Import the project on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import this repository.
2. When asked for the **Framework Preset**, choose **Other** (the
   repository's `vercel.json` already sets `"framework": null` and the
   correct build command/output directory, so this should be detected
   automatically - just confirm it if Vercel shows a different guess).
3. Leave **Root Directory** as the repository root (do **not** point it
   at `client/` - the API function lives at the repo root under `api/`,
   and the monorepo's `npm install` needs to run at the root to set up
   the npm workspaces correctly).

## 3. Set environment variables

In the Vercel project's **Settings → Environment Variables**, add:

| Variable | Recommended value | Why |
| --- | --- | --- |
| `MAX_UPLOAD_SIZE_BYTES` | `4000000` | Vercel Functions hard-cap request bodies at **4.5 MB** (not configurable - see [Vercel's function limits](https://vercel.com/docs/functions/limitations#request-body-size)). Setting the app's own limit just under that means users get RepoMedic AI's own clear error message instead of a raw platform error. |
| `VITE_MAX_UPLOAD_SIZE_MB` | `4` | Keeps the upload UI's advertised limit truthful and consistent with the value above. |
| `VITE_GITHUB_REPO_URL` | `https://github.com/<you>/<repo>` | Optional. If set, the landing page shows a "Source" / "View source" link. If unset, those links are simply omitted (no broken links). |

Do **not** set `OLLAMA_BASE_URL` to anything other than the default - a
hosted Vercel Function cannot reach an Ollama instance running on your
own machine. The deployed AI status will honestly show "unavailable",
which is expected and by design (see the landing page's AI section).

Leave everything else at its default (see `.env.example` for the full
list) unless you have a specific reason to change it.

## 4. Deploy

Click **Deploy**. Vercel will:

1. Run `npm install` at the repo root (sets up npm workspaces, including
   `@repomedic/shared`).
2. Run the `buildCommand` from `vercel.json` (`npm run build`, which
   builds the Vite client to `client/dist`).
3. Build `api/index.js` into a single Vercel Function serving everything
   under `/api/*` (see `vercel.json`'s `rewrites`).
4. Serve the built client as the static site, with a SPA fallback
   rewrite so client-side routing (React Router) works on refresh/deep
   links.

## 5. Verify the deployment

Once deployed, check:

- `https://<your-deployment>.vercel.app/` loads the landing page.
- `https://<your-deployment>.vercel.app/app` loads the dashboard.
- Clicking **Load demo repository** returns real findings (this proves
  the demo repository fixture files were correctly bundled into the
  function via `vercel.json`'s `functions.api/index.js.includeFiles` -
  see the troubleshooting note below if this fails).
- The small AI badge on the Findings page shows **AI: unavailable** -
  this is expected and correct for a hosted deployment with no local
  Ollama attached.
- Uploading a small `.zip` works; uploading something near/above the
  configured `MAX_UPLOAD_SIZE_BYTES` shows RepoMedic AI's own clear
  error message, not a raw platform error page.

## Troubleshooting

**`/api/scan/demo` returns a 500 error after deploying.** The demo
repository fixture lives at `server/src/scanner/fixtures/demo-repo/` and
is read from disk at runtime (not imported as code), so Vercel's
function bundler needs an explicit hint to include those files. This is
already configured via `includeFiles` in `vercel.json`:

```json
"functions": {
  "api/index.js": { "includeFiles": "server/src/scanner/fixtures/**" }
}
```

If this still doesn't work after deploying, check the function's logs in
the Vercel dashboard for an `ENOENT` error pointing at the fixtures
directory, and confirm the glob pattern matches your repository layout.

**Uploads fail immediately above a few MB.** This is the hard Vercel
Functions request body limit (4.5 MB), not a RepoMedic AI limit. There is
no workaround for this on Vercel's standard Functions - see Vercel's own
guide on [bypassing the 4.5MB body size limit](https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions)
if you need larger uploads supported, or deploy the backend separately
on a host without that constraint (e.g. Render/Railway/Fly.io) and point
`VITE_API_BASE_URL` at it instead.

## What wasn't live-verified

Being explicit, consistent with this project's engineering rules:

- **No real Vercel deployment was performed while building this.** I do
  not have a Vercel account or API token in this environment. Everything
  above was prepared by (a) reading Vercel's current official
  documentation for Express apps, `vercel.json`, and Functions limits
  directly before writing this config, and (b) testing the actual file
  Vercel will deploy (`api/index.js`) by importing it in an automated
  test and sending real HTTP requests to it with `supertest`
  (`server/test/vercelEntry.test.js`), which passes and proves the
  import path and Express app behave correctly as a plain Node handler.
- What that test **cannot** prove: Vercel's exact rewrite-to-function
  path-preservation behavior, and whether `includeFiles` successfully
  bundles the demo fixture directory. Both are implemented according to
  Vercel's current documented behavior, but the first real deploy is the
  real test. Please treat anything that doesn't match the "Verify the
  deployment" checklist above as a real bug to fix, not an oversight to
  ignore.

## Running locally (for comparison)

This is unrelated to Vercel - see the main [README](./README.md#quick-start)
for the standard two-terminal local setup (`npm run dev:server` +
`npm run dev:client`), which does not use `api/index.js` or `vercel.json`
at all.
