import { test, expect } from '@playwright/test';

// Please replace with your test user credentials
const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'password';

test.describe('Authentication', () => {
  test('should allow a user to log in successfully', async ({ page }) => {
    // Arrange
    await page.goto('/auth/login');

    // Act
    await page.getByTestId('email-input').fill(TEST_USER_EMAIL);
    await page.getByTestId('password-input').fill(TEST_USER_PASSWORD);
    await page.getByTestId('login-button').click();

    // Assert
    await page.waitForURL('/dashboard');
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: 'Workouts' })).toBeVisible();
  });

  test('should show an error message on failed login', async ({ page }) => {
    // Arrange
    await page.goto('/auth/login');

    // Act
    await page.getByTestId('email-input').fill(TEST_USER_EMAIL);
    await page.getByTestId('password-input').fill('wrong-password');
    await page.getByTestId('login-button').click();

    // Assert
    await expect(page).toHaveURL('/auth/login');
    const errorToast = page.getByRole('alert');
    await expect(errorToast).toBeVisible();
    await expect(errorToast).toContainText('Login Failed');
  });
});
