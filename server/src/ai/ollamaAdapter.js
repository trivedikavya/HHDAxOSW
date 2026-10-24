import { fetchWithTimeout } from "./modelAdapter.js";
import { ModelRequestError, ModelUnavailableError } from "./errors.js";

/**
 * Model adapter for a locally running Ollama instance
 * (https://ollama.com). Implements the interface documented in
 * modelAdapter.js.
 *
 * No API key is used or required - this only ever talks to a local HTTP
 * service the user runs themselves. This adapter never triggers a model
 * download (it never calls Ollama's `/api/pull`): `checkStatus()` only
 * reads the locally installed model list via `GET /api/tags`.
 *
 * @param {{ baseUrl: string, model: string, statusTimeoutMs: number, requestTimeoutMs: number }} options
 */
export function createOllamaAdapter({ baseUrl, model, statusTimeoutMs, requestTimeoutMs }) {
  return {
    id: "ollama",
    modelId: model,

    async checkStatus() {
      let response;
      try {
        response = await fetchWithTimeout(
          `${baseUrl}/api/tags`,
          { method: "GET" },
          statusTimeoutMs
        );
      } catch {
        return {
          reachable: false,
          modelInstalled: false,
          available: false,
          message:
            "Could not reach the local Ollama service. Make sure Ollama is installed and running (see docs/ai-model.md).",
        };
      }

      if (!response.ok) {
        return {
          reachable: true,
          modelInstalled: false,
          available: false,
          message: `Ollama responded with an unexpected status (HTTP ${response.status}).`,
        };
      }

      let body;
      try {
        body = await response.json();
      } catch {
        return {
          reachable: true,
          modelInstalled: false,
          available: false,
          message: "Ollama returned an unexpected (non-JSON) response.",
        };
      }

      const installedModels = Array.isArray(body?.models) ? body.models : [];
      const modelInstalled = installedModels.some(
        (entry) => entry?.model === model || entry?.name === model
      );

      return {
        reachable: true,
        modelInstalled,
        available: modelInstalled,
        message: modelInstalled
          ? `Connected to Ollama. Model "${model}" is installed.`
          : `Ollama is running, but model "${model}" is not installed. Run: ollama pull ${model}`,
      };
    },

    async generateJson({ systemPrompt, userPrompt, jsonSchema }) {
      let response;
      try {
        response = await fetchWithTimeout(
          `${baseUrl}/api/chat`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
              stream: false,
              format: jsonSchema,
              options: { temperature: 0 },
            }),
          },
          requestTimeoutMs
        );
      } catch (err) {
        // fetchWithTimeout already translates abort/network failures into
        // ModelTimeoutError / ModelUnavailableError - just rethrow.
        throw err;
      }

      if (!response.ok) {
        throw new ModelRequestError(`Ollama responded with HTTP ${response.status}.`);
      }

      let body;
      try {
        body = await response.json();
      } catch {
        throw new ModelRequestError("Ollama returned a non-JSON response envelope.");
      }

      const content = body?.message?.content;
      if (typeof content !== "string" || content.trim().length === 0) {
        throw new ModelRequestError("Ollama returned an empty response.");
      }

      return content;
    },
  };
}

// Re-exported so callers that only need to distinguish adapter failures
// don't have to import from ./errors.js directly.
export { ModelUnavailableError, ModelRequestError };
