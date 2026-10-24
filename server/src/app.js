import express from "express";
import cors from "cors";
import { healthRouter } from "./routes/health.js";
import { scanRouter } from "./routes/scan.js";
import { aiRouter } from "./routes/ai.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "2mb" }));

  app.use("/api/health", healthRouter);
  app.use("/api/scan", scanRouter);
  app.use("/api/ai", aiRouter);

  app.use(errorHandler);

  return app;
}
