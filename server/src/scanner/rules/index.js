/**
 * Scanner rule registry.
 *
 * To add a new rule:
 *   1. Create a new file in this directory exporting a `rule` object with
 *      the shape described in server/src/scanner/engine.js.
 *   2. Import it below and add it to the `rules` array.
 *   3. Add a test file under server/test/scanner/rules/ covering the
 *      positive, negative, and at least one edge case.
 *
 * Nothing outside this file needs to change to register a new rule - the
 * scan engine iterates this array generically.
 */

import { rule as readmeMissing } from "./readmeMissing.js";
import { rule as licenseMissing } from "./licenseMissing.js";
import { rule as contributingMissing } from "./contributingMissing.js";
import { rule as testSetupMissing } from "./testSetupMissing.js";
import { rule as readmeDeadLinks } from "./readmeDeadLinks.js";
import { rule as readmeScriptMismatch } from "./readmeScriptMismatch.js";
import { rule as envExampleMissing } from "./envExampleMissing.js";

export const rules = [
  readmeMissing,
  licenseMissing,
  contributingMissing,
  testSetupMissing,
  readmeDeadLinks,
  readmeScriptMismatch,
  envExampleMissing,
];
