import express from "express";
import cors from "cors";
import { healthRouter } from "./routes/health.js";
import { scanRouter } from "./routes/scan.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use("/api/health", healthRouter);
  app.use("/api/scan", scanRouter);

  app.use(errorHandler);

  return app;
}
