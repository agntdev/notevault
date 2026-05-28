#!/usr/bin/env node
// migrate.mjs — minimal zero-deps migration runner for NoteVault.
//
// Reads every .sql file in `db/migrations/`, applies the ones not yet
// recorded in the `_migrations` tracking table, in lexicographic order
// (so 0001_..., 0002_..., etc.). Each migration runs inside a single
// transaction; the tracking row is inserted in the same transaction so
// partial application can't leave the system in an inconsistent state.
//
// Usage:
//   DATABASE_URL=postgres://user:pass@host/db node db/migrate.mjs

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(HERE, "migrations");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error("DATABASE_URL is required");
    process.exit(1);
}

async function ensureTrackingTable(client) {
    await client.query(`
        CREATE TABLE IF NOT EXISTS _migrations (
            name        TEXT PRIMARY KEY,
            applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `);
}

async function appliedSet(client) {
    const { rows } = await client.query("SELECT name FROM _migrations");
    return new Set(rows.map((r) => r.name));
}

async function migrationFiles() {
    const entries = await readdir(MIGRATIONS_DIR);
    return entries.filter((f) => f.endsWith(".sql")).sort();
}

async function main() {
    const client = new pg.Client({ connectionString: DATABASE_URL });
    await client.connect();
    try {
        await ensureTrackingTable(client);
        const applied = await appliedSet(client);
        const files = await migrationFiles();
        let appliedCount = 0;

        for (const file of files) {
            if (applied.has(file)) {
                console.log(`= skip ${file} (already applied)`);
                continue;
            }
            const sql = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");
            console.log(`+ apply ${file}`);
            await client.query("BEGIN");
            try {
                await client.query(sql);
                await client.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
                await client.query("COMMIT");
                appliedCount += 1;
            } catch (err) {
                await client.query("ROLLBACK");
                throw err;
            }
        }

        console.log(`✓ ${appliedCount} migration(s) applied (${files.length} total)`);
    } finally {
        await client.end();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
