import { z } from "zod";
import { AiModelWireResponseSchema } from "@repomedic/shared";
import { buildInsightPrompt } from "../ai/promptBuilder.js";
import { validateInsightResponse } from "../ai/validateInsightResponse.js";
import { ModelTimeoutError, ModelUnavailableError, ModelRequestError } from "../ai/errors.js";

// Generated once per process - the JSON Schema never changes at runtime.
const INSIGHT_JSON_SCHEMA = z.toJSONSchema(AiModelWireResponseSchema);

/**
 * Checks whether the configured AI adapter is reachable and its model is
 * installed. Never throws - always resolves to a status object safe to
 * return directly from an API route.
 *
 * @param {import("../ai/modelAdapter.js")} adapter
 */
export async function getAiStatus(adapter) {
  const status = await adapter.checkStatus();
  return { ...status, modelId: adapter.modelId, adapterId: adapter.id };
}

/**
 * Generates AI insights for every finding in a scan result, using the
 * given model adapter. This function never throws - every failure mode
 * (service unreachable, model missing, timeout, malformed response) is
 * translated into a `status` the caller/UI can render directly, so the
 * deterministic scan result is always safe to keep showing regardless of
 * what happens here.
 *
 * @param {{ scanResult: import("../../../shared/schemas/finding.js").ScanResult, adapter: import("../ai/modelAdapter.js") }} params
 * @returns {Promise<import("../../../shared/schemas/aiInsight.js").AiInsightsResult>}
 */
export async function generateAiInsights({ scanResult, adapter }) {
  const status = await adapter.checkStatus();
  if (!status.available) {
    return {
      status: "unavailable",
      modelId: adapter.modelId,
      generatedAt: null,
      insights: [],
      warnings: [],
      message: status.message,
    };
  }

  if (scanResult.findings.length === 0) {
    return {
      status: "ok",
      modelId: adapter.modelId,
      generatedAt: new Date().toISOString(),
      insights: [],
      warnings: [],
      message: null,
    };
  }

  const { systemPrompt, userPrompt } = buildInsightPrompt(scanResult);

  let rawContent;
  try {
    rawContent = await adapter.generateJson({
      systemPrompt,
      userPrompt,
      jsonSchema: INSIGHT_JSON_SCHEMA,
    });
  } catch (err) {
    if (err instanceof ModelTimeoutError) {
      return {
        status: "unavailable",
        modelId: adapter.modelId,
        generatedAt: null,
        insights: [],
        warnings: [],
        message: "The AI model timed out before responding. You can try again.",
      };
    }
    if (err instanceof ModelUnavailableError) {
      return {
        status: "unavailable",
        modelId: adapter.modelId,
        generatedAt: null,
        insights: [],
        warnings: [],
        message: "The AI model service could not be reached.",
      };
    }
    if (err instanceof ModelRequestError) {
      return {
        status: "error",
        modelId: adapter.modelId,
        generatedAt: null,
        insights: [],
        warnings: [],
        message: err.message,
      };
    }
    throw err; // genuinely unexpected - let the route's error handler log it
  }

  const validation = validateInsightResponse(rawContent, scanResult.findings);

  if (validation.fatalError) {
    return {
      status: "error",
      modelId: adapter.modelId,
      generatedAt: null,
      insights: [],
      warnings: [],
      message: validation.fatalError,
    };
  }

  return {
    status: "ok",
    modelId: adapter.modelId,
    generatedAt: new Date().toISOString(),
    insights: validation.insights,
    warnings: validation.warnings,
    message: null,
  };
}
