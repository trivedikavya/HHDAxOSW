/**
 * Builds a stable finding ID from a rule ID and an optional discriminator
 * (usually the affected file path). Using the same discriminator for the
 * same underlying issue means re-scanning an unchanged repository
 * produces the same finding IDs.
 *
 * @param {string} ruleId
 * @param {string|null} [discriminator]
 */
export function makeFindingId(ruleId, discriminator) {
  const safeDiscriminator = discriminator ?? "root";
  return `${ruleId}::${safeDiscriminator}`;
}
