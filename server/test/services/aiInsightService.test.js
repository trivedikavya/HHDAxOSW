import { describe, it, expect, vi } from "vitest";
import { generateAiInsights, getAiStatus } from "../../src/services/aiInsightService.js";
import { ModelTimeoutError, ModelUnavailableError, ModelRequestError } from "../../src/ai/errors.js";

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

function sampleScanResult(findings) {
  return {
    scanId: "scan-1",
    repository: { name: "demo-repo", projectType: "node-javascript", fileCount: 10, isDemo: true },
    findings,
    completedAt: "2024-01-01T00:00:00.000Z",
  };
}

function makeFakeAdapter({ available = true, checkStatusMessage = "ok", generateJsonImpl } = {}) {
  return {
    id: "fake",
    modelId: "fake-model:1b",
    checkStatus: vi.fn().mockResolvedValue({
      reachable: available,
      modelInstalled: available,
      available,
      message: checkStatusMessage,
    }),
    generateJson: vi.fn(generateJsonImpl ?? (async () => JSON.stringify({ insights: [] }))),
  };
}

describe("getAiStatus", () => {
  it("merges adapter status with modelId and adapterId", async () => {
    const adapter = makeFakeAdapter({ available: true, checkStatusMessage: "Connected." });
    const status = await getAiStatus(adapter);
    expect(status).toEqual({
      reachable: true,
      modelInstalled: true,
      available: true,
      message: "Connected.",
      modelId: "fake-model:1b",
      adapterId: "fake",
    });
  });
});

describe("generateAiInsights", () => {
  it("returns an unavailable status without calling generateJson when the adapter isn't available", async () => {
    const adapter = makeFakeAdapter({ available: false, checkStatusMessage: "Not reachable." });
    const result = await generateAiInsights({ scanResult: sampleScanResult([sampleFinding()]), adapter });

    expect(result.status).toBe("unavailable");
    expect(result.message).toBe("Not reachable.");
    expect(adapter.generateJson).not.toHaveBeenCalled();
  });

  it("returns an ok status with zero insights for a repository with zero findings, without calling the model", async () => {
    const adapter = makeFakeAdapter();
    const result = await generateAiInsights({ scanResult: sampleScanResult([]), adapter });

    expect(result.status).toBe("ok");
    expect(result.insights).toEqual([]);
    expect(result.generatedAt).not.toBeNull();
    expect(adapter.generateJson).not.toHaveBeenCalled();
  });

  it("returns unavailable when the model call times out", async () => {
    const adapter = makeFakeAdapter({
      generateJsonImpl: async () => {
        throw new ModelTimeoutError();
      },
    });
    const result = await generateAiInsights({ scanResult: sampleScanResult([sampleFinding()]), adapter });
    expect(result.status).toBe("unavailable");
    expect(result.message).toMatch(/timed out/);
  });

  it("returns unavailable when the model service becomes unreachable mid-request", async () => {
    const adapter = makeFakeAdapter({
      generateJsonImpl: async () => {
        throw new ModelUnavailableError();
      },
    });
    const result = await generateAiInsights({ scanResult: sampleScanResult([sampleFinding()]), adapter });
    expect(result.status).toBe("unavailable");
  });

  it("returns an error status when the model returns an invalid HTTP response", async () => {
    const adapter = makeFakeAdapter({
      generateJsonImpl: async () => {
        throw new ModelRequestError("Ollama responded with HTTP 500.");
      },
    });
    const result = await generateAiInsights({ scanResult: sampleScanResult([sampleFinding()]), adapter });
    expect(result.status).toBe("error");
    expect(result.message).toMatch(/HTTP 500/);
  });

  it("rethrows a genuinely unexpected error instead of swallowing it", async () => {
    const adapter = makeFakeAdapter({
      generateJsonImpl: async () => {
        throw new Error("something truly unexpected");
      },
    });
    await expect(
      generateAiInsights({ scanResult: sampleScanResult([sampleFinding()]), adapter })
    ).rejects.toThrow("something truly unexpected");
  });

  it("returns an error status when the model's response is malformed JSON", async () => {
    const adapter = makeFakeAdapter({ generateJsonImpl: async () => "not json at all" });
    const result = await generateAiInsights({ scanResult: sampleScanResult([sampleFinding()]), adapter });
    expect(result.status).toBe("error");
    expect(result.message).toMatch(/not valid JSON/);
  });

  it("returns ok with validated insights for a well-formed model response", async () => {
    const finding = sampleFinding();
    const adapter = makeFakeAdapter({
      generateJsonImpl: async () =>
        JSON.stringify({
          insights: [
            {
              findingId: finding.id,
              explanation: "A README helps contributors get started.",
              priority: "medium",
              remediationSteps: ["Add a README.md."],
              verificationSteps: ["Confirm it renders on GitHub."],
              hasIssueDraft: false,
              issueDraftTitle: "",
              issueDraftBody: "",
              referencedFiles: [],
            },
          ],
        }),
    });

    const result = await generateAiInsights({ scanResult: sampleScanResult([finding]), adapter });
    expect(result.status).toBe("ok");
    expect(result.insights).toHaveLength(1);
    expect(result.insights[0].verifiedBy).toBe("ai-suggestion");
    expect(result.generatedAt).not.toBeNull();
  });

  it("passes the generated JSON schema to the adapter's generateJson call", async () => {
    const adapter = makeFakeAdapter();
    await generateAiInsights({ scanResult: sampleScanResult([sampleFinding()]), adapter });

    expect(adapter.generateJson).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.any(String),
        userPrompt: expect.any(String),
        jsonSchema: expect.objectContaining({ type: "object" }),
      })
    );
  });
});
