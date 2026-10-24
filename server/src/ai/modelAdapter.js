/**
 * Model adapter interface.
 *
 * RepoMedic AI never talks to a model provider directly from the
 * insight/service/route layer - everything goes through an adapter
 * implementing this shape. This is what makes it possible to add another
 * local (or, in principle, remote) provider later without touching
 * `aiInsightService.js` or any route.
 *
 * Phase 2 ships exactly one implementation: `ollamaAdapter.js`, talking
 * to a local Ollama instance. There is no remote/paid provider, by
 * design - see docs/ai-model.md.
 *
 * A conforming adapter must implement:
 *
 * ```
 * {
 *   id: string,                 // short machine-readable adapter name, e.g. "ollama"
 *   modelId: string,            // the configured model identifier, e.g. "qwen2.5:1.5b"
 *
 *   // Checks whether the underlying service is reachable AND the
 *   // configured model is actually installed, WITHOUT triggering any
 *   // download. Must never throw - always resolves to a status object.
 *   async checkStatus(): Promise<{
 *     reachable: boolean,
 *     modelInstalled: boolean,
 *     available: boolean,       // reachable && modelInstalled
 *     message: string,          // safe, user-facing explanation
 *   }>,
 *
 *   // Requests a JSON response constrained to the given JSON Schema.
 *   // Must throw ModelTimeoutError, ModelUnavailableError, or
 *   // ModelRequestError (see errors.js) on failure - never a generic
 *   // Error - so the caller can react appropriately.
 *   async generateJson({
 *     systemPrompt: string,
 *     userPrompt: string,
 *     jsonSchema: object,
 *   }): Promise<string>,        // raw JSON text from the model
 * }
 * ```
 *
 * This file intentionally contains no executable adapter logic - it is
 * documentation plus the shared timeout/fetch helper used by concrete
 * adapters.
 */

import { ModelTimeoutError, ModelUnavailableError } from "./errors.js";

/**
 * Wraps the global `fetch` with an abort-based timeout, translating
 * jsdom/node-fetch style abort errors and connection failures into the
 * adapter's own error types so callers never need to know about
 * `AbortController` or raw `TypeError: fetch failed` messages.
 *
 * @param {string} url
 * @param {RequestInit} init
 * @param {number} timeoutMs
 */
export async function fetchWithTimeout(url, init, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new ModelTimeoutError();
    }
    throw new ModelUnavailableError();
  } finally {
    clearTimeout(timer);
  }
}
