import { detectProjectType } from "./projectType.js";
import { rules } from "./rules/index.js";
import { makeFindingId } from "../utils/stableId.js";

/**
 * Runs every registered scanner rule against a repository snapshot and
 * returns a flat, validated list of findings.
 *
 * Each rule module exports:
 *   - id: string, stable and unique across the registry
 *   - category: one of FINDING_CATEGORIES (shared/schemas/enums.js)
 *   - appliesTo(projectType): boolean (optional, defaults to always true)
 *   - evaluate(context): Array<FindingInput>
 *
 * A FindingInput omits `id`, `ruleId`, and `verifiedBy` - the engine fills
 * those in so individual rules cannot accidentally produce inconsistent
 * identifiers or claim a verification method they don't have.
 *
 * @param {ReturnType<import("./repoSnapshot.js").buildRepoSnapshot>} snapshot
 * @returns {{
 *   projectType: string,
 *   findings: import("../../../shared/schemas/finding.js").Finding[],
 * }}
 */
export function runScan(snapshot) {
  const { projectType, packageManifest, packageManifestParseError } =
    detectProjectType(snapshot);

  const context = { snapshot, projectType, packageManifest, packageManifestParseError };

  /** @type {import("../../../shared/schemas/finding.js").Finding[]} */
  const findings = [];

  for (const rule of rules) {
    if (typeof rule.appliesTo === "function" && !rule.appliesTo(projectType)) {
      continue;
    }

    let ruleFindings = [];
    try {
      ruleFindings = rule.evaluate(context) ?? [];
    } catch (err) {
      // A single misbehaving rule must never take down the whole scan.
      // eslint-disable-next-line no-console
      console.error(`Scanner rule "${rule.id}" threw an error:`, err?.message);
      continue;
    }

    for (const input of ruleFindings) {
      findings.push({
        id: makeFindingId(rule.id, input.discriminator ?? input.affectedFile ?? null),
        ruleId: rule.id,
        title: input.title,
        severity: input.severity,
        category: input.category ?? rule.category,
        message: input.message,
        evidence: input.evidence,
        affectedFile: input.affectedFile ?? null,
        recommendation: input.recommendation,
        verifiedBy: "deterministic-rule",
      });
    }
  }

  return { projectType, findings };
}
