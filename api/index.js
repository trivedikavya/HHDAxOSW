/**
 * Vercel serverless entry point.
 *
 * This file is the ONLY thing Vercel-specific about the server - it just
 * re-exports the real Express app from server/src/app.js as the default
 * export, which is Vercel's documented convention for deploying an
 * Express app as a single Function (see docs/DEPLOYMENT.md).
 *
 * vercel.json rewrites every `/api/*` request to this function; Express's
 * own router (mounted at /api/scan, /api/ai, /api/health in app.js)
 * handles the real routing from there using the original request path,
 * exactly as it does when run directly with `node server/src/index.js`.
 *
 * Nothing in server/src/app.js needs to know it's running on Vercel -
 * the archive-safety design (in-memory ZIP extraction, no disk writes)
 * from Phase 1 happens to make this deployment target work with zero
 * changes to that logic.
 */
import { createApp } from "../server/src/app.js";

export default createApp();
