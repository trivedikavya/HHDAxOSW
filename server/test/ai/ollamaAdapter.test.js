import { describe, it, expect, vi, afterEach } from "vitest";
import { createOllamaAdapter } from "../../src/ai/ollamaAdapter.js";
import { ModelTimeoutError, ModelUnavailableError, ModelRequestError } from "../../src/ai/errors.js";

function jsonResponse(body, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    json: async () => body,
  };
}

function makeAdapter(overrides = {}) {
  return createOllamaAdapter({
    baseUrl: "http://localhost:11434",
    model: "qwen2.5:1.5b",
    statusTimeoutMs: 1000,
    requestTimeoutMs: 1000,
    ...overrides,
  });
}

describe("ollamaAdapter.checkStatus", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports available when the service is reachable and the model is installed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ models: [{ name: "qwen2.5:1.5b", model: "qwen2.5:1.5b" }] })
      )
    );

    const status = await makeAdapter().checkStatus();
    expect(status).toEqual({
      reachable: true,
      modelInstalled: true,
      available: true,
      message: expect.stringContaining("installed"),
    });
  });

  it("reports unavailable when the service is reachable but the model is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ models: [{ name: "llama3.2:latest" }] }))
    );

    const status = await makeAdapter().checkStatus();
    expect(status.reachable).toBe(true);
    expect(status.modelInstalled).toBe(false);
    expect(status.available).toBe(false);
    expect(status.message).toContain("ollama pull");
  });

  it("reports unreachable when the connection fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    const status = await makeAdapter().checkStatus();
    expect(status.reachable).toBe(false);
    expect(status.available).toBe(false);
  });

  it("reports unavailable on a non-OK HTTP status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, { ok: false, status: 500 })));

    const status = await makeAdapter().checkStatus();
    expect(status.reachable).toBe(true);
    expect(status.available).toBe(false);
  });

  it("never throws, even on a malformed JSON body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error("not json");
        },
      })
    );

    await expect(makeAdapter().checkStatus()).resolves.toMatchObject({ available: false });
  });
});

describe("ollamaAdapter.generateJson", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the message content on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ message: { role: "assistant", content: '{"insights":[]}' } })
      )
    );

    const content = await makeAdapter().generateJson({
      systemPrompt: "system",
      userPrompt: "user",
      jsonSchema: { type: "object" },
    });
    expect(content).toBe('{"insights":[]}');
  });

  it("sends the model, messages, and JSON schema format in the request body", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ message: { content: "{}" } }));
    vi.stubGlobal("fetch", fetchMock);

    await makeAdapter().generateJson({
      systemPrompt: "sys",
      userPrompt: "usr",
      jsonSchema: { type: "object", properties: {} },
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:11434/api/chat");
    const body = JSON.parse(init.body);
    expect(body.model).toBe("qwen2.5:1.5b");
    expect(body.stream).toBe(false);
    expect(body.format).toEqual({ type: "object", properties: {} });
    expect(body.messages).toEqual([
      { role: "system", content: "sys" },
      { role: "user", content: "usr" },
    ]);
  });

  it("throws ModelRequestError on a non-OK HTTP status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, { ok: false, status: 404 })));

    await expect(
      makeAdapter().generateJson({ systemPrompt: "s", userPrompt: "u", jsonSchema: {} })
    ).rejects.toBeInstanceOf(ModelRequestError);
  });

  it("throws ModelRequestError when the response has no content", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ message: { content: "" } })));

    await expect(
      makeAdapter().generateJson({ systemPrompt: "s", userPrompt: "u", jsonSchema: {} })
    ).rejects.toBeInstanceOf(ModelRequestError);
  });

  it("throws ModelTimeoutError when the request aborts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(Object.assign(new Error("aborted"), { name: "AbortError" }))
    );

    await expect(
      makeAdapter().generateJson({ systemPrompt: "s", userPrompt: "u", jsonSchema: {} })
    ).rejects.toBeInstanceOf(ModelTimeoutError);
  });

  it("throws ModelUnavailableError on a network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    await expect(
      makeAdapter().generateJson({ systemPrompt: "s", userPrompt: "u", jsonSchema: {} })
    ).rejects.toBeInstanceOf(ModelUnavailableError);
  });
});
