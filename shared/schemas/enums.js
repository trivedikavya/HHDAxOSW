/**
 * Central enums for RepoMedic AI.
 *
 * Keep these lists as the single source of truth. Both the server
 * (scanner rules, report generation) and the client (UI badges, filters)
 * must import from here instead of redefining their own string lists.
 */

export const SEVERITY_LEVELS = ["critical", "high", "medium", "low", "info"];

/**
 * Order used for sorting findings from most to least severe.
 * Lower index = more severe.
 */
export const SEVERITY_ORDER = Object.fromEntries(
  SEVERITY_LEVELS.map((level, index) => [level, index])
);

export const FINDING_CATEGORIES = [
  "documentation",
  "testing",
  "configuration",
  "security-hygiene",
  "consistency",
  "project-metadata",
];

/**
 * "deterministic-rule" is produced by the Phase 1 scanner engine.
 * "ai-suggestion" is produced by the Phase 2 AI adapter and must never be
 * used to describe scanner output - the two are kept visually and
 * structurally distinct everywhere in the app.
 */
export const VERIFIED_BY_VALUES = ["deterministic-rule", "ai-suggestion"];

/**
 * Supported project types the scanner can currently detect.
 * "unknown" is a valid, honest outcome when no recognized manifest is found.
 */
export const PROJECT_TYPES = ["node-javascript", "unknown"];

/**
 * AI-assigned priority reuses the severity scale rather than introducing
 * a second, parallel ranking system. The AI may re-order priority within
 * this scale based on evidence/impact, but cannot invent new levels.
 */
export const PRIORITY_LEVELS = SEVERITY_LEVELS;
