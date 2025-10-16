import { test, expect } from "@playwright/test";
import type { Page } from "playwright-core";

const TEST_USER_1_EMAIL = process.env.E2E_USERNAME;
const TEST_USER_1_PASSWORD = process.env.E2E_PASSWORD;
const TEST_USER_2_EMAIL = process.env.E2E_USERNAME_2;
const TEST_USER_2_PASSWORD = process.env.E2E_PASSWORD;

if (!TEST_USER_1_EMAIL || !TEST_USER_1_PASSWORD || !TEST_USER_2_EMAIL || !TEST_USER_2_PASSWORD) {
  throw new Error("E2E_USERNAME, E2E_USERNAME_2, and E2E_PASSWORD must be set in .env.test file");
}

const login = async (page: Page, email: string, pass: string) => {
  await page.goto("/auth/login", { waitUntil: "networkidle" });
  await page.getByTestId("email-input").fill(email);
  await page.getByTestId("password-input").fill(pass);
  await page.getByTestId("login-button").click();
  await page.waitForURL("/dashboard");
};

const logout = async (page: Page) => {
  await page.getByTestId("logout-button").click();
  await page.waitForURL("/auth/login");
};

const cleanupWorkouts = async (page: Page) => {
  const response = await page.request.delete("/api/workouts/all");
  expect(response.status()).toBe(204);
  await page.reload({ waitUntil: "networkidle" });
};

test.describe("Multi-user data isolation", () => {
  test("should not show workouts from another user", async ({ page }) => {
    // --- USER 1: Login and add a workout ---
    await login(page, TEST_USER_1_EMAIL, TEST_USER_1_PASSWORD);
    await cleanupWorkouts(page);

    // Add a workout
    await page.getByTestId("add-workout-dialog-button").click();
    await page.getByTestId("workout-name-input").fill("User 1 Workout");
    await page.getByTestId("gpx-file-input").setInputFiles("e2e/example-1.gpx");
    await page.getByTestId("add-workout-button").click();

    // Verify workout is visible
    await expect(page.getByText("User 1 Workout")).toBeVisible();
    await expect(page.getByTestId(/workout-row-.*/)).toHaveCount(1);

    // Logout
    await logout(page);

    // --- USER 2: Login and verify empty dashboard ---
    await login(page, TEST_USER_2_EMAIL, TEST_USER_2_PASSWORD);
    await cleanupWorkouts(page); // Clean up just in case

    // Verify dashboard is empty
    await expect(page.getByTestId("no-results-row")).toBeVisible();
    await expect(page.getByText("User 1 Workout")).not.toBeVisible();

    // Logout
    await logout(page);

    // --- USER 1: Login again and verify workout is still there ---
    await login(page, TEST_USER_1_EMAIL, TEST_USER_1_PASSWORD);

    // Verify workout is still visible
    await expect(page.getByText("User 1 Workout")).toBeVisible();
    await expect(page.getByTestId(/workout-row-.*/)).toHaveCount(1);

    // Final cleanup
    await cleanupWorkouts(page);
    await expect(page.getByTestId("no-results-row")).toBeVisible();
  });
});
