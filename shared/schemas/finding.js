import { z } from "zod";
import {
  SEVERITY_LEVELS,
  FINDING_CATEGORIES,
  VERIFIED_BY_VALUES,
} from "./enums.js";

/**
 * A single piece of evidence backing a finding. Evidence must be derived
 * from actual repository content inspected by a deterministic rule -
 * never invented.
 */
export const EvidenceSchema = z.object({
  /**
   * The file or location the evidence relates to. Use "repository-root"
   * when the evidence is not tied to a specific file (e.g. "no README
   * found at the root").
   */
  file: z.string().min(1),
  /** Human-readable description of what was actually observed. */
  description: z.string().min(1),
});

/**
 * The canonical Finding schema. Every scanner rule must produce findings
 * that satisfy this schema, and the report exporter / UI must render from
 * this same shape so there is a single source of truth for the data
 * contract described in the product brief.
 */
export const FindingSchema = z.object({
  /** Stable, unique identifier for this specific finding instance. */
  id: z.string().min(1),
  /** The rule identifier that produced this finding, e.g. "README_MISSING". */
  ruleId: z.string().min(1),
  title: z.string().min(1),
  severity: z.enum(SEVERITY_LEVELS),
  category: z.enum(FINDING_CATEGORIES),
  message: z.string().min(1),
  evidence: z.array(EvidenceSchema).min(1),
  /**
   * The single most relevant affected file path, if one can be reliably
   * determined. Must be null rather than guessed when uncertain.
   */
  affectedFile: z.string().nullable(),
  recommendation: z.string().min(1),
  /**
   * Phase 1 only ever produces "deterministic-rule" findings. This field
   * exists now so Phase 2 can introduce AI-derived values without a
   * breaking schema change.
   */
  verifiedBy: z.enum(VERIFIED_BY_VALUES),
});

/** Repository metadata gathered during a scan. */
export const RepositoryMetaSchema = z.object({
  /** Human-facing name - from the uploaded archive name or demo fixture. */
  name: z.string().min(1),
  /** Detected project type, see PROJECT_TYPES in enums.js. */
  projectType: z.string().min(1),
  /** Total number of files inspected (post safety filtering). */
  fileCount: z.number().int().nonnegative(),
  /** True when the repository was the bundled demo fixture. */
  isDemo: z.boolean(),
});

/** Full result of scanning one repository. */
export const ScanResultSchema = z.object({
  scanId: z.string().min(1),
  repository: RepositoryMetaSchema,
  findings: z.array(FindingSchema),
  /** ISO 8601 timestamp of when the scan completed. */
  completedAt: z.string().min(1),
});

/**
 * @typedef {z.infer<typeof EvidenceSchema>} Evidence
 * @typedef {z.infer<typeof FindingSchema>} Finding
 * @typedef {z.infer<typeof RepositoryMetaSchema>} RepositoryMeta
 * @typedef {z.infer<typeof ScanResultSchema>} ScanResult
 */
