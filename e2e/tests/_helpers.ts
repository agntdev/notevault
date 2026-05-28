import { expect, type Page } from "@playwright/test";

/** Make a unique email so parallel runs don't collide. */
export function uniqueEmail(prefix = "qa"): string {
  return `${prefix}+${Date.now()}-${Math.floor(Math.random() * 1e6)}@e2e.test`;
}

/**
 * Drive the register flow end-to-end. Leaves the page at /notes with the
 * session hydrated.
 */
export async function registerAndOpenNotes(page: Page, email: string, password = "password123"): Promise<void> {
  await page.goto("/register");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/notes$/);
  await expect(page.getByRole("heading", { name: /your notes/i })).toBeVisible();
}

/** Create a note via the form; waits for it to appear in the list. */
export async function createNote(page: Page, title: string, body = ""): Promise<void> {
  await page.getByLabel(/title/i).first().fill(title);
  if (body) await page.getByLabel(/body/i).fill(body);
  await page.getByRole("button", { name: /add note/i }).click();
  await expect(page.getByRole("heading", { level: 4, name: title })).toBeVisible();
}
