import cors from "cors";
import express, { type Express } from "express";
import pinoHttp from "pino-http";

import { loadConfig } from "./config.js";
import { logger } from "./logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/auth.js";
import { notesRouter } from "./routes/notes.js";

/**
 * Build the Express app. Kept separate from `server.ts` so tests can
 * import the app without listening on a port.
 */
export function createApp(): Express {
  const cfg = loadConfig();
  const app = express();

  app.use(pinoHttp({ logger: logger() }));
  app.use(cors({ origin: cfg.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "256kb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "notevault-backend" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/notes", notesRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  app.use(errorHandler);
  return app;
}
