import { z } from "zod";
import { PRIORITY_LEVELS } from "./enums.js";

/**
 * Contributor-ready issue draft, optional per insight.
 */
export const IssueDraftSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(4000),
});

/**
 * Public, client-facing shape of a single AI insight attached to an
 * existing deterministic finding. This is what the rest of the app
 * (API responses, UI components, tests) works with.
 *
 * `verifiedBy` is always the literal "ai-suggestion" - an AI insight can
 * never claim to be a "deterministic-rule" result, which keeps AI
 * suggestions structurally distinguishable from scanner findings even if
 * every other field were somehow spoofed.
 */
export const AiInsightSchema = z.object({
  findingId: z.string().min(1),
  explanation: z.string().min(1).max(4000),
  priority: z.enum(PRIORITY_LEVELS),
  remediationSteps: z.array(z.string().min(1).max(500)).min(1).max(8),
  verificationSteps: z.array(z.string().min(1).max(500)).min(1).max(8),
  issueDraft: IssueDraftSchema.nullable(),
  verifiedBy: z.literal("ai-suggestion"),
});

/**
 * The "wire" shape requested from the model itself.
 *
 * This is intentionally flatter than AiInsightSchema (no nullable /
 * literal fields) because it is converted to a JSON Schema via
 * `z.toJSONSchema()` and sent to Ollama's `format` parameter to constrain
 * the model's output via grammar-based structured decoding. Not every
 * local model/backend handles `nullable`/`anyOf` JSON Schema constructs
 * equally well, so the wire schema sticks to plain required
 * strings/booleans/arrays, and the server translates it into the richer
 * public AiInsightSchema after validation.
 *
 * `referencedFiles` lets the model declare which specific file paths it
 * mentions in its explanation/remediation text, so the server can reject
 * insights that reference files that were never part of the original
 * finding's evidence (see validateInsightResponse.js on the server).
 */
export const AiInsightWireSchema = z.object({
  findingId: z.string().min(1),
  explanation: z.string().min(1).max(4000),
  priority: z.enum(PRIORITY_LEVELS),
  remediationSteps: z.array(z.string().min(1).max(500)).min(1).max(8),
  verificationSteps: z.array(z.string().min(1).max(500)).min(1).max(8),
  hasIssueDraft: z.boolean(),
  issueDraftTitle: z.string().max(200),
  issueDraftBody: z.string().max(4000),
  referencedFiles: z.array(z.string().max(300)).max(10),
});

export const AiModelWireResponseSchema = z.object({
  insights: z.array(AiInsightWireSchema).max(50),
});

/**
 * Full AI insight API response returned to the client.
 */
export const AiInsightsResultSchema = z.object({
  status: z.enum(["ok", "unavailable", "error"]),
  modelId: z.string().nullable(),
  generatedAt: z.string().nullable(),
  insights: z.array(AiInsightSchema),
  warnings: z.array(z.string()),
  message: z.string().nullable(),
});

/**
 * @typedef {z.infer<typeof AiInsightSchema>} AiInsight
 * @typedef {z.infer<typeof AiInsightWireSchema>} AiInsightWire
 * @typedef {z.infer<typeof AiModelWireResponseSchema>} AiModelWireResponse
 * @typedef {z.infer<typeof AiInsightsResultSchema>} AiInsightsResult
 */
