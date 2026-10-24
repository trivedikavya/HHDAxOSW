/**
 * Final error-handling middleware. Always returns a safe, generic
 * message to the client - never a raw stack trace or internal detail -
 * while still logging the real error server-side for debugging.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-console
  console.error("Unhandled error:", err?.message);

  if (res.headersSent) {
    next(err);
    return;
  }

  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Something went wrong while processing your request.",
    },
  });
}
