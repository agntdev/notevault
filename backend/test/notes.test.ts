import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";

import { createApp } from "../src/app.js";

const app = createApp();

async function registerAndToken(email: string) {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ email, password: "password123" });
  expect(res.status).toBe(201);
  return res.body.token as string;
}

describe("notes CRUD (requires auth)", () => {
  let token: string;

  beforeEach(async () => {
    token = await registerAndToken("notes@example.com");
  });

  it("rejects unauthenticated calls with 401", async () => {
    const list = await request(app).get("/api/notes");
    expect(list.status).toBe(401);

    const create = await request(app)
      .post("/api/notes")
      .send({ title: "x" });
    expect(create.status).toBe(401);
  });

  it("creates, lists, fetches, updates, and deletes a note", async () => {
    // Create
    const created = await request(app)
      .post("/api/notes")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Hello", body: "world" });
    expect(created.status).toBe(201);
    const id = created.body.id as string;
    expect(created.body.title).toBe("Hello");
    expect(created.body.body).toBe("world");
    expect(typeof created.body.createdAt).toBe("string");

    // List
    const list = await request(app)
      .get("/api/notes")
      .set("Authorization", `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].id).toBe(id);

    // Fetch single
    const fetched = await request(app)
      .get(`/api/notes/${id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.title).toBe("Hello");

    // Update (partial)
    const updated = await request(app)
      .patch(`/api/notes/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Renamed" });
    expect(updated.status).toBe(200);
    expect(updated.body.title).toBe("Renamed");
    expect(updated.body.body).toBe("world"); // unchanged

    // Delete
    const deleted = await request(app)
      .delete(`/api/notes/${id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(deleted.status).toBe(200);

    // Now 404
    const gone = await request(app)
      .get(`/api/notes/${id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(gone.status).toBe(404);
  });

  it("scopes notes to the owning user — alice can't see bob's notes", async () => {
    const aliceToken = await registerAndToken("alice@example.com");
    const bobToken = await registerAndToken("bob@example.com");

    const aliceNote = await request(app)
      .post("/api/notes")
      .set("Authorization", `Bearer ${aliceToken}`)
      .send({ title: "Alice's secret" });
    expect(aliceNote.status).toBe(201);

    const bobList = await request(app)
      .get("/api/notes")
      .set("Authorization", `Bearer ${bobToken}`);
    expect(bobList.body).toHaveLength(0);

    const bobPeek = await request(app)
      .get(`/api/notes/${aliceNote.body.id}`)
      .set("Authorization", `Bearer ${bobToken}`);
    expect(bobPeek.status).toBe(404);
  });

  it("filters by ?search= (case-insensitive substring)", async () => {
    const headers = { Authorization: `Bearer ${token}` };

    for (const title of ["Shopping list", "Project ideas", "Weekend plans"]) {
      await request(app).post("/api/notes").set(headers).send({ title });
    }

    const res = await request(app).get("/api/notes?search=shop").set(headers);
    expect(res.status).toBe(200);
    expect(res.body.map((n: { title: string }) => n.title)).toEqual(["Shopping list"]);
  });

  it("rejects empty title with 400 + field details", async () => {
    const res = await request(app)
      .post("/api/notes")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "   " });
    expect(res.status).toBe(400);
    expect(res.body.details).toHaveProperty("title");
  });
});
