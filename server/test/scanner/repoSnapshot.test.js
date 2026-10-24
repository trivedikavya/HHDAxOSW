import { describe, it, expect } from "vitest";
import { buildRepoSnapshot, looksBinary } from "../../src/scanner/repoSnapshot.js";

function file(path, content) {
  return { path, buffer: Buffer.from(content, "utf-8") };
}

describe("looksBinary", () => {
  it("returns false for plain text", () => {
    expect(looksBinary(Buffer.from("hello world"))).toBe(false);
  });

  it("returns true when a NUL byte is present", () => {
    expect(looksBinary(Buffer.from([72, 101, 0, 108, 111]))).toBe(true);
  });
});

describe("buildRepoSnapshot", () => {
  it("decodes text content for non-binary files", () => {
    const snapshot = buildRepoSnapshot([file("README.md", "# Hello")]);
    const readme = snapshot.getFile("README.md");
    expect(readme.content).toBe("# Hello");
    expect(readme.isBinary).toBe(false);
  });

  it("treats known binary extensions as binary without reading content", () => {
    const snapshot = buildRepoSnapshot([
      { path: "logo.png", buffer: Buffer.from("not really a png") },
    ]);
    const logo = snapshot.getFile("logo.png");
    expect(logo.isBinary).toBe(true);
    expect(logo.content).toBeNull();
  });

  it("finds root files case-insensitively", () => {
    const snapshot = buildRepoSnapshot([file("readme.md", "hi")]);
    const found = snapshot.findRootFile(["README.md", "README"]);
    expect(found).not.toBeNull();
    expect(found.path).toBe("readme.md");
  });

  it("does not match nested files as root files", () => {
    const snapshot = buildRepoSnapshot([file("docs/README.md", "hi")]);
    const found = snapshot.findRootFile(["README.md"]);
    expect(found).toBeNull();
  });

  it("returns null from getFile for unknown paths", () => {
    const snapshot = buildRepoSnapshot([file("a.txt", "x")]);
    expect(snapshot.getFile("missing.txt")).toBeNull();
  });
});
