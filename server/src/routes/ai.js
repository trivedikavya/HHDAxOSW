import { Router } from "express";
import { ScanResultSchema } from "@repomedic/shared";
import { createOllamaAdapter } from "../ai/ollamaAdapter.js";
import { getAiStatus, generateAiInsights } from "../services/aiInsightService.js";
import { getConfig } from "../services/config.js";

export const aiRouter = Router();

function getAdapter() {
  const config = getConfig();
  return createOllamaAdapter({
    baseUrl: config.ollamaBaseUrl,
    model: config.ollamaModel,
    statusTimeoutMs: config.aiStatusTimeoutMs,
    requestTimeoutMs: config.aiRequestTimeoutMs,
  });
}

/**
 * GET /api/ai/status
 * Reports whether the configured local Ollama service is reachable and
 * the configured model is installed. Never triggers a model download.
 */
aiRouter.get("/status", async (req, res) => {
  const status = await getAiStatus(getAdapter());
  res.json(status);
});

/**
 * POST /api/ai/explain
 * Body: { scanResult: ScanResult }
 *
 * Generates AI explanations/prioritization/remediation for the findings
 * in the given scan result. The deterministic scan result is re-validated
 * against the shared schema before being used, since it originates from
 * the client. Always responds 200 with a status field ("ok" |
 * "unavailable" | "error") rather than a transport-level error, so the
 * client can keep the deterministic findings/report UI fully usable
 * regardless of AI availability.
 */
aiRouter.post("/explain", async (req, res) => {
  const parsed = ScanResultSchema.safeParse(req.body?.scanResult);
  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: "INVALID_SCAN_RESULT",
        message: "The provided scan result was missing or malformed.",
      },
    });
    return;
  }

  const result = await generateAiInsights({ scanResult: parsed.data, adapter: getAdapter() });
  res.json(result);
});
