import { describe, it, expect } from "vitest";

import { hashPassword, verifyPassword } from "../src/auth/passwords.js";

describe("password hashing", () => {
  it("round-trips a password", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    expect(hash).not.toContain("correct-horse");
    expect(await verifyPassword("correct-horse-battery-staple", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("produces a different hash each call (random salt)", async () => {
    const a = await hashPassword("samepw");
    const b = await hashPassword("samepw");
    expect(a).not.toBe(b);
  });
});
