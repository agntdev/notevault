-- seed.sql — sample data for local development and integration tests.
--
-- bcrypt hash below = "password123" (10 rounds). Generated once with
-- `node -e "console.log(require('bcryptjs').hashSync('password123', 10))"`.

INSERT INTO users (id, email, password_hash) VALUES
    ('11111111-1111-1111-1111-111111111111', 'alice@example.com',
     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'),
    ('22222222-2222-2222-2222-222222222222', 'bob@example.com',
     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy')
ON CONFLICT DO NOTHING;

INSERT INTO notes (id, user_id, title, body) VALUES
    ('aaaaaaa1-0000-0000-0000-000000000001',
     '11111111-1111-1111-1111-111111111111',
     'Welcome to NoteVault',
     'This is the first sample note. Your real notes will appear here.'),
    ('aaaaaaa1-0000-0000-0000-000000000002',
     '11111111-1111-1111-1111-111111111111',
     'Shopping list',
     'Eggs, milk, bread, coffee, almonds.'),
    ('aaaaaaa1-0000-0000-0000-000000000003',
     '11111111-1111-1111-1111-111111111111',
     'Project ideas',
     'Personal notes app, weekend hike planner, sourdough log.'),
    ('bbbbbbb2-0000-0000-0000-000000000001',
     '22222222-2222-2222-2222-222222222222',
     'Bob''s first note',
     'Hello from Bob.')
ON CONFLICT DO NOTHING;
