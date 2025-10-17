import { test, expect } from "@playwright/test";

const TEST_USER_EMAIL = process.env.E2E_USERNAME;
const TEST_USER_PASSWORD = process.env.E2E_PASSWORD;

if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
  throw new Error("E2E_USERNAME and E2E_PASSWORD must be set in .env.test file");
}

test.describe("Heatmap", () => {
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

  test("should display a heatmap of multiple workouts", async ({ page }) => {
    // 1. Add first workout
    await page.getByTestId("add-workout-dialog-button").click();
    await page.getByTestId("workout-name-input").fill("Test Workout 1");
    await page.getByTestId("gpx-file-input").setInputFiles("e2e/example-1.gpx");
    await page.getByTestId("add-workout-button").click();

    // 2. Add second workout
    await page.getByTestId("add-workout-dialog-button").click();
    await page.getByTestId("workout-name-input").fill("Test Workout 2");
    await page.getByTestId("gpx-file-input").setInputFiles("e2e/example-2.gpx");
    await page.getByTestId("add-workout-button").click();

    // 3. Workouts visible on dashboard
    await expect(page.getByText("Test Workout 1")).toBeVisible();
    await expect(page.getByText("Test Workout 2")).toBeVisible();

    // 4. Navigate to heatmap
    await page.getByTestId("heatmap-nav-link").click();
    await page.waitForURL("/heatmap");

    // 5. Verify heatmap
    await expect(page.getByTestId("heatmap-view")).toBeVisible();
    await expect(page.getByTestId("main-map")).toBeVisible();

    // workaround for the back button sometimes being unclickable
    await page.goto("/heatmap", { waitUntil: "networkidle" });

    // 6. Go back to dashboard
    await page.getByTestId("back-button").click();
    await page.waitForURL("/dashboard");
    await expect(page.getByText("Test Workout 1")).toBeVisible();
    await expect(page.getByText("Expect failing assertion")).toBeVisible();
  });
});
