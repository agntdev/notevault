import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import request from "supertest";

import { createApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";

const app = createApp();

describe("requireAuth middleware (via /api/notes)", () => {
  it("401 when no Authorization header", async () => {
    const res = await request(app).get("/api/notes");
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/auth/i);
  });

  it("401 when Authorization is not a bearer scheme", async () => {
    const res = await request(app).get("/api/notes").set("Authorization", "Basic deadbeef");
    expect(res.status).toBe(401);
  });

  it("401 when the token signature is invalid", async () => {
    // Sign with a different secret — the middleware must reject.
    const evil = jwt.sign({ sub: "abc", email: "e@x.com" }, "another-secret", {
      issuer: "notevault",
    });
    const res = await request(app).get("/api/notes").set("Authorization", `Bearer ${evil}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid token/i);
  });

  it("401 when the token is expired", async () => {
    const cfg = loadConfig();
    const expired = jwt.sign({ sub: "abc", email: "e@x.com" }, cfg.JWT_SECRET, {
      issuer: "notevault",
      expiresIn: "-1s",
    });
    const res = await request(app).get("/api/notes").set("Authorization", `Bearer ${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/expired/i);
  });

  it("401 when the issuer doesn't match", async () => {
    const cfg = loadConfig();
    const wrongIss = jwt.sign({ sub: "abc", email: "e@x.com" }, cfg.JWT_SECRET, {
      issuer: "evil.example.com",
    });
    const res = await request(app).get("/api/notes").set("Authorization", `Bearer ${wrongIss}`);
    expect(res.status).toBe(401);
  });
});
