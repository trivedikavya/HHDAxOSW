/**
 * Base URL the client sends API requests to.
 *
 * - If VITE_API_BASE_URL is explicitly set, it always wins.
 * - Otherwise, during local `vite dev` (two-terminal workflow: the API
 *   runs separately on port 5174) we default to that local server.
 * - In a production build (e.g. deployed on Vercel, where the API is
 *   served from the same origin as the static site via /api/*), we
 *   default to an empty string so requests are relative ("/api/...") -
 *   same-origin, no CORS, no hard-coded deployment URL baked into the
 *   bundle.
 */
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? "http://localhost:5174" : "");

/**
 * Thrown for any API-level failure (network error, non-2xx response, or
 * a response the server itself flagged as an error). `.code` mirrors the
 * server's machine-readable error code when available.
 */
export class ApiError extends Error {
  constructor(message, code = "UNKNOWN_ERROR") {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

async function parseJsonSafely(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Uploads a ZIP file for scanning.
 * @param {File} file
 * @returns {Promise<{scanResult: object, extractionWarnings: string[]}>}
 */
export async function uploadRepository(file) {
  const formData = new FormData();
  formData.append("repository", file);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/scan/upload`, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new ApiError(
      "Could not reach the RepoMedic AI server. Is it running?",
      "NETWORK_ERROR"
    );
  }

  const body = await parseJsonSafely(response);

  if (!response.ok) {
    throw new ApiError(
      body?.error?.message ?? "The upload could not be processed.",
      body?.error?.code ?? "UPLOAD_FAILED"
    );
  }

  return body;
}

/**
 * Loads and scans the bundled demo repository.
 * @returns {Promise<{scanResult: object, extractionWarnings: string[]}>}
 */
export async function scanDemoRepository() {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/scan/demo`, { method: "POST" });
  } catch {
    throw new ApiError(
      "Could not reach the RepoMedic AI server. Is it running?",
      "NETWORK_ERROR"
    );
  }

  const body = await parseJsonSafely(response);

  if (!response.ok) {
    throw new ApiError(
      body?.error?.message ?? "The demo repository could not be scanned.",
      body?.error?.code ?? "DEMO_SCAN_FAILED"
    );
  }

  return body;
}

/**
 * Fetches whether the local AI model service is reachable and the
 * configured model is installed. Resolves to an "unreachable" status
 * object rather than throwing on a network error, since the AI status
 * indicator must degrade gracefully by design.
 * @returns {Promise<{reachable: boolean, modelInstalled: boolean, available: boolean, message: string, modelId: string, adapterId: string}>}
 */
export async function fetchAiStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/status`);
    const body = await parseJsonSafely(response);
    if (!response.ok || !body) {
      return {
        reachable: false,
        modelInstalled: false,
        available: false,
        message: "Could not check the AI model status.",
        modelId: null,
        adapterId: null,
      };
    }
    return body;
  } catch {
    return {
      reachable: false,
      modelInstalled: false,
      available: false,
      message: "Could not reach the RepoMedic AI server.",
      modelId: null,
      adapterId: null,
    };
  }
}

/**
 * Requests AI-generated explanations/prioritization/remediation for the
 * findings in a scan result. Always resolves (never throws) to a result
 * with a `status` field of "ok" | "unavailable" | "error", mirroring the
 * server contract, so callers can render a graceful state in every case.
 * @param {object} scanResult
 */
export async function requestAiInsights(scanResult) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/explain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scanResult }),
    });
    const body = await parseJsonSafely(response);

    if (!response.ok) {
      return {
        status: "error",
        modelId: null,
        generatedAt: null,
        insights: [],
        warnings: [],
        message: body?.error?.message ?? "The AI request could not be processed.",
      };
    }

    return body;
  } catch {
    return {
      status: "unavailable",
      modelId: null,
      generatedAt: null,
      insights: [],
      warnings: [],
      message: "Could not reach the RepoMedic AI server.",
    };
  }
}
