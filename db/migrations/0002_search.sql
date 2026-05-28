-- 0002_search.sql — trigram GIN index for the real-time search (T07).
--
-- The frontend filters by title with case-insensitive substring matching;
-- a trigram GIN index lets `title ILIKE '%query%'` use an index instead of
-- a full table scan once the notes count grows.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX notes_title_trgm_idx ON notes USING GIN (title gin_trgm_ops);

COMMIT;
