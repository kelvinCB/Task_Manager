import { test, expect } from '@playwright/test';
import { AuthPage } from './page-objects/auth.page';
import { AppPage } from './page-objects/app.page';

test.describe('My Profile Modal', () => {
    let authPage: AuthPage;
    let appPage: AppPage;

    const testUser = {
        email: process.env.E2E_USER_PROFILE_EMAIL || '',
        password: process.env.E2E_USER_PROFILE_PASSWORD || ''
    };

    test.beforeAll(async () => {
        if (!testUser.email) {
            console.warn('Skipping profile test: Missing credentials');
            test.skip();
        }
    });

    test('should display all profile fields correctly', async ({ page }) => {
        authPage = new AuthPage(page);
        appPage = new AppPage(page);

        // Login
        await authPage.goToLogin();
        await authPage.login(testUser.email, testUser.password);
        await authPage.expectLoggedIn();

        // Open Profile Menu -> My Profile
        await appPage.accountMenu.click();
        await page.click('text=My Profile'); // Adjust selector based on AccountMenu implementation

        // Verify Modal matches screenshot or fields
        const modal = page.locator('div[role="dialog"]');
        await expect(modal).toBeVisible();
        await expect(modal).toContainText('My Profile');

        // Verify Fields presence
        await expect(page.locator('label:has-text("Full Name")')).toBeVisible();
        await expect(page.locator('input[id="displayName"]')).toBeVisible();

        await expect(page.locator('label:has-text("Email")')).toBeVisible();
        await expect(page.locator('input[id="email"]')).toBeVisible();

        await expect(page.locator('label:has-text("Username")')).toBeVisible();
        await expect(page.locator('input[id="username"]')).toBeVisible();

        await expect(page.locator('label:has-text("Remaining credits")')).toBeVisible();
        await expect(page.locator('input[id="credits"]')).toBeVisible();

        await expect(page.locator('label:has-text("LinkedIn Profile")')).toBeVisible();
        await expect(page.locator('input[id="linkedin"]')).toBeVisible();

        await expect(page.locator('label:has-text("About")')).toBeVisible();
        await expect(page.locator('textarea[id="about"]')).toBeVisible(); // Adjust selector

        // Close modal
        await page.keyboard.press('Escape');
    });
});
