# Adding a new AI model adapter

RepoMedic AI's AI layer never talks to a model provider directly from
route or service code — everything goes through an **adapter** matching
a fixed interface. This is what lets a new provider be added without
touching `aiInsightService.js`, `routes/ai.js`, or any UI component.

Today exactly one adapter ships: `server/src/ai/ollamaAdapter.js` (local
Ollama only — see [docs/ai-model.md](./ai-model.md) for why, and why
there is deliberately no remote/paid provider).

## The interface

Documented in full in `server/src/ai/modelAdapter.js`. A conforming
adapter is a plain object:

```js
{
  id: "your-adapter-id",       // short, machine-readable
  modelId: "the-configured-model-identifier",

  async checkStatus() {
    // Must NEVER throw. Must NEVER trigger a model download.
    return {
      reachable: boolean,       // is the underlying service reachable at all?
      modelInstalled: boolean,  // is the configured model actually available?
      available: boolean,       // reachable && modelInstalled
      message: string,          // safe, user-facing explanation
    };
  },

  async generateJson({ systemPrompt, userPrompt, jsonSchema }) {
    // Returns the raw JSON text from the model (a string).
    // Must throw one of the errors below on failure - never a bare Error.
  },
}
```

### Required error types

Thrown by `generateJson()` (import from `server/src/ai/errors.js`):

| Error | When to throw it |
| --- | --- |
| `ModelTimeoutError` | The request didn't complete within the configured timeout. |
| `ModelUnavailableError` | The service couldn't be reached at all (connection refused, DNS failure, etc.). |
| `ModelRequestError` | The service responded, but with an error status, malformed envelope, or empty content. |

`server/src/ai/modelAdapter.js` exports a `fetchWithTimeout()` helper
that already does this translation for you if your provider speaks HTTP
— see `ollamaAdapter.js` for the pattern.

## Why this shape specifically

- **`checkStatus()` never downloads anything.** RepoMedic AI's principle
  is "do not silently download large model weights" — status checks must
  be read-only (e.g. Ollama's adapter calls `GET /api/tags`, never
  `POST /api/pull`).
- **`generateJson()` takes a `jsonSchema`.** The caller
  (`aiInsightService.js`) generates this from the shared Zod schema via
  `z.toJSONSchema()` and expects your adapter to pass it through to the
  provider's structured-output / JSON-schema-constrained generation
  feature if it has one (Ollama's `format` parameter, for example). If
  your provider has no such feature, you can ignore the parameter, but
  expect a higher rate of responses that fail the server-side validation
  in `validateInsightResponse.js` (which runs regardless, as a second
  line of defense — structured output from the provider is a quality
  improvement, not a replacement for that validation).
- **Distinct error types, not generic `Error`.** `aiInsightService.js`
  pattern-matches on these to decide whether to report `"unavailable"`
  (temporary/environmental) vs `"error"` (something is actually wrong
  with the response) to the UI — see `generateAiInsights()`.

## Wiring it in

1. Create `server/src/ai/yourAdapter.js` implementing the interface above.
2. Add configuration to `server/src/services/config.js` (base URL, model
   identifier, timeouts — follow the `ollama*` naming pattern already
   there) and document the new environment variables in `.env.example`.
3. Update `server/src/routes/ai.js`'s `getAdapter()` to construct your
   adapter (today this is hard-coded to Ollama; a future "pick a
   provider via env var" switch would live here).
4. Document the adapter in `docs/ai-model.md`: exact provider, exact
   model identifier, its license, and whether it requires a paid API key
   (if it does, it cannot be the *default* — RepoMedic AI's default local
   workflow must never require payment).

## Testing a new adapter

Follow the pattern in `server/test/ai/ollamaAdapter.test.js`: mock
`global.fetch` (or whatever transport your provider uses) with
`vi.stubGlobal`, and cover:

- `checkStatus()`: reachable+installed, reachable+not installed,
  unreachable, non-OK HTTP status, malformed JSON body (must resolve, not
  throw, in every case).
- `generateJson()`: success, non-OK HTTP status (→ `ModelRequestError`),
  empty content (→ `ModelRequestError`), simulated timeout/abort (→
  `ModelTimeoutError`), simulated network failure (→
  `ModelUnavailableError`).

Then add an integration test mirroring
`server/test/routes/ai.test.js` to prove the full
route → service → adapter → validation pipeline works with your adapter
wired in, including the case where it's unavailable (the deterministic
scan result must remain unaffected — this is non-negotiable for any
adapter).
