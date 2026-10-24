import { describe, it, expect } from "vitest";
import request from "supertest";
import vercelApp from "../../api/index.js";

/**
 * Validates the actual file Vercel deploys as a serverless function
 * (api/index.js at the repo root). This is NOT a full simulation of
 * Vercel's routing/rewrite layer (that requires a real Vercel account,
 * which wasn't available while building this), but it does prove the
 * most error-prone part - import resolution from api/ into
 * server/src/app.js, and that the resulting Express app responds
 * correctly - works. See docs/DEPLOYMENT.md for what was and wasn't
 * verified beyond this.
 */
describe("api/index.js (Vercel entry point)", () => {
  it("exports a callable Express app", () => {
    expect(typeof vercelApp).toBe("function");
  });

  it("responds to /api/health exactly like the local server does", async () => {
    const res = await request(vercelApp).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("runs the demo scan end-to-end through the same entry point", async () => {
    const res = await request(vercelApp).post("/api/scan/demo");
    expect(res.status).toBe(200);
    expect(res.body.scanResult.repository.isDemo).toBe(true);
    expect(res.body.scanResult.findings.length).toBeGreaterThan(0);
  });
});
