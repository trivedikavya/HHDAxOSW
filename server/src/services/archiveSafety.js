import AdmZip from "adm-zip";

/**
 * Thrown whenever an uploaded archive fails a safety check. The `.message`
 * is always safe to show directly to an end user (no stack traces, no
 * internal paths).
 */
export class ArchiveSafetyError extends Error {
  /**
   * @param {string} code machine-readable reason, e.g. "ARCHIVE_TOO_MANY_FILES"
   * @param {string} message human-readable, user-safe explanation
   */
  constructor(code, message) {
    super(message);
    this.name = "ArchiveSafetyError";
    this.code = code;
  }
}

const UNIX_FILE_TYPE_MASK = 0xf000;
const UNIX_SYMLINK_TYPE = 0xa000;

/**
 * Normalizes a zip entry name and rejects anything that looks like a path
 * traversal or absolute-path write attempt.
 *
 * @param {string} rawName
 * @returns {string} a safe, posix-style relative path
 */
function normalizeAndValidateEntryPath(rawName) {
  if (typeof rawName !== "string" || rawName.length === 0) {
    throw new ArchiveSafetyError(
      "ARCHIVE_INVALID_ENTRY",
      "The archive contains an entry with an invalid name."
    );
  }

  // Reject embedded NUL bytes outright.
  if (rawName.includes("\u0000")) {
    throw new ArchiveSafetyError(
      "ARCHIVE_INVALID_ENTRY",
      "The archive contains an entry with an invalid name."
    );
  }

  const normalized = rawName.replace(/\\/g, "/");

  // Reject absolute paths (unix-style or Windows drive-letter style).
  if (normalized.startsWith("/") || /^[a-zA-Z]:/.test(normalized)) {
    throw new ArchiveSafetyError(
      "ARCHIVE_PATH_TRAVERSAL",
      "The archive contains an entry with an absolute path, which is not allowed."
    );
  }

  const segments = normalized.split("/").filter((seg) => seg.length > 0);

  if (segments.some((seg) => seg === "..")) {
    throw new ArchiveSafetyError(
      "ARCHIVE_PATH_TRAVERSAL",
      "The archive contains an entry that attempts to escape the extraction directory."
    );
  }

  if (segments.length === 0) {
    throw new ArchiveSafetyError(
      "ARCHIVE_INVALID_ENTRY",
      "The archive contains an entry with an invalid name."
    );
  }

  return segments.join("/");
}

function isSymlinkEntry(entry) {
  // The unix file mode is packed into the upper 16 bits of the external
  // file attributes field when the archive was created on a unix-like
  // system. On archives created without unix attributes this will simply
  // not match the symlink bit pattern, which is the safe default.
  const unixMode = (entry.header.attr >>> 16) & 0xffff;
  return (unixMode & UNIX_FILE_TYPE_MASK) === UNIX_SYMLINK_TYPE;
}

/**
 * Safely extracts a ZIP buffer fully in memory, enforcing archive-safety
 * limits, and returns only the files that passed validation.
 *
 * Design decision: extraction never touches the filesystem. Working
 * entirely with in-memory buffers removes an entire class of risk
 * (symlink escapes onto disk, traversal writes outside a temp directory)
 * because nothing is ever written to disk in the first place. Each
 * request's buffers are released once the response is sent and the
 * objects become eligible for garbage collection - there is no persistent
 * temp directory to clean up.
 *
 * @param {Buffer} zipBuffer
 * @param {{maxExtractedTotalSizeBytes:number, maxExtractedFileCount:number, maxSingleFileSizeBytes:number}} limits
 * @returns {{files: Array<{path:string, buffer:Buffer}>, warnings: string[]}}
 */
export function extractZipSafely(zipBuffer, limits) {
  if (!Buffer.isBuffer(zipBuffer) || zipBuffer.length === 0) {
    throw new ArchiveSafetyError(
      "ARCHIVE_EMPTY",
      "The uploaded file is empty or was not received correctly."
    );
  }

  // Quick magic-byte sanity check before handing off to the zip parser.
  // Local file header: "PK\x03\x04", empty archive: "PK\x05\x06".
  const signature = zipBuffer.subarray(0, 4).toString("latin1");
  if (!signature.startsWith("PK")) {
    throw new ArchiveSafetyError(
      "ARCHIVE_MALFORMED",
      "The uploaded file does not look like a valid ZIP archive."
    );
  }

  let zip;
  try {
    zip = new AdmZip(zipBuffer);
  } catch {
    throw new ArchiveSafetyError(
      "ARCHIVE_MALFORMED",
      "The uploaded ZIP archive could not be read. It may be corrupted."
    );
  }

  let entries;
  try {
    entries = zip.getEntries();
  } catch {
    throw new ArchiveSafetyError(
      "ARCHIVE_MALFORMED",
      "The uploaded ZIP archive could not be read. It may be corrupted."
    );
  }

  const fileEntries = entries.filter((entry) => !entry.isDirectory);

  if (fileEntries.length === 0) {
    throw new ArchiveSafetyError(
      "ARCHIVE_EMPTY",
      "The uploaded archive does not contain any files."
    );
  }

  if (fileEntries.length > limits.maxExtractedFileCount) {
    throw new ArchiveSafetyError(
      "ARCHIVE_TOO_MANY_FILES",
      `The archive contains too many files (limit: ${limits.maxExtractedFileCount}).`
    );
  }

  const files = [];
  const warnings = [];
  let cumulativeSize = 0;
  const seenPaths = new Set();

  for (const entry of fileEntries) {
    const safePath = normalizeAndValidateEntryPath(entry.entryName);

    if (isSymlinkEntry(entry)) {
      warnings.push(`Skipped symbolic link entry: ${safePath}`);
      continue;
    }

    // Declared (uncompressed) size from the central directory, available
    // without decompressing the entry.
    const declaredSize = entry.header.size;

    if (declaredSize > limits.maxSingleFileSizeBytes) {
      warnings.push(
        `Skipped file larger than the per-file limit: ${safePath}`
      );
      continue;
    }

    cumulativeSize += declaredSize;
    if (cumulativeSize > limits.maxExtractedTotalSizeBytes) {
      throw new ArchiveSafetyError(
        "ARCHIVE_TOO_LARGE",
        "The archive exceeds the maximum allowed extracted size."
      );
    }

    let data;
    try {
      data = entry.getData();
    } catch {
      warnings.push(`Skipped unreadable entry: ${safePath}`);
      continue;
    }

    // Defensive re-check in case a crafted header understated the real
    // decompressed size.
    if (data.length > limits.maxSingleFileSizeBytes) {
      warnings.push(
        `Skipped file larger than the per-file limit: ${safePath}`
      );
      continue;
    }
    cumulativeSize += data.length - declaredSize;
    if (cumulativeSize > limits.maxExtractedTotalSizeBytes) {
      throw new ArchiveSafetyError(
        "ARCHIVE_TOO_LARGE",
        "The archive exceeds the maximum allowed extracted size."
      );
    }

    // Case-insensitive collision guard (e.g. "README.md" vs "readme.md"
    // on a case-insensitive extraction target would silently overwrite).
    const key = safePath.toLowerCase();
    if (seenPaths.has(key)) {
      warnings.push(`Skipped duplicate path (case-insensitive clash): ${safePath}`);
      continue;
    }
    seenPaths.add(key);

    files.push({ path: safePath, buffer: data });
  }

  if (files.length === 0) {
    throw new ArchiveSafetyError(
      "ARCHIVE_EMPTY",
      "The archive did not contain any files that could be safely extracted."
    );
  }

  return { files, warnings };
}
