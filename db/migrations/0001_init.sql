-- 0001_init.sql — NoteVault initial schema (T09).
--
-- Adds the `users` and `notes` tables, the indexes and constraints they
-- need for the auth + CRUD + search features, and the trigger that keeps
-- `notes.updated_at` accurate.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()

CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case-insensitive uniqueness without pulling in the CITEXT extension.
CREATE UNIQUE INDEX users_email_lower_uidx ON users (LOWER(email));

CREATE TABLE notes (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      TEXT NOT NULL,
    body       TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT notes_title_len_chk CHECK (char_length(title) BETWEEN 1 AND 200),
    CONSTRAINT notes_body_len_chk  CHECK (char_length(body) <= 50000)
);

CREATE INDEX notes_user_id_idx ON notes (user_id);

-- Keep `updated_at` in sync without relying on application code.
CREATE OR REPLACE FUNCTION notes_set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_set_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION notes_set_updated_at();

COMMIT;
