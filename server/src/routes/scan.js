import { Router } from "express";
import path from "node:path";
import { createUploadMiddleware } from "../middleware/upload.js";
import { extractZipSafely, ArchiveSafetyError } from "../services/archiveSafety.js";
import { performScan } from "../services/scanService.js";
import { loadDemoRepoFiles, DEMO_REPO_NAME } from "../services/demoRepoService.js";
import { getConfig } from "../services/config.js";

export const scanRouter = Router();

const upload = createUploadMiddleware();

function sendArchiveError(res, code, message) {
  res.status(400).json({ error: { code, message } });
}

/**
 * POST /api/scan/upload
 * Accepts a single ZIP archive (multipart field "repository"), safely
 * extracts it in memory, and runs it through the deterministic scanner
 * pipeline.
 */
scanRouter.post(
  "/upload",
  (req, res, next) => {
    upload(req, res, (err) => {
      if (!err) return next();

      if (err.code === "LIMIT_FILE_SIZE") {
        sendArchiveError(
          res,
          "ARCHIVE_TOO_LARGE",
          "The uploaded file exceeds the maximum allowed upload size."
        );
        return;
      }

      sendArchiveError(
        res,
        "UPLOAD_ERROR",
        "The upload could not be processed. Please try again."
      );
    });
  },
  async (req, res) => {
    if (!req.file) {
      sendArchiveError(
        res,
        "ARCHIVE_MISSING",
        "No file was uploaded. Please attach a .zip archive."
      );
      return;
    }

    const originalName = req.file.originalname || "uploaded-repository.zip";
    if (!originalName.toLowerCase().endsWith(".zip")) {
      sendArchiveError(
        res,
        "UNSUPPORTED_FORMAT",
        "Only .zip archives are supported."
      );
      return;
    }

    const config = getConfig();

    let extraction;
    try {
      extraction = extractZipSafely(req.file.buffer, config);
    } catch (err) {
      if (err instanceof ArchiveSafetyError) {
        sendArchiveError(res, err.code, err.message);
        return;
      }
      throw err;
    }

    const repositoryName = path.basename(originalName, path.extname(originalName));
    const scanResult = performScan({
      files: extraction.files,
      repositoryName,
      isDemo: false,
    });

    res.json({ scanResult, extractionWarnings: extraction.warnings });
  }
);

/**
 * POST /api/scan/demo
 * Loads the bundled demo repository fixture and runs it through the
 * exact same scanner pipeline used for uploads.
 */
scanRouter.post("/demo", async (req, res) => {
  const files = await loadDemoRepoFiles();
  const scanResult = performScan({
    files,
    repositoryName: DEMO_REPO_NAME,
    isDemo: true,
  });

  res.json({ scanResult, extractionWarnings: [] });
});
