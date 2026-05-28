import { query } from "../db.js";

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
}

export const usersRepo = {
  async findByEmail(email: string): Promise<UserRow | null> {
    const r = await query<UserRow>(
      "SELECT id, email, password_hash, created_at FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
      [email],
    );
    return r.rows[0] ?? null;
  },

  async findById(id: string): Promise<UserRow | null> {
    const r = await query<UserRow>(
      "SELECT id, email, password_hash, created_at FROM users WHERE id = $1 LIMIT 1",
      [id],
    );
    return r.rows[0] ?? null;
  },

  async create(email: string, passwordHash: string): Promise<UserRow> {
    const r = await query<UserRow>(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email, password_hash, created_at`,
      [email, passwordHash],
    );
    return r.rows[0];
  },
};

export const toPublicUser = (u: UserRow) => ({ id: u.id, email: u.email });
