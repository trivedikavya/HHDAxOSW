import { describe, it, expect } from "vitest";
import AdmZip from "adm-zip";
import { extractZipSafely, ArchiveSafetyError } from "../../src/services/archiveSafety.js";

const DEFAULT_LIMITS = {
  maxExtractedTotalSizeBytes: 10 * 1024 * 1024,
  maxExtractedFileCount: 100,
  maxSingleFileSizeBytes: 1 * 1024 * 1024,
};

function zipFromFiles(entries) {
  const zip = new AdmZip();
  for (const [name, content] of entries) {
    zip.addFile(name, Buffer.from(content));
  }
  return zip.toBuffer();
}

describe("extractZipSafely", () => {
  it("extracts a normal, well-formed archive", () => {
    const buffer = zipFromFiles([
      ["README.md", "# Hello"],
      ["src/index.js", "console.log(1)"],
    ]);
    const result = extractZipSafely(buffer, DEFAULT_LIMITS);
    expect(result.files).toHaveLength(2);
    expect(result.warnings).toHaveLength(0);
    const readme = result.files.find((f) => f.path === "README.md");
    expect(readme.buffer.toString("utf-8")).toBe("# Hello");
  });

  it("rejects an empty buffer", () => {
    expect(() => extractZipSafely(Buffer.alloc(0), DEFAULT_LIMITS)).toThrow(
      ArchiveSafetyError
    );
  });

  it("rejects a buffer that is not a zip at all (malformed)", () => {
    const notAZip = Buffer.from("this is definitely not a zip file");
    expect(() => extractZipSafely(notAZip, DEFAULT_LIMITS)).toThrow(
      ArchiveSafetyError
    );
  });

  it("rejects a truncated/corrupted zip", () => {
    const buffer = zipFromFiles([["a.txt", "hello"]]);
    const corrupted = buffer.subarray(0, buffer.length - 10);
    expect(() => extractZipSafely(corrupted, DEFAULT_LIMITS)).toThrow(
      ArchiveSafetyError
    );
  });

  it("rejects an archive with no files", () => {
    const zip = new AdmZip();
    zip.addFile("emptydir/", Buffer.alloc(0));
    const buffer = zip.toBuffer();
    expect(() => extractZipSafely(buffer, DEFAULT_LIMITS)).toThrow(
      ArchiveSafetyError
    );
  });

  it("rejects path traversal entries (../)", () => {
    const zip = new AdmZip();
    zip.addFile("escape.txt", Buffer.from("gotcha"));
    // AdmZip's own addFile() normalizes "../" segments away before
    // storing the entry, so a well-behaved caller can never produce a
    // traversal entry through the public API. To simulate a maliciously
    // crafted archive (e.g. hand-built with another tool), we overwrite
    // the stored entry name directly before serializing.
    zip.getEntries()[0].entryName = "../../escape.txt";
    const buffer = zip.toBuffer();
    expect(() => extractZipSafely(buffer, DEFAULT_LIMITS)).toThrow(
      ArchiveSafetyError
    );
  });

  it("rejects absolute path entries", () => {
    const zip = new AdmZip();
    zip.addFile("etc/passwd", Buffer.from("x"));
    // Manually rewrite the entry name to an absolute-looking path to
    // simulate a crafted archive, since AdmZip's addFile sanitizes input.
    const entries = zip.getEntries();
    entries[0].entryName = "/etc/passwd";
    const buffer = zip.toBuffer();
    expect(() => extractZipSafely(buffer, DEFAULT_LIMITS)).toThrow(
      ArchiveSafetyError
    );
  });

  it("rejects Windows-style backslash path traversal (..\\..\\evil.txt)", () => {
    const zip = new AdmZip();
    zip.addFile("evil.txt", Buffer.from("gotcha"));
    // Backslashes are normalized to forward slashes before the ".."
    // segment check runs, so this must be caught the same as the
    // forward-slash traversal case.
    zip.getEntries()[0].entryName = "..\\..\\evil.txt";
    const buffer = zip.toBuffer();
    expect(() => extractZipSafely(buffer, DEFAULT_LIMITS)).toThrow(
      ArchiveSafetyError
    );
  });

  it("rejects an entry name containing an embedded NUL byte", () => {
    const zip = new AdmZip();
    zip.addFile("safe.txt", Buffer.from("fine"));
    zip.getEntries()[0].entryName = "safe.txt\u0000.jpg";
    const buffer = zip.toBuffer();
    expect(() => extractZipSafely(buffer, DEFAULT_LIMITS)).toThrow(
      ArchiveSafetyError
    );
  });

  it("rejects a traversal attempt disguised inside a nested path (a/b/../../../escape.txt)", () => {
    const zip = new AdmZip();
    zip.addFile("escape.txt", Buffer.from("gotcha"));
    zip.getEntries()[0].entryName = "a/b/../../../escape.txt";
    const buffer = zip.toBuffer();
    expect(() => extractZipSafely(buffer, DEFAULT_LIMITS)).toThrow(
      ArchiveSafetyError
    );
  });

  it("rejects an archive with too many files", () => {
    const entries = [];
    for (let i = 0; i < 5; i += 1) {
      entries.push([`file-${i}.txt`, "x"]);
    }
    const buffer = zipFromFiles(entries);
    expect(() =>
      extractZipSafely(buffer, { ...DEFAULT_LIMITS, maxExtractedFileCount: 3 })
    ).toThrow(ArchiveSafetyError);
  });

  it("skips (not rejects) a single oversized file but keeps the rest", () => {
    const bigContent = "a".repeat(2000);
    const buffer = zipFromFiles([
      ["small.txt", "ok"],
      ["big.txt", bigContent],
    ]);
    const result = extractZipSafely(buffer, {
      ...DEFAULT_LIMITS,
      maxSingleFileSizeBytes: 500,
    });
    expect(result.files).toHaveLength(1);
    expect(result.files[0].path).toBe("small.txt");
    expect(result.warnings.some((w) => w.includes("big.txt"))).toBe(true);
  });

  it("rejects when cumulative extracted size exceeds the total limit (zip-bomb guard)", () => {
    const buffer = zipFromFiles([
      ["a.txt", "a".repeat(600)],
      ["b.txt", "b".repeat(600)],
    ]);
    expect(() =>
      extractZipSafely(buffer, {
        ...DEFAULT_LIMITS,
        maxSingleFileSizeBytes: 1000,
        maxExtractedTotalSizeBytes: 1000,
      })
    ).toThrow(ArchiveSafetyError);
  });

  it("skips symlink entries instead of extracting them", () => {
    const zip = new AdmZip();
    zip.addFile("normal.txt", Buffer.from("fine"));
    zip.addFile("link.txt", Buffer.from("/etc/passwd"));
    const entries = zip.getEntries();
    const linkEntry = entries.find((e) => e.entryName === "link.txt");
    // Set unix mode bits for a symlink (S_IFLNK = 0xA000) in the upper
    // 16 bits of the external attributes field.
    linkEntry.header.attr = (0xa1ff << 16) >>> 0;
    const buffer = zip.toBuffer();

    const result = extractZipSafely(buffer, DEFAULT_LIMITS);
    expect(result.files.map((f) => f.path)).toEqual(["normal.txt"]);
    expect(result.warnings.some((w) => w.includes("link.txt"))).toBe(true);
  });

  it("rejects duplicate paths that only differ by case", () => {
    const zip = new AdmZip();
    zip.addFile("README.md", Buffer.from("one"));
    zip.addFile("readme.md", Buffer.from("two"));
    const buffer = zip.toBuffer();
    const result = extractZipSafely(buffer, DEFAULT_LIMITS);
    expect(result.files).toHaveLength(1);
    expect(result.warnings.some((w) => w.includes("duplicate"))).toBe(true);
  });
});
