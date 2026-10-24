import { AiInsightSchema, AiModelWireResponseSchema } from "@repomedic/shared";

// Best-effort, non-exhaustive heuristic: catches the most common ways a
// model might claim to have done something it never did (executed code,
// run tests, verified a fix). This is a quality guard, not a security
// boundary - it cannot catch every phrasing, and callers should not rely
// on it alone to prevent the model from ever making unsupported claims.
const FABRICATED_VERIFICATION_PATTERN =
  /\bI\s+(have\s+)?(ran|run|executed|installed|built|tested)\b|\btests?\s+(pass|passed|are passing)\b|\bI\s+verified\s+(this|it|that)\s+works\b/i;

function containsFabricatedClaim(insight) {
  const haystack = [insight.explanation, ...insight.remediationSteps, ...insight.verificationSteps].join(
    " "
  );
  return FABRICATED_VERIFICATION_PATTERN.test(haystack);
}

function allowedFilesForFinding(finding) {
  const files = new Set(["repository-root"]);
  if (finding.affectedFile) files.add(finding.affectedFile);
  for (const evidence of finding.evidence) {
    if (evidence.file) files.add(evidence.file);
  }
  return files;
}

/**
 * Validates a raw JSON string returned by the model against:
 *   1. Valid JSON syntax.
 *   2. The wire schema (AiModelWireResponseSchema) - structural validity.
 *   3. Per-insight semantic checks:
 *      - findingId must match a real finding from this scan (reject
 *        unknown finding IDs - the model cannot invent findings).
 *      - referencedFiles must be a subset of that finding's own
 *        affectedFile/evidence files (reject unsupported file references).
 *      - must not contain an obviously fabricated "I ran/tested this"
 *        claim (best-effort heuristic).
 *      - must still satisfy the public AiInsightSchema once translated
 *        from the wire shape (defense in depth).
 *
 * Insights that fail step 3 are dropped individually rather than
 * rejecting the whole response, so one bad insight doesn't discard
 * everything else the model got right. Insights that fail steps 1-2
 * reject the entire response (there is nothing safe to salvage from
 * malformed JSON or a structurally invalid envelope).
 *
 * @param {string} rawText
 * @param {import("../../../shared/schemas/finding.js").Finding[]} findings
 * @returns {{
 *   insights: import("../../../shared/schemas/aiInsight.js").AiInsight[],
 *   droppedCount: number,
 *   warnings: string[],
 *   fatalError: string|null,
 * }}
 */
export function validateInsightResponse(rawText, findings) {
  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return { insights: [], droppedCount: 0, warnings: [], fatalError: "The AI model's response was not valid JSON." };
  }

  const wireResult = AiModelWireResponseSchema.safeParse(parsed);
  if (!wireResult.success) {
    return {
      insights: [],
      droppedCount: 0,
      warnings: [],
      fatalError: "The AI model's response did not match the expected structure.",
    };
  }

  const findingsById = new Map(findings.map((f) => [f.id, f]));
  const seenFindingIds = new Set();

  const insights = [];
  let droppedCount = 0;
  const warnings = [];

  for (const wireInsight of wireResult.data.insights) {
    const finding = findingsById.get(wireInsight.findingId);
    if (!finding) {
      droppedCount += 1;
      warnings.push(`Dropped an AI insight referencing an unknown finding ID.`);
      continue;
    }

    if (seenFindingIds.has(wireInsight.findingId)) {
      droppedCount += 1;
      continue; // duplicate insight for the same finding - keep the first.
    }

    const allowedFiles = allowedFilesForFinding(finding);
    const hasUnsupportedReference = wireInsight.referencedFiles.some(
      (file) => !allowedFiles.has(file)
    );
    if (hasUnsupportedReference) {
      droppedCount += 1;
      warnings.push(
        `Dropped an AI insight for "${finding.id}" that referenced a file not present in that finding's evidence.`
      );
      continue;
    }

    if (containsFabricatedClaim(wireInsight)) {
      droppedCount += 1;
      warnings.push(
        `Dropped an AI insight for "${finding.id}" that appeared to claim it had executed or verified something.`
      );
      continue;
    }

    const candidate = {
      findingId: wireInsight.findingId,
      explanation: wireInsight.explanation,
      priority: wireInsight.priority,
      remediationSteps: wireInsight.remediationSteps,
      verificationSteps: wireInsight.verificationSteps,
      issueDraft:
        wireInsight.hasIssueDraft && wireInsight.issueDraftTitle && wireInsight.issueDraftBody
          ? { title: wireInsight.issueDraftTitle, body: wireInsight.issueDraftBody }
          : null,
      verifiedBy: "ai-suggestion",
    };

    const finalCheck = AiInsightSchema.safeParse(candidate);
    if (!finalCheck.success) {
      droppedCount += 1;
      warnings.push(`Dropped an AI insight for "${finding.id}" that failed final validation.`);
      continue;
    }

    seenFindingIds.add(wireInsight.findingId);
    insights.push(finalCheck.data);
  }

  return { insights, droppedCount, warnings, fatalError: null };
}
