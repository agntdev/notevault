# NoteVault — Deployment

Everything needed to run NoteVault locally in containers and to ship it to a
staging environment via GitHub Actions.

## Layout

```
.github/workflows/
├── ci.yml              build + typecheck on every PR; runs backend migrations
│                       against a Postgres service container so SQL changes
│                       are validated end-to-end.
└── deploy-staging.yml  builds the backend Docker image, pushes to GHCR,
                        rolls the staging service over SSH, then ships the
                        Vite-built frontend bundle to /var/www/notevault-staging
deploy/
├── Dockerfile.backend  multi-stage Node 20 image (build → prod), runs as a
│                       non-root user with a /api/health HEALTHCHECK
├── docker-compose.yml  Postgres + migrations + backend for local dev
└── README.md           this file
```

## Local: full stack in containers

```bash
docker compose -f deploy/docker-compose.yml up --build
```

This starts:

1. **postgres** — Postgres 16 with the `notevault` DB (persisted to
   `notevault-pgdata`).
2. **migrate** — one-shot job that runs `db/migrate.mjs` and applies
   `db/seed.sql`. Exits once schema + seed are in.
3. **backend** — the Express service on `http://localhost:3001`.

Run the Vite dev server (`cd frontend && npm run dev`) on the host for HMR.

To wipe and start fresh:

```bash
docker compose -f deploy/docker-compose.yml down -v
```

## Staging: GitHub Actions

`deploy-staging.yml` triggers on push to `main` that touches `backend/`,
`frontend/`, or `db/`, and on `workflow_dispatch` for ad-hoc redeploys.

### Repository secrets

| Secret                       | Example value                                      |
|------------------------------|----------------------------------------------------|
| `STAGING_HOST`               | `staging.notevault.example.com`                    |
| `STAGING_SSH_USER`           | `deploy`                                           |
| `STAGING_SSH_KEY`            | OpenSSH private key (raw, no passphrase)           |
| `STAGING_DATABASE_URL`       | `postgres://notevault:…@db.internal/notevault`    |
| `STAGING_JWT_SECRET`         | 32+ char random string                             |
| `STAGING_CORS_ORIGIN`        | `https://staging.notevault.example.com`            |
| `STAGING_FRONTEND_API_URL`   | `https://staging.notevault.example.com/api`        |

### Pipeline

1. `build-and-push` — builds `deploy/Dockerfile.backend` and pushes
   `ghcr.io/<owner>/notevault-backend:<short-sha>`.
2. `deploy-backend` — SSHes into staging, pulls the new image, rolls the
   `notevault-backend` container, and waits up to 20s for `/api/health` to
   return 200 before reporting success.
3. `deploy-frontend` — builds the Vite bundle with `VITE_API_URL` pointing
   at the staging backend, then rsyncs `frontend/dist/` to
   `/var/www/notevault-staging/`.

`concurrency: deploy-staging` (with `cancel-in-progress: false`) ensures only
one deploy runs at a time and queued runs aren't dropped.

### Environment-variable contract (production)

| Variable        | Required | Notes                                                |
|-----------------|----------|------------------------------------------------------|
| `PORT`          | optional | defaults to 3001                                     |
| `NODE_ENV`      | yes      | must be `production` in staging                      |
| `LOG_LEVEL`     | optional | pino level, default `info`                           |
| `DATABASE_URL`  | yes      | Postgres connection string                           |
| `JWT_SECRET`    | yes      | ≥ 16 chars; rotate via secret manager                |
| `JWT_EXPIRES_IN`| optional | default `24h`                                        |
| `CORS_ORIGIN`   | yes      | exact origin allowed by CORS                         |

The backend's `config.ts` validates these with Zod on startup and fails fast
with a descriptive error if any required field is missing or malformed.

## Migrations during deploy

The deploy workflow does **not** run migrations automatically. Apply them
manually on staging before bumping the image when the new release contains
DB changes:

```bash
ssh deploy@$STAGING_HOST
cd ~/notevault && git pull && cd db && \
  DATABASE_URL='postgres://...' node migrate.mjs
```

Migrations are idempotent (`_migrations` tracking table), so re-running on a
host that already has them applied is safe and prints `= skip` lines.
