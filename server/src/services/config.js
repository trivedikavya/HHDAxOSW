/**
 * Centralized, validated server configuration read from environment
 * variables with safe defaults. Nothing here reads secrets - these are
 * operational limits only. See .env.example for documentation.
 */

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return fallback;
}

export function getConfig() {
  return {
    port: parsePositiveInt(process.env.PORT, 5174),
    // 25 MiB default upload cap.
    maxUploadSizeBytes: parsePositiveInt(
      process.env.MAX_UPLOAD_SIZE_BYTES,
      25 * 1024 * 1024
    ),
    // 100 MiB default cumulative extracted-size cap (zip-bomb guard).
    maxExtractedTotalSizeBytes: parsePositiveInt(
      process.env.MAX_EXTRACTED_TOTAL_SIZE_BYTES,
      100 * 1024 * 1024
    ),
    maxExtractedFileCount: parsePositiveInt(
      process.env.MAX_EXTRACTED_FILE_COUNT,
      5000
    ),
    // 5 MiB default per-file cap.
    maxSingleFileSizeBytes: parsePositiveInt(
      process.env.MAX_SINGLE_FILE_SIZE_BYTES,
      5 * 1024 * 1024
    ),
  };
}
