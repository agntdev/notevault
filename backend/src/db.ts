import pg from "pg";

import { loadConfig } from "./config.js";

let pool: pg.Pool | null = null;

/**
 * Lazily-initialised shared connection pool. All repository functions
 * borrow connections from here; tests close it after each suite via
 * `closePool()` so the Node process can exit cleanly.
 */
export function getPool(): pg.Pool {
  if (pool) return pool;
  const cfg = loadConfig();
  pool = new pg.Pool({
    connectionString: cfg.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
  });
  return pool;
}

export async function closePool(): Promise<void> {
  if (!pool) return;
  await pool.end();
  pool = null;
}

/** Thin helper so call-sites stay readable; pg parameter placeholders are $1, $2, … */
export async function query<R extends pg.QueryResultRow = pg.QueryResultRow>(
  sql: string,
  params: ReadonlyArray<unknown> = [],
): Promise<pg.QueryResult<R>> {
  return getPool().query<R>(sql, params as unknown[]);
}
