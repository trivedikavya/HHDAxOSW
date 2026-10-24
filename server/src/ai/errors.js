/**
 * Errors thrown by model adapters. The AI insight service catches these
 * specifically so it can degrade gracefully (return an "unavailable" or
 * "error" status) instead of ever crashing a request or blocking the
 * deterministic scanner/report features.
 */

export class ModelTimeoutError extends Error {
  constructor(message = "The AI model timed out before responding.") {
    super(message);
    this.name = "ModelTimeoutError";
  }
}

export class ModelUnavailableError extends Error {
  constructor(message = "The AI model service could not be reached.") {
    super(message);
    this.name = "ModelUnavailableError";
  }
}

export class ModelRequestError extends Error {
  constructor(message = "The AI model returned an unexpected response.") {
    super(message);
    this.name = "ModelRequestError";
  }
}
