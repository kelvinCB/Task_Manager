import { test, expect } from '@playwright/test';
import { AuthPage } from './page-objects/auth.page';

// Test credentials
// Test credentials
if (!process.env.E2E_USER_AUTH_EMAIL || !process.env.E2E_USER_AUTH_PASSWORD) {
  throw new Error('E2E_USER_AUTH_EMAIL and E2E_USER_AUTH_PASSWORD must be set in environment variables');
}

const TEST_EMAIL = process.env.E2E_USER_AUTH_EMAIL;
const TEST_PASSWORD = process.env.E2E_USER_AUTH_PASSWORD;

test.describe('Password Visibility Toggle E2E Tests', () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
  });

  test.describe('Login Page Password Visibility', () => {
    test.beforeEach(async ({ page }) => {
      await authPage.goToLogin();
    });

    test('should hide password by default', async ({ page }) => {
      // Password field should be of type "password" by default
      const passwordInput = page.locator('[data-testid="password-input"]');
      await expect(passwordInput).toHaveAttribute('type', 'password');
      
      // Eye icon should be visible (showing "show password" state)
      const toggleButton = page.locator('[data-testid="toggle-password-visibility"]');
      await expect(toggleButton).toBeVisible();
      
      // Should show Eye icon (not EyeOff) when password is hidden
      const eyeIcon = toggleButton.locator('svg');
      await expect(eyeIcon).toBeVisible();
    });

    test('should show password when toggle is clicked', async ({ page }) => {
      const passwordInput = page.locator('[data-testid="password-input"]');
      const toggleButton = page.locator('[data-testid="toggle-password-visibility"]');
      
      // Fill password first
      await passwordInput.fill(TEST_PASSWORD);
      
      // Click toggle to show password
      await toggleButton.click();
      
      // Password field should now be of type "text"
      await expect(passwordInput).toHaveAttribute('type', 'text');
      
      // Password should be visible in the input
      await expect(passwordInput).toHaveValue(TEST_PASSWORD);
    });

    test('should hide password again when toggle is clicked twice', async ({ page }) => {
      const passwordInput = page.locator('[data-testid="password-input"]');
      const toggleButton = page.locator('[data-testid="toggle-password-visibility"]');
      
      // Fill password
      await passwordInput.fill(TEST_PASSWORD);
      
      // Click toggle to show password
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
      
      // Click toggle again to hide password
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
      
      // Password value should still be preserved
      await expect(passwordInput).toHaveValue(TEST_PASSWORD);
    });

    test('should show correct tooltip text based on visibility state', async ({ page }) => {
      const toggleButton = page.locator('[data-testid="toggle-password-visibility"]');
      
      // Initially should show "Mostrar contraseña" tooltip
      await expect(toggleButton).toHaveAttribute('title', 'Mostrar contraseña');
      
      // After clicking, should show "Ocultar contraseña" tooltip
      await toggleButton.click();
      await expect(toggleButton).toHaveAttribute('title', 'Ocultar contraseña');
      
      // After clicking again, should show "Mostrar contraseña" tooltip
      await toggleButton.click();
      await expect(toggleButton).toHaveAttribute('title', 'Mostrar contraseña');
    });

    test('should maintain password visibility state during form interactions', async ({ page }) => {
      const passwordInput = page.locator('[data-testid="password-input"]');
      const emailInput = page.locator('[data-testid="email-input"]');
      const toggleButton = page.locator('[data-testid="toggle-password-visibility"]');
      
      // Fill password and make it visible
      await passwordInput.fill(TEST_PASSWORD);
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
      
      // Interact with other form elements
      await emailInput.fill(TEST_EMAIL);
      await emailInput.blur();
      
      // Password visibility state should be maintained
      await expect(passwordInput).toHaveAttribute('type', 'text');
      await expect(passwordInput).toHaveValue(TEST_PASSWORD);
    });
  });

  test.describe('Register Page Password Visibility', () => {
    test.beforeEach(async ({ page }) => {
      await authPage.goToRegister();
    });

    test('should hide password by default on register page', async ({ page }) => {
      const passwordInput = page.locator('[data-testid="password-input"]');
      await expect(passwordInput).toHaveAttribute('type', 'password');
      
      const toggleButton = page.locator('[data-testid="toggle-password-visibility"]');
      await expect(toggleButton).toBeVisible();
    });

    test('should toggle password visibility on register page', async ({ page }) => {
      const passwordInput = page.locator('[data-testid="password-input"]');
      const toggleButton = page.locator('[data-testid="toggle-password-visibility"]');
      
      await passwordInput.fill(TEST_PASSWORD);
      
      // Show password
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
      
      // Hide password
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('should preserve password visibility state when switching between login and register', async ({ page }) => {
      const passwordInput = page.locator('[data-testid="password-input"]');
      const toggleButton = page.locator('[data-testid="toggle-password-visibility"]');
      
      // Set password visibility to visible on register page
      await passwordInput.fill(TEST_PASSWORD);
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
      
      // Navigate to login page
      await authPage.goToLoginFromRegister();
      
      // Password should be hidden by default on login page (each component has its own state)
      const loginPasswordInput = page.locator('[data-testid="password-input"]');
      await expect(loginPasswordInput).toHaveAttribute('type', 'password');
    });
  });

  test.describe('Reset Password Page Password Visibility', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate directly to reset password page (simulating coming from email link)
      await page.goto('/reset-password');
    });

    test('should hide both password fields by default', async ({ page }) => {
      const passwordInput = page.locator('[data-testid="password-input"]');
      const confirmPasswordInput = page.locator('[data-testid="confirm-password-input"]');
      
      await expect(passwordInput).toHaveAttribute('type', 'password');
      await expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    });

    test('should toggle new password visibility independently', async ({ page }) => {
      const passwordInput = page.locator('[data-testid="password-input"]');
      const confirmPasswordInput = page.locator('[data-testid="confirm-password-input"]');
      
      // Fill both password fields
      await passwordInput.fill(TEST_PASSWORD);
      await confirmPasswordInput.fill(TEST_PASSWORD);
      
      // Find the toggle button for the new password field (first toggle button)
      const passwordToggleButton = page.locator('button').filter({ has: page.locator('svg') }).first();
      
      // Show new password
      await passwordToggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
      
      // Confirm password should still be hidden
      await expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    });

    test('should toggle confirm password visibility independently', async ({ page }) => {
      const passwordInput = page.locator('[data-testid="password-input"]');
      const confirmPasswordInput = page.locator('[data-testid="confirm-password-input"]');
      
      // Fill both password fields
      await passwordInput.fill(TEST_PASSWORD);
      await confirmPasswordInput.fill(TEST_PASSWORD);
      
      // Find the toggle button for the confirm password field (second toggle button)
      const confirmPasswordToggleButton = page.locator('button').filter({ has: page.locator('svg') }).nth(1);
      
      // Show confirm password
      await confirmPasswordToggleButton.click();
      await expect(confirmPasswordInput).toHaveAttribute('type', 'text');
      
      // New password should still be hidden
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('should toggle both password fields independently', async ({ page }) => {
      const passwordInput = page.locator('[data-testid="password-input"]');
      const confirmPasswordInput = page.locator('[data-testid="confirm-password-input"]');
      
      // Fill both password fields
      await passwordInput.fill(TEST_PASSWORD);
      await confirmPasswordInput.fill(TEST_PASSWORD);
      
      // Find both toggle buttons
      const passwordToggleButton = page.locator('button').filter({ has: page.locator('svg') }).first();
      const confirmPasswordToggleButton = page.locator('button').filter({ has: page.locator('svg') }).nth(1);
      
      // Show both passwords
      await passwordToggleButton.click();
      await confirmPasswordToggleButton.click();
      
      await expect(passwordInput).toHaveAttribute('type', 'text');
      await expect(confirmPasswordInput).toHaveAttribute('type', 'text');
      
      // Hide only the new password
      await passwordToggleButton.click();
      
      await expect(passwordInput).toHaveAttribute('type', 'password');
      await expect(confirmPasswordInput).toHaveAttribute('type', 'text');
    });

    test('should maintain password values when toggling visibility', async ({ page }) => {
      const passwordInput = page.locator('[data-testid="password-input"]');
      const confirmPasswordInput = page.locator('[data-testid="confirm-password-input"]');
      
      const newPassword = 'NewPassword123';
      const confirmPassword = 'NewPassword123';
      
      // Fill password fields
      await passwordInput.fill(newPassword);
      await confirmPasswordInput.fill(confirmPassword);
      
      // Toggle visibility multiple times
      const passwordToggleButton = page.locator('button').filter({ has: page.locator('svg') }).first();
      const confirmPasswordToggleButton = page.locator('button').filter({ has: page.locator('svg') }).nth(1);
      
      await passwordToggleButton.click();
      await confirmPasswordToggleButton.click();
      await passwordToggleButton.click();
      await confirmPasswordToggleButton.click();
      
      // Values should be preserved
      await expect(passwordInput).toHaveValue(newPassword);
      await expect(confirmPasswordInput).toHaveValue(confirmPassword);
    });
  });

  test.describe('Accessibility and User Experience', () => {
    test('should be keyboard accessible', async ({ page }) => {
      await authPage.goToLogin();
      
      const passwordInput = page.locator('[data-testid="password-input"]');
      const toggleButton = page.locator('[data-testid="toggle-password-visibility"]');
      
      // Fill password
      await passwordInput.fill(TEST_PASSWORD);
      
      // Navigate to toggle button using tab and activate with Enter
      await passwordInput.press('Tab');
      await page.keyboard.press('Enter');
      
      // Password should now be visible
      await expect(passwordInput).toHaveAttribute('type', 'text');
    });

    test('should work correctly on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await authPage.goToLogin();
      
      const passwordInput = page.locator('[data-testid="password-input"]');
      const toggleButton = page.locator('[data-testid="toggle-password-visibility"]');
      
      // Fill password
      await passwordInput.fill(TEST_PASSWORD);
      
      // Toggle should work on mobile
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
      
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('should have proper ARIA attributes', async ({ page }) => {
      await authPage.goToLogin();
      
      const toggleButton = page.locator('[data-testid="toggle-password-visibility"]');
      const eyeIcon = toggleButton.locator('svg');
      
      // Eye icon should have aria-hidden="true"
      await expect(eyeIcon).toHaveAttribute('aria-hidden', 'true');
      
      // Button should have proper title for screen readers
      await expect(toggleButton).toHaveAttribute('title');
    });
  });
});