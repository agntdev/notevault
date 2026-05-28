# NoteVault — Backend

Node.js + Express + TypeScript REST API backed by PostgreSQL.

## Stack

- **Express** 4 — routing and middleware
- **TypeScript** strict, ESM build
- **pg** — Postgres client with a shared pool
- **zod** — request body / query validation
- **pino** + **pino-http** — structured JSON logging with redaction
- **bcryptjs** — password hashing (10 rounds)
- **jsonwebtoken** — JWT issuance (verification middleware lands in T05)

## Endpoints

| Method | Path                  | Auth | Notes                             |
|--------|-----------------------|------|-----------------------------------|
| GET    | `/api/health`         | no   | liveness probe                    |
| POST   | `/api/auth/register`  | no   | creates a user, returns JWT       |
| POST   | `/api/auth/login`     | no   | returns JWT on valid credentials  |
| GET    | `/api/notes`          | yes  | list notes for the current user (`?search=`) |
| POST   | `/api/notes`          | yes  | create a note                     |
| GET    | `/api/notes/:id`      | yes  | fetch a single note               |
| PATCH  | `/api/notes/:id`      | yes  | partial update (title and/or body)|
| DELETE | `/api/notes/:id`      | yes  | delete a note                     |

Routes marked **Auth = yes** go through the `requireAuth` middleware.
T08 ships a stub middleware that 401s every request — T05 fills in the
JWT verification logic, populates `req.user`, and lets valid requests
through. This way the protection seam exists from day one and the API
shape doesn't change between T08 → T05 → T04.

## Layout

```
src/
├── app.ts            Express app factory (used by server + tests)
├── server.ts         entrypoint: listen, signal handling
├── config.ts         zod-validated env loader
├── db.ts             pg.Pool factory + query helper
├── logger.ts         pino logger
├── errors.ts         HttpError + helpers (Unauthorized, NotFound, …)
├── auth/
│   ├── passwords.ts  bcrypt hash/verify
│   └── tokens.ts     JWT signer
├── middleware/
│   ├── errorHandler.ts  ZodError + HttpError → JSON
│   └── requireAuth.ts   T05 will replace this stub
├── repos/
│   ├── usersRepo.ts  users SQL access
│   └── notesRepo.ts  notes SQL access
└── routes/
    ├── auth.ts       /api/auth/register, /login
    └── notes.ts      /api/notes CRUD
```

## Local development

```bash
cp .env.example .env
# Set DATABASE_URL + JWT_SECRET
npm install
# Apply schema:
node ../db/migrate.mjs
npm run dev
```

## Logging

`pino-http` emits one structured log per request. The `req.headers.authorization`
and any `*.password` fields are redacted.

## Error responses

All non-2xx responses are JSON of the shape:

```json
{ "error": "human-readable message", "details": { "title": "…" } }
```

`details` only appears on 400 validation failures and maps field name → message.
