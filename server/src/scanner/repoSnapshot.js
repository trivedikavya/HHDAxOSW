const BINARY_SNIFF_BYTES = 8000;

// Extensions we never bother reading as text, even if small - saves a
// decode attempt and avoids surprising "binary gibberish" content.
const KNOWN_BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".bmp",
  ".pdf", ".zip", ".gz", ".tar", ".7z", ".rar",
  ".woff", ".woff2", ".ttf", ".eot", ".otf",
  ".mp3", ".mp4", ".mov", ".avi", ".webm",
  ".exe", ".dll", ".so", ".dylib", ".bin", ".class", ".pyc",
  ".node",
]);

function getExtension(path) {
  const lastDot = path.lastIndexOf(".");
  const lastSlash = path.lastIndexOf("/");
  if (lastDot === -1 || lastDot < lastSlash) return "";
  return path.slice(lastDot).toLowerCase();
}

/**
 * Heuristic binary-file detector: looks for a NUL byte in the first chunk
 * of the file, the same general approach used by tools like git. This is
 * intentionally conservative - we only need to avoid feeding binary noise
 * into text-based rules, not perform exhaustive file-type detection.
 *
 * @param {Buffer} buffer
 */
export function looksBinary(buffer) {
  const sliceLength = Math.min(buffer.length, BINARY_SNIFF_BYTES);
  for (let i = 0; i < sliceLength; i += 1) {
    if (buffer[i] === 0) return true;
  }
  return false;
}

/**
 * @typedef {Object} RepoFileRecord
 * @property {string} path - posix-style relative path from the repo root
 * @property {number} size - byte size of the file
 * @property {boolean} isBinary
 * @property {string|null} content - UTF-8 text content, or null for binary files
 */

/**
 * Builds an in-memory, read-only snapshot of a repository's files for the
 * scanner to inspect. This is the single shape consumed by every scanner
 * rule, regardless of whether the files originated from an uploaded ZIP
 * or the bundled demo fixture.
 *
 * @param {Array<{path: string, buffer: Buffer}>} files
 * @returns {{
 *   files: RepoFileRecord[],
 *   byPath: Map<string, RepoFileRecord>,
 *   findRootFile: (candidateNames: string[]) => RepoFileRecord|null,
 *   getFile: (path: string) => RepoFileRecord|null,
 * }}
 */
export function buildRepoSnapshot(files) {
  /** @type {RepoFileRecord[]} */
  const records = [];
  const byPath = new Map();
  const rootByLowerName = new Map();

  for (const { path, buffer } of files) {
    const extension = getExtension(path);
    const isBinary =
      KNOWN_BINARY_EXTENSIONS.has(extension) || looksBinary(buffer);

    /** @type {RepoFileRecord} */
    const record = {
      path,
      size: buffer.length,
      isBinary,
      content: isBinary ? null : buffer.toString("utf-8"),
    };

    records.push(record);
    byPath.set(path, record);

    if (!path.includes("/")) {
      rootByLowerName.set(path.toLowerCase(), record);
    }
  }

  return {
    files: records,
    byPath,
    /**
     * Finds a root-level file by trying a list of candidate names,
     * case-insensitively. Returns the first match or null.
     */
    findRootFile(candidateNames) {
      for (const candidate of candidateNames) {
        const match = rootByLowerName.get(candidate.toLowerCase());
        if (match) return match;
      }
      return null;
    },
    getFile(path) {
      return byPath.get(path) ?? null;
    },
  };
}
