import { describe, it, expect, vi, afterEach } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";

function jsonResponse(body, { ok = true, status = 200 } = {}) {
  return { ok, status, json: async () => body };
}

function sampleScanResult(findings = []) {
  return {
    scanId: "scan-1",
    repository: { name: "demo-repo", projectType: "node-javascript", fileCount: 5, isDemo: true },
    findings,
    completedAt: "2024-01-01T00:00:00.000Z",
  };
}

function sampleFinding(overrides = {}) {
  return {
    id: "README_MISSING::root",
    ruleId: "README_MISSING",
    title: "Repository README is missing",
    severity: "low",
    category: "documentation",
    message: "No recognized README file was found at the repository root.",
    evidence: [{ file: "repository-root", description: "Checked root." }],
    affectedFile: null,
    recommendation: "Add a README.",
    verifiedBy: "deterministic-rule",
    ...overrides,
  };
}

describe("GET /api/ai/status", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports unavailable when the local Ollama service cannot be reached", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    const app = createApp();
    const res = await request(app).get("/api/ai/status");

    expect(res.status).toBe(200);
    expect(res.body.reachable).toBe(false);
    expect(res.body.available).toBe(false);
    expect(typeof res.body.modelId).toBe("string");
  });

  it("reports available when the service is reachable and the model is installed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ models: [{ name: "qwen2.5:1.5b", model: "qwen2.5:1.5b" }] })
      )
    );

    const app = createApp();
    const res = await request(app).get("/api/ai/status");

    expect(res.status).toBe(200);
    expect(res.body.available).toBe(true);
  });
});

describe("POST /api/ai/explain", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects a request with no scan result", async () => {
    const app = createApp();
    const res = await request(app).post("/api/ai/explain").send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_SCAN_RESULT");
  });

  it("rejects a request with a malformed scan result", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/ai/explain")
      .send({ scanResult: { not: "a real scan result" } });
    expect(res.status).toBe(400);
  });

  it("returns status 'unavailable' (HTTP 200) when the AI service can't be reached, keeping the deterministic result usable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    const app = createApp();
    const res = await request(app)
      .post("/api/ai/explain")
      .send({ scanResult: sampleScanResult([sampleFinding()]) });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("unavailable");
    expect(res.body.insights).toEqual([]);
  });

  it("returns status 'ok' with zero insights for a scan result with zero findings", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ models: [{ name: "qwen2.5:1.5b", model: "qwen2.5:1.5b" }] })
      )
    );

    const app = createApp();
    const res = await request(app)
      .post("/api/ai/explain")
      .send({ scanResult: sampleScanResult([]) });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.insights).toEqual([]);
  });

  it("returns validated AI insights end-to-end when the model responds well", async () => {
    const finding = sampleFinding();
    const fetchMock = vi
      .fn()
      // 1st call: checkStatus() -> GET /api/tags
      .mockResolvedValueOnce(
        jsonResponse({ models: [{ name: "qwen2.5:1.5b", model: "qwen2.5:1.5b" }] })
      )
      // 2nd call: generateJson() -> POST /api/chat
      .mockResolvedValueOnce(
        jsonResponse({
          message: {
            content: JSON.stringify({
              insights: [
                {
                  findingId: finding.id,
                  explanation: "A README helps new contributors get started quickly.",
                  priority: "medium",
                  remediationSteps: ["Add a README.md with setup and usage instructions."],
                  verificationSteps: ["Confirm the README renders correctly on GitHub."],
                  hasIssueDraft: true,
                  issueDraftTitle: "Add a project README",
                  issueDraftBody: "This repository is missing a README. Please add one.",
                  referencedFiles: [],
                },
              ],
            }),
          },
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    const app = createApp();
    const res = await request(app)
      .post("/api/ai/explain")
      .send({ scanResult: sampleScanResult([finding]) });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.insights).toHaveLength(1);
    expect(res.body.insights[0].findingId).toBe(finding.id);
    expect(res.body.insights[0].verifiedBy).toBe("ai-suggestion");
    expect(res.body.insights[0].issueDraft).toEqual({
      title: "Add a project README",
      body: "This repository is missing a README. Please add one.",
    });
  });
});
