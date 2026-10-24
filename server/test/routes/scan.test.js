import { describe, it, expect } from "vitest";
import request from "supertest";
import AdmZip from "adm-zip";
import { createApp } from "../../src/app.js";

function zipFromFiles(entries) {
  const zip = new AdmZip();
  for (const [name, content] of entries) {
    zip.addFile(name, Buffer.from(content));
  }
  return zip.toBuffer();
}

describe("GET /api/health", () => {
  it("returns ok", async () => {
    const app = createApp();
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("POST /api/scan/demo", () => {
  it("runs the bundled demo repository through the scanner and returns findings", async () => {
    const app = createApp();
    const res = await request(app).post("/api/scan/demo").send();

    expect(res.status).toBe(200);
    expect(res.body.scanResult.repository.isDemo).toBe(true);
    expect(res.body.scanResult.repository.projectType).toBe("node-javascript");
    expect(res.body.scanResult.repository.fileCount).toBeGreaterThan(0);
    expect(Array.isArray(res.body.scanResult.findings)).toBe(true);
    expect(res.body.scanResult.findings.length).toBeGreaterThan(0);

    const ruleIds = res.body.scanResult.findings.map((f) => f.ruleId);
    expect(ruleIds).toContain("LICENSE_MISSING");
    expect(ruleIds).toContain("README_DEAD_LOCAL_LINKS");
  });
});

describe("POST /api/scan/upload", () => {
  it("scans a valid uploaded zip and returns a scan result", async () => {
    const app = createApp();
    const buffer = zipFromFiles([
      ["README.md", "# My Repo"],
      ["LICENSE", "MIT"],
      ["package.json", JSON.stringify({ scripts: { test: "vitest" } })],
    ]);

    const res = await request(app)
      .post("/api/scan/upload")
      .attach("repository", buffer, "my-repo.zip");

    expect(res.status).toBe(200);
    expect(res.body.scanResult.repository.name).toBe("my-repo");
    expect(res.body.scanResult.repository.isDemo).toBe(false);
  });

  it("rejects a request with no file attached", async () => {
    const app = createApp();
    const res = await request(app).post("/api/scan/upload").send();
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("ARCHIVE_MISSING");
  });

  it("rejects a non-zip file extension", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/scan/upload")
      .attach("repository", Buffer.from("hello"), "notes.txt");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("UNSUPPORTED_FORMAT");
  });

  it("rejects a malformed zip with a safe error message", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/scan/upload")
      .attach("repository", Buffer.from("not a real zip file"), "broken.zip");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("ARCHIVE_MALFORMED");
    expect(res.body.error.message).not.toMatch(/at .*\(.*:\d+:\d+\)/); // no stack trace leak
  });

  it("returns a repository with zero findings honestly when everything is present", async () => {
    const app = createApp();
    const buffer = zipFromFiles([
      ["README.md", "# Repo\n\n```\nnpm run build\n```"],
      ["LICENSE", "MIT"],
      ["CONTRIBUTING.md", "Guide"],
      [".env.example", ""],
      [
        "package.json",
        JSON.stringify({ scripts: { build: "tsc", test: "vitest run" } }),
      ],
      ["src/index.test.js", "it('x', () => {})"],
    ]);

    const res = await request(app)
      .post("/api/scan/upload")
      .attach("repository", buffer, "clean-repo.zip");

    expect(res.status).toBe(200);
    expect(res.body.scanResult.findings).toEqual([]);
  });
});
