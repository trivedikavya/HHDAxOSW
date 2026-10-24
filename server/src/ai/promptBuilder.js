const MAX_FINDINGS_PER_REQUEST = 25;
const MAX_EVIDENCE_PER_FINDING = 5;
const MAX_FIELD_LENGTH = 500;

function truncate(text, maxLength = MAX_FIELD_LENGTH) {
  if (typeof text !== "string") return "";
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

/**
 * Builds a bounded, already-sanitized summary of a finding for the
 * model. Only fields that already exist on the deterministic Finding
 * object are included - nothing is read from the original repository
 * files again here, so there is no path for secrets or raw file content
 * to reach the model through this function.
 */
function summarizeFinding(finding) {
  return {
    id: finding.id,
    ruleId: finding.ruleId,
    title: finding.title,
    severity: finding.severity,
    category: finding.category,
    message: truncate(finding.message),
    affectedFile: finding.affectedFile,
    evidence: finding.evidence.slice(0, MAX_EVIDENCE_PER_FINDING).map((e) => ({
      file: e.file,
      description: truncate(e.description, 300),
    })),
    recommendation: truncate(finding.recommendation),
  };
}

/**
 * Builds the system and user prompts sent to the AI model for a given
 * scan result. The repository summary and findings sent here are already
 * the sanitized, structured output of the deterministic scanner - never
 * raw file contents, secrets, or environment values.
 *
 * @param {import("../../../shared/schemas/finding.js").ScanResult} scanResult
 */
export function buildInsightPrompt(scanResult) {
  const findings = scanResult.findings.slice(0, MAX_FINDINGS_PER_REQUEST);
  const omittedCount = scanResult.findings.length - findings.length;

  const systemPrompt = [
    "You are an assistant inside RepoMedic AI, a repository onboarding tool.",
    "You will be given a repository summary and a list of findings that were already detected by deterministic, rule-based checks.",
    "Your job is to explain and prioritize these EXISTING findings - you must NEVER invent a new finding, and you must NEVER change the facts already stated in a finding.",
    "For every finding given to you, produce exactly one insight object with: a short explanation of why it matters, a priority level, concrete remediation steps, and concrete verification steps a developer could follow.",
    "You may optionally include a contributor-ready GitHub issue draft (title + body) when it would genuinely help; otherwise set hasIssueDraft to false and leave issueDraftTitle/issueDraftBody empty.",
    "You must NEVER claim to have executed, run, built, tested, or installed anything - you have not. Do not write phrases like \"I ran the tests\" or \"I verified this works\".",
    "Only reference specific file paths that already appear in that finding's affectedFile or evidence; list every such path you mention in referencedFiles. If you don't reference any specific file, leave referencedFiles empty.",
    "Respond with ONLY a single JSON object matching the provided schema - no prose, no markdown fences.",
  ].join(" ");

  const userPromptPayload = {
    repository: {
      name: scanResult.repository.name,
      projectType: scanResult.repository.projectType,
      fileCount: scanResult.repository.fileCount,
    },
    findings: findings.map(summarizeFinding),
    ...(omittedCount > 0
      ? { note: `${omittedCount} additional finding(s) were omitted to keep this request bounded.` }
      : {}),
  };

  const userPrompt = JSON.stringify(userPromptPayload, null, 2);

  return { systemPrompt, userPrompt, includedFindingIds: findings.map((f) => f.id) };
}
