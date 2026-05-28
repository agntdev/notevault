# NoteVault — Database

PostgreSQL schema for users + notes, with a tiny zero-deps migration runner.

## Layout

```
db/
├── migrations/         numbered .sql files applied in order
│   ├── 0001_init.sql   users + notes tables, indexes, trigger
│   └── 0002_search.sql GIN trigram index on notes.title for fast LIKE
├── seed.sql            sample users + notes for local dev / tests
├── migrate.mjs         apply all pending migrations
└── README.md
```

## Tables

### `users`
| column         | type        | notes                                  |
|----------------|-------------|----------------------------------------|
| `id`           | UUID PK     | `gen_random_uuid()`                    |
| `email`        | TEXT UNIQUE | lowercased; CITEXT-equivalent via `LOWER` index |
| `password_hash`| TEXT        | bcrypt hash (10 rounds)                |
| `created_at`   | TIMESTAMPTZ | default `now()`                        |

### `notes`
| column       | type        | notes                                                  |
|--------------|-------------|--------------------------------------------------------|
| `id`         | UUID PK     | `gen_random_uuid()`                                    |
| `user_id`    | UUID FK     | `users.id ON DELETE CASCADE`                           |
| `title`      | TEXT        | non-empty, ≤ 200 chars (CHECK)                         |
| `body`       | TEXT        | ≤ 50 000 chars (CHECK)                                 |
| `created_at` | TIMESTAMPTZ | default `now()`                                        |
| `updated_at` | TIMESTAMPTZ | auto-bumped on UPDATE via `notes_set_updated_at` trigger |

### Indexes

- `users_email_lower_uidx` — `LOWER(email)`; case-insensitive uniqueness.
- `notes_user_id_idx` — fast lookup of a user's notes.
- `notes_title_trgm_idx` — `GIN (title gin_trgm_ops)` for the real-time
  search in T07 (`title ILIKE '%query%'` hits the trigram index).

## Running migrations

```bash
# from repo root
DATABASE_URL=postgres://notevault:notevault@localhost:5432/notevault \
  node db/migrate.mjs
```

`migrate.mjs` records applied migrations in a `_migrations` table and skips
any that are already applied — so re-running it is safe.

## Seed data

```bash
psql "$DATABASE_URL" -f db/seed.sql
```

Seeds two users (`alice@example.com` / `bob@example.com`, password `password123`
for both) and four notes total. Used by the backend integration tests and
for local smoke testing.
