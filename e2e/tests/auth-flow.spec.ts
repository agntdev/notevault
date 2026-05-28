import { expect, test } from "@playwright/test";

import { uniqueEmail } from "./_helpers.js";

test.describe("auth flow", () => {
  test("guest is redirected from /notes to /login", async ({ page }) => {
    await page.goto("/notes");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  });

  test("register creates an account, lands on /notes, persists on reload", async ({ page }) => {
    const email = uniqueEmail("register");
    await page.goto("/register");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill("password123");
    await page.getByRole("button", { name: /create account/i }).click();

    await expect(page).toHaveURL(/\/notes$/);
    await expect(page.getByText(email)).toBeVisible(); // nav badge

    // Refresh — session is persisted via zustand → localStorage.
    await page.reload();
    await expect(page).toHaveURL(/\/notes$/);
    await expect(page.getByText(email)).toBeVisible();
  });

  test("login with an existing account works; wrong password surfaces 401", async ({ page }) => {
    const email = uniqueEmail("login");

    // Register first.
    await page.goto("/register");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill("password123");
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/notes$/);

    // Logout, then log back in.
    await page.getByRole("button", { name: /logout/i }).click();
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill("password123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/notes$/);

    // Wrong password.
    await page.getByRole("button", { name: /logout/i }).click();
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill("wrong-password");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("register form rejects bad email + short password client-side", async ({ page }) => {
    await page.goto("/register");
    // HTML5 validation blocks submit if we click the button — fire submit directly.
    await page.getByLabel(/email/i).fill("not-an-email");
    await page.getByLabel(/password/i).fill("1234");
    await page.locator("form").evaluate((form: HTMLFormElement) => form.requestSubmit());
    await expect(page.getByText(/valid email/i)).toBeVisible();
    await expect(page.getByText(/at least 8 characters/i)).toBeVisible();
  });
});
