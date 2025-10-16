import { test, expect } from "@playwright/test";

test("has login form", async ({ page }) => {
  await page.goto("/auth/login");

  // Expect a title "to contain" a substring.
  await expect(page.getByTestId("login-form")).toBeVisible();
});
