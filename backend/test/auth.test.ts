import { describe, it, expect } from "vitest";
import request from "supertest";

import { createApp } from "../src/app.js";

const app = createApp();

describe("POST /api/auth/register", () => {
  it("creates a user and returns { user, token }", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "new@example.com", password: "password123" });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe("new@example.com");
    expect(typeof res.body.user.id).toBe("string");
    expect(res.body.user).not.toHaveProperty("password_hash");
    expect(typeof res.body.token).toBe("string");
  });

  it("rejects duplicate emails with 409", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ email: "dup@example.com", password: "password123" })
      .expect(201);

    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "DUP@example.com", password: "differentPW1" });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already registered/i);
  });

  it("validates email + password and returns 400 details", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "not-an-email", password: "short" });
    expect(res.status).toBe(400);
    expect(res.body.details).toHaveProperty("email");
    expect(res.body.details).toHaveProperty("password");
  });
});

describe("POST /api/auth/login", () => {
  it("returns a token on valid credentials", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ email: "login@example.com", password: "password123" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "login@example.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("login@example.com");
    expect(typeof res.body.token).toBe("string");
  });

  it("returns 401 on unknown email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "ghost@example.com", password: "password123" });
    expect(res.status).toBe(401);
  });

  it("returns 401 on wrong password (and the message doesn't leak which field was wrong)", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ email: "pw@example.com", password: "password123" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "pw@example.com", password: "wrong-password" });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid credentials/i);
  });

  it("is case-insensitive on email", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ email: "Mixed@Example.com", password: "password123" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "mixed@example.com", password: "password123" });
    expect(res.status).toBe(200);
  });
});
