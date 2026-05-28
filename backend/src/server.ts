import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { closePool } from "./db.js";
import { logger } from "./logger.js";

const cfg = loadConfig();
const app = createApp();
const log = logger();

const server = app.listen(cfg.PORT, () => {
  log.info({ port: cfg.PORT, env: cfg.NODE_ENV }, "notevault-backend listening");
});

async function shutdown(signal: string): Promise<void> {
  log.info({ signal }, "shutting down");
  server.close(async () => {
    await closePool();
    process.exit(0);
  });
  // Hard exit if cleanup hangs.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
