import { expect, test } from "@playwright/test";

import { createNote, registerAndOpenNotes, uniqueEmail } from "./_helpers.js";

test.describe("notes CRUD", () => {
  test("create, edit, delete a note end-to-end", async ({ page }) => {
    await registerAndOpenNotes(page, uniqueEmail("crud"));

    // CREATE
    await createNote(page, "Shopping list", "Eggs, milk, bread");
    await expect(page.getByRole("heading", { name: /your notes \(1\)/i })).toBeVisible();

    // EDIT inline
    const card = page.locator(".nv-note-card", { hasText: "Shopping list" });
    await card.getByRole("button", { name: /^edit$/i }).click();
    const editingTitle = card.getByLabel(/title/i);
    await editingTitle.fill("Weekly groceries");
    await card.getByRole("button", { name: /^save$/i }).click();
    await expect(page.getByRole("heading", { level: 4, name: "Weekly groceries" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 4, name: "Shopping list" })).toBeHidden();

    // DELETE with confirmation dialog
    const renamedCard = page.locator(".nv-note-card", { hasText: "Weekly groceries" });
    await renamedCard.getByRole("button", { name: /^delete$/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/cannot be undone/i)).toBeVisible();
    await dialog.getByRole("button", { name: /^delete$/i }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("heading", { level: 4, name: "Weekly groceries" })).toBeHidden();
    await expect(page.getByRole("heading", { name: /your notes \(0\)/i })).toBeVisible();
  });

  test("cancelling the delete dialog keeps the note", async ({ page }) => {
    await registerAndOpenNotes(page, uniqueEmail("cancel"));
    await createNote(page, "Keep me");

    const card = page.locator(".nv-note-card", { hasText: "Keep me" });
    await card.getByRole("button", { name: /^delete$/i }).click();
    await page.getByRole("dialog").getByRole("button", { name: /cancel/i }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByRole("heading", { level: 4, name: "Keep me" })).toBeVisible();
  });

  test("validation: empty title is rejected client-side", async ({ page }) => {
    await registerAndOpenNotes(page, uniqueEmail("validate"));

    const submit = page.getByRole("button", { name: /add note/i });
    await expect(submit).toBeDisabled();

    await page.getByLabel(/title/i).first().fill("   ");
    await expect(submit).toBeDisabled(); // trimmed → empty
  });

  test("logging out clears the session — refresh bounces back to /login", async ({ page }) => {
    await registerAndOpenNotes(page, uniqueEmail("logout"));
    await page.getByRole("button", { name: /logout/i }).click();
    await page.goto("/notes");
    await expect(page).toHaveURL(/\/login$/);
  });
});
