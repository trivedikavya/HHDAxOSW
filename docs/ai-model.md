# AI model: what RepoMedic AI actually uses

This document exists so nobody has to guess what model runs, where it
comes from, or under what license — per the project's rule that we never
claim support for a model without documenting this first.

## Provider: Ollama (local only)

RepoMedic AI's Phase 2 AI layer talks to a single provider:
[Ollama](https://ollama.com), running **locally on your own machine**.

- No API key, account, or internet access is required for inference once
  the model is downloaded.
- RepoMedic AI's server never calls any remote/hosted LLM API and never
  requires a paid key for the default workflow.
- RepoMedic AI's server **never triggers a model download**. It only
  reads the list of models you already have installed
  (`GET /api/tags`). If the configured model isn't installed, the status
  indicator tells you the exact `ollama pull <model>` command to run —
  it does not run it for you.

## Default model: `qwen2.5:1.5b`

| | |
|---|---|
| Model identifier (`OLLAMA_MODEL`) | `qwen2.5:1.5b` |
| Source | [ollama.com/library/qwen2.5:1.5b](https://ollama.com/library/qwen2.5:1.5b) (upstream: [Qwen2.5](https://github.com/QwenLM/Qwen2.5) by Alibaba Cloud) |
| License | **Apache License 2.0** — confirmed on the model's Ollama library page, which states "all models except the 3B and 72B are released under the Apache 2.0 license." The `1.5b` tag used here is one of the Apache-2.0 sizes. If you switch to `qwen2.5:3b` or `qwen2.5:72b`, note that those specific sizes ship under the separate **Qwen Research License**, not Apache 2.0 — check the license tab on the model's own library page before using a different tag. |
| Parameters | ~1.54B |
| Quantization | Q4_K_M (as published on Ollama) |
| Download size | ~986 MB |
| Why this one | Small enough to run on modest hardware, Apache-2.0 licensed (no usage restrictions beyond standard Apache terms), and Qwen2.5's own model card specifically highlights strong structured/JSON output generation, which this feature relies on. |

You can point RepoMedic AI at a different installed Ollama model at any
time by setting `OLLAMA_MODEL` in `.env` — nothing in the code is
hard-coded to this specific model. If you do, **check that model's own
license before relying on it**; licenses vary significantly between
model families (e.g. Llama 3.2 uses Meta's custom community license,
Gemma uses Google's Gemma license, Phi-3 uses MIT).

## What was and wasn't actually tested

Being explicit here because the project rules require it:

- The **adapter's request/response handling** (building the Ollama HTTP
  request, parsing `message.content`, timeout/network-error/non-OK-status
  handling) is covered by automated tests
  (`server/test/ai/ollamaAdapter.test.js`) using mocked HTTP responses
  that match Ollama's **documented** API shape (`POST /api/chat`,
  `GET /api/tags`), verified against Ollama's own API reference.
- The **end-to-end route** (`POST /api/ai/explain`) is covered by an
  integration test that mocks the same HTTP layer and exercises the real
  route → service → adapter → validation pipeline
  (`server/test/routes/ai.test.js`).
- **A live call to a real, running `qwen2.5:1.5b` model was not made**
  during development, because Ollama is not installed in the sandboxed
  environment this was built in. The live, manually-verified behavior
  in that environment was: with Ollama genuinely not running,
  `GET /api/ai/status` correctly reports `available: false` with an
  actionable message, and `POST /api/ai/explain` correctly returns
  `{"status":"unavailable", ...}` while leaving the deterministic scan
  and Markdown report fully functional.
- If you have Ollama installed, running `npm run dev:server` and then
  `ollama pull qwen2.5:1.5b` followed by a scan + "Explain with AI" in
  the UI will exercise the real model call end-to-end. Please treat any
  issues you find there as real bugs to report — this path specifically
  was not live-verified during the build.

## Local setup

```bash
# 1. Install Ollama: https://ollama.com/download

# 2. Pull the default model (one-time, ~986 MB download)
ollama pull qwen2.5:1.5b

# 3. Make sure the Ollama service is running (it usually starts
#    automatically after install; otherwise:)
ollama serve

# 4. Start RepoMedic AI's server as usual
npm run dev:server
```

Then open the app, run a scan, and click **Explain with AI** on the
Findings page. The small AI status badge next to the page title shows
whether the model is currently reachable and installed.

## Data sent to the model

For every request, only the following is sent to the local model — never
raw file contents, secrets, or environment variable values:

- Repository name, detected project type, and file count.
- Up to 25 deterministic findings per request, each reduced to: rule ID,
  title, severity, category, a truncated message, the affected file path
  (if any), up to 5 truncated evidence entries, and the recommendation.

See `server/src/ai/promptBuilder.js` for the exact implementation.

## Response validation

Every model response is validated before anything reaches the UI
(`server/src/ai/validateInsightResponse.js`):

- Must be valid JSON matching a strict Zod/JSON-Schema structure (the
  schema is also passed to Ollama's `format` parameter to constrain
  generation, per [Ollama's structured outputs feature](https://github.com/ollama/ollama/blob/main/docs/api.md#structured-outputs)).
- Each insight must reference a real finding ID from the scan that was
  actually sent — unknown finding IDs are dropped.
- Any file path the model claims to reference must already appear in
  that finding's own evidence/affected file — unsupported references are
  dropped.
- A best-effort heuristic drops insights that claim to have "run",
  "executed", or "tested" something (the model never does this).
- `verifiedBy` is always forced to `"ai-suggestion"` and can never be
  confused with a deterministic finding.

Invalid insights are dropped individually; a single bad insight never
discards the rest of a response, and the deterministic scan result is
never affected by anything in this document.
