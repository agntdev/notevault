/**
 * Runs once before any test executes. Truncates the e2e DB so each full
 * run starts from a clean slate; individual tests register unique-ish
 * emails so they don't collide with each other when run in CI parallelism.
 */

import pg from "pg";

const DATABASE_URL =
  process.env.E2E_DATABASE_URL ??
  "postgres://notevault:notevault@localhost:5432/notevault_e2e";

export default async function globalSetup(): Promise<void> {
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    await client.query("TRUNCATE users RESTART IDENTITY CASCADE");
  } finally {
    await client.end();
  }
}
