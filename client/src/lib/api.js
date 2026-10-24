const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5174";

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
