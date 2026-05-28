import { query } from "../db.js";

export interface NoteRow {
  id: string;
  user_id: string;
  title: string;
  body: string;
  created_at: Date;
  updated_at: Date;
}

export interface PublicNote {
  id: string;
  userId: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export const toPublicNote = (n: NoteRow): PublicNote => ({
  id: n.id,
  userId: n.user_id,
  title: n.title,
  body: n.body,
  createdAt: n.created_at.toISOString(),
  updatedAt: n.updated_at.toISOString(),
});

export interface ListNotesOptions {
  /** Optional case-insensitive substring of the title. */
  search?: string;
}

export const notesRepo = {
  async listForUser(userId: string, opts: ListNotesOptions = {}): Promise<NoteRow[]> {
    if (opts.search && opts.search.trim()) {
      const r = await query<NoteRow>(
        `SELECT id, user_id, title, body, created_at, updated_at
         FROM notes
         WHERE user_id = $1 AND title ILIKE $2
         ORDER BY updated_at DESC`,
        [userId, `%${opts.search.trim()}%`],
      );
      return r.rows;
    }
    const r = await query<NoteRow>(
      `SELECT id, user_id, title, body, created_at, updated_at
       FROM notes WHERE user_id = $1 ORDER BY updated_at DESC`,
      [userId],
    );
    return r.rows;
  },

  async findById(userId: string, id: string): Promise<NoteRow | null> {
    const r = await query<NoteRow>(
      `SELECT id, user_id, title, body, created_at, updated_at
       FROM notes WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [id, userId],
    );
    return r.rows[0] ?? null;
  },

  async create(userId: string, title: string, body: string): Promise<NoteRow> {
    const r = await query<NoteRow>(
      `INSERT INTO notes (user_id, title, body)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, title, body, created_at, updated_at`,
      [userId, title, body],
    );
    return r.rows[0];
  },

  async update(
    userId: string,
    id: string,
    patch: { title?: string; body?: string },
  ): Promise<NoteRow | null> {
    // Only build SET clauses for fields the caller actually sent — partial
    // updates leave omitted columns untouched.
    const sets: string[] = [];
    const params: unknown[] = [];
    if (patch.title !== undefined) {
      params.push(patch.title);
      sets.push(`title = $${params.length}`);
    }
    if (patch.body !== undefined) {
      params.push(patch.body);
      sets.push(`body = $${params.length}`);
    }
    if (sets.length === 0) {
      return this.findById(userId, id);
    }
    params.push(id, userId);
    const r = await query<NoteRow>(
      `UPDATE notes SET ${sets.join(", ")}
       WHERE id = $${params.length - 1} AND user_id = $${params.length}
       RETURNING id, user_id, title, body, created_at, updated_at`,
      params,
    );
    return r.rows[0] ?? null;
  },

  async remove(userId: string, id: string): Promise<boolean> {
    const r = await query("DELETE FROM notes WHERE id = $1 AND user_id = $2", [id, userId]);
    return (r.rowCount ?? 0) > 0;
  },
};
