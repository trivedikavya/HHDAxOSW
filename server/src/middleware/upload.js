import multer from "multer";
import { getConfig } from "../services/config.js";

/**
 * Multer instance configured to buffer the uploaded archive entirely in
 * memory (never written to disk) with a strict size cap. A single file
 * field named "repository" is accepted.
 */
export function createUploadMiddleware() {
  const config = getConfig();
  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: config.maxUploadSizeBytes,
      files: 1,
    },
  }).single("repository");
}
