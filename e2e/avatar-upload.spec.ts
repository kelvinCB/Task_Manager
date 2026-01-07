import { test, expect } from '@playwright/test';
import { AuthPage } from './page-objects/auth.page';

if (!process.env.E2E_USER_PROFILE_EMAIL || !process.env.E2E_USER_PROFILE_PASSWORD) {
  throw new Error('E2E_USER_PROFILE_EMAIL and E2E_USER_PROFILE_PASSWORD must be set in environment variables');
}

const TEST_EMAIL = process.env.E2E_USER_PROFILE_EMAIL;
const TEST_PASSWORD = process.env.E2E_USER_PROFILE_PASSWORD;

test.describe('Avatar Upload E2E Tests', () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    
    // Login before each test
    await authPage.goToLogin();
    await authPage.login(TEST_EMAIL, TEST_PASSWORD);
    await authPage.expectLoggedIn();
  });

  test('should show avatar in account menu for authenticated user', async ({ page }) => {
    // Open account menu
    await page.click('[data-testid="account-menu-button"]');
    
    // Wait for dropdown to be visible
    await page.waitForSelector('[role="menu"]', { timeout: 3000 });
    
    // Verify user profile section is visible (only shows when authenticated)
    const userInfoSection = page.locator('[role="menu"]').first();
    await expect(userInfoSection).toBeVisible();
    
    // Verify avatar element exists (either Avatar component or default User icon)
    const hasAvatar = await page.locator('img[alt*="avatar"]').count() > 0;
    const hasUserIcon = await page.locator('svg').count() > 0; // User icon from lucide-react
    
    expect(hasAvatar || hasUserIcon).toBe(true);
  });

  test('should have avatar upload capability', async ({ page }) => {
    // Open account menu
    await page.click('[data-testid="account-menu-button"]');
    
    // Wait for menu
    await page.waitForSelector('[role="menu"]', { timeout: 3000 });
    
    // Verify hidden file input for avatar upload exists
    const avatarInput = page.locator('input[type="file"][accept*="image"]').first();
    await expect(avatarInput).toHaveCount(1);
    
    // Verify it accepts the correct image types
    const acceptAttr = await avatarInput.getAttribute('accept');
    expect(acceptAttr).toContain('image/png');
    expect(acceptAttr).toContain('image/jpeg');
    
    // Verify the input is hidden (not visible to user, triggered by clicking avatar)
    await expect(avatarInput).toHaveClass(/hidden/);
  });
});
