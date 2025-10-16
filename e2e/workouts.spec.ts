import { test, expect } from "@playwright/test";

const TEST_USER_EMAIL = process.env.E2E_USERNAME;
const TEST_USER_PASSWORD = process.env.E2E_PASSWORD;

if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
  throw new Error("E2E_USERNAME and E2E_PASSWORD must be set in .env.test file");
}

test.describe("Workouts CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/login", { waitUntil: "networkidle" });
    await page.getByTestId("email-input").fill(TEST_USER_EMAIL);
    await page.getByTestId("password-input").fill(TEST_USER_PASSWORD);
    await page.getByTestId("login-button").click();
    await page.waitForURL("/dashboard");

    // Clean up workouts before each test
    const response = await page.request.delete("/api/workouts/all");
    expect(response.status()).toBe(204);

    await page.reload();
  });

  test("should allow a user to add, view, and delete a workout", async ({ page }) => {
    // 1. Empty dashboard
    await expect(page.getByTestId("no-results-row")).toBeVisible();

    // 2. Add a workout
    await page.getByTestId("add-workout-dialog-button").click();
    const addWorkoutDialog = page.getByTestId("add-workout-dialog");
    await expect(addWorkoutDialog).toBeVisible();

    await page.getByTestId("workout-name-input").fill("My Test Workout");
    await page.getByTestId("gpx-file-input").setInputFiles("e2e/example-1.gpx");
    await page.getByTestId("add-workout-button").click();

    // 3. Workout visible on dashboard
    await expect(page.getByText("My Test Workout")).toBeVisible();
    const workoutRow = page.getByTestId(/workout-row-.*/);
    await expect(workoutRow).toBeVisible();

    // 4. View the workout
    await workoutRow.click();
    await page.waitForURL(/\/workouts\/.*/);
    await expect(page.getByTestId("workout-view")).toBeVisible();
    await expect(page.getByText("My Test Workout")).toBeVisible();

    // 5. Go back to dashboard
    await page.getByTestId("back-button").click();
    await page.waitForURL("/dashboard");

    // 6. Delete the workout
    await page.getByTestId("actions-menu-button").click();
    await page.getByTestId("delete-workout-button").click();
    const deleteDialog = page.getByTestId("delete-confirmation-dialog");
    await expect(deleteDialog).toBeVisible();
    await page.getByTestId("confirm-delete-button").click();

    // 7. Empty dashboard
    await expect(page.getByTestId("no-results-row")).toBeVisible();
  });
});
