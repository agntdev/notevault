import { expect, test } from "@playwright/test";

import { createNote, registerAndOpenNotes, uniqueEmail } from "./_helpers.js";

test.describe("real-time search", () => {
  test("debounced filter matches case-insensitively by title", async ({ page }) => {
    await registerAndOpenNotes(page, uniqueEmail("search"));

    for (const title of ["Shopping list", "Project ideas", "Weekend plans", "shopping cart"]) {
      await createNote(page, title);
    }

    const search = page.getByRole("searchbox");
    await search.fill("shop");
    // Wait past the 150ms debounce.
    await page.waitForTimeout(300);
    await expect(page.getByRole("heading", { level: 4, name: "Shopping list" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 4, name: "shopping cart" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 4, name: "Project ideas" })).toBeHidden();
  });

  test("clear button resets to the full list", async ({ page }) => {
    await registerAndOpenNotes(page, uniqueEmail("clear"));
    await createNote(page, "One");
    await createNote(page, "Two");

    const search = page.getByRole("searchbox");
    await search.fill("one");
    await page.waitForTimeout(300);
    await expect(page.getByRole("heading", { level: 4, name: "Two" })).toBeHidden();

    await page.getByLabel(/clear search/i).click();
    await expect(page.getByRole("searchbox")).toHaveValue("");
    await expect(page.getByRole("heading", { level: 4, name: "Two" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 4, name: "One" })).toBeVisible();
  });

  test("typed regex meta chars are treated literally — no crash", async ({ page }) => {
    await registerAndOpenNotes(page, uniqueEmail("regex"));
    await createNote(page, "Note (one)");
    await createNote(page, "Plain note");

    const search = page.getByRole("searchbox");
    await search.fill("(one)");
    await page.waitForTimeout(300);
    await expect(page.getByRole("heading", { level: 4, name: "Note (one)" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 4, name: "Plain note" })).toBeHidden();
  });

  test("zero hits shows the no-match placeholder", async ({ page }) => {
    await registerAndOpenNotes(page, uniqueEmail("nohits"));
    await createNote(page, "Only note");

    await page.getByRole("searchbox").fill("xxxxxx");
    await page.waitForTimeout(300);
    await expect(page.getByText(/no notes match/i)).toBeVisible();
  });
});
