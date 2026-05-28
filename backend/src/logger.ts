import pino from "pino";

import { loadConfig } from "./config.js";

let cached: pino.Logger | null = null;

export function logger(): pino.Logger {
  if (cached) return cached;
  const cfg = loadConfig();
  cached = pino({
    level: cfg.LOG_LEVEL,
    redact: { paths: ["req.headers.authorization", "*.password"], censor: "[redacted]" },
  });
  return cached;
}
