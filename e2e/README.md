# NoteVault — End-to-end tests

Playwright suite that drives a real browser against a running backend +
frontend + Postgres. This is the **Final QA** pass from T12 and covers
the user-facing flows top-to-bottom.

## Coverage

| Spec | Scenarios |
|---|---|
| [`auth-flow.spec.ts`](tests/auth-flow.spec.ts) | Guest is redirected from `/notes` to `/login`. Register lands on `/notes` and the session survives a reload. Login + logout + relogin works. Wrong password surfaces 401 server-side. Register form rejects bad email + short password client-side. |
| [`notes-crud.spec.ts`](tests/notes-crud.spec.ts) | Create → edit-inline → delete-with-confirm round-trip. Cancelling the delete dialog keeps the note. Empty title leaves the Add button disabled. Logout invalidates the session so `/notes` bounces back to `/login`. |
| [`search.spec.ts`](tests/search.spec.ts) | Debounced filter matches case-insensitively. Clear button restores the full list. Regex meta chars are treated literally — searching `(one)` doesn't crash. Zero hits shows the no-match placeholder. |

Tests are run serially (`workers: 1`, `fullyParallel: false`) because they
share a single Postgres database; each test uses a unique email
(`uniqueEmail(prefix)` in `_helpers.ts`) so individual runs don't collide.
`global-setup.ts` truncates `users` (cascading to `notes`) once at the
start of the suite.

## Running locally

### 1. Bring up Postgres for the e2e DB

```bash
docker run --rm -d --name notevault-e2e-pg \
  -e POSTGRES_USER=notevault \
  -e POSTGRES_PASSWORD=notevault \
  -e POSTGRES_DB=notevault_e2e \
  -p 5432:5432 postgres:16
```

### 2. Apply migrations

```bash
DATABASE_URL=postgres://notevault:notevault@localhost:5432/notevault_e2e \
  node ../db/migrate.mjs
```

### 3. Build the apps (Playwright's `webServer` will start them)

```bash
cd ../backend && npm ci && npm run build
cd ../frontend && npm ci && npm run build
```

### 4. Run the suite

```bash
cd ../e2e && npm ci && npx playwright install --with-deps
npm test
```

Open the HTML report on failure with `npm run report`.

## Environment

| Var | Default | Purpose |
|---|---|---|
| `E2E_DATABASE_URL` | `postgres://notevault:notevault@localhost:5432/notevault_e2e` | Postgres used by the backend under test |
| `E2E_BACKEND_PORT` | `3101` | Port Playwright spins the backend on |
| `E2E_FRONTEND_PORT` | `4173` | Port for the frontend preview server |

The backend env uses a fixed `JWT_SECRET` (`e2e-secret-…`) and 1h
`JWT_EXPIRES_IN` so token-expiry assertions are deterministic without
having to manipulate clock time.

## CI

The unit/integration suite (T10) already gates every PR. E2E is intended
to be promoted to a manual / nightly run when staging is bootstrapped —
the existing `deploy-staging.yml` workflow from T11 produces a healthy
staging URL that this suite can target by overriding `baseURL`.
