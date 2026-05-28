/**
 * Per-suite setup for the backend integration tests.
 *
 * Tests assume a Postgres reachable via `DATABASE_URL` with the schema
 * already applied (CI runs `db/migrate.mjs` before this; locally you can
 * use the docker-compose stack from T11). Each test truncates `users`
 * + `notes` between cases so they don't interfere.
 *
 * `JWT_SECRET` is fixed so signed-token expectations are deterministic.
 */

import { afterAll, beforeEach } from "vitest";

process.env.NODE_ENV ??= "test";
process.env.JWT_SECRET ??= "test-secret-padding-padding-padding-1234";
process.env.JWT_EXPIRES_IN ??= "1h";
process.env.DATABASE_URL ??=
  "postgres://notevault:notevault@localhost:5432/notevault_test";
process.env.CORS_ORIGIN ??= "http://localhost:5173";
process.env.LOG_LEVEL ??= "silent";

const { closePool, query } = await import("../src/db.js");

beforeEach(async () => {
  await query("TRUNCATE users RESTART IDENTITY CASCADE");
});

afterAll(async () => {
  await closePool();
});
