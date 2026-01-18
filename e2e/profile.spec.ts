import { test, expect } from '@playwright/test';
import { AuthPage } from './page-objects/auth.page';
import { AppPage } from './page-objects/app.page';

test.describe('My Profile Features', () => {
    let authPage: AuthPage;
    let appPage: AppPage;

    test.beforeEach(async ({ page }) => {
        authPage = new AuthPage(page);
        appPage = new AppPage(page);

        // Robust Login
        await authPage.goToLogin();
        const email = process.env.E2E_USER_PROFILE_EMAIL || 'profile-test@example.com';
        const password = process.env.E2E_USER_PROFILE_PASSWORD || 'password123';
        await authPage.login(email, password);
        await authPage.expectLoggedIn();
    });

    test('should display and update user profile fields and credits', async ({ page }) => {
        // 1. Open Profile Modal
        await page.click('[data-testid="account-menu-button"]');
        await page.click('[data-testid="my-profile-menu-item"]');

        // 2. Verify Modal and Read-only fields
        const modal = page.getByTestId('my-profile-modal');
        await expect(modal).toBeVisible();

        await expect(page.getByLabel('Email')).toBeDisabled();
        await expect(page.getByLabel('Username')).toBeDisabled();
        await expect(page.getByLabel('Credits')).toBeDisabled();

        // Verify Credits Value
        const creditsValue = await page.getByLabel('Credits').inputValue();
        expect(parseInt(creditsValue)).toBeGreaterThanOrEqual(0);

        // 3. Update Profile Fields
        const timestamp = Date.now();
        const newName = `User ${timestamp}`;
        const newLinkedin = 'https://linkedin.com/in/testuser';
        const newAbout = 'This is a test bio updated by E2E tests.';

        await page.getByLabel('Full Name').fill(newName);
        await page.getByLabel('LinkedIn').fill(newLinkedin);
        await page.getByLabel('About').fill(newAbout);

        // 4. Save Changes
        await page.getByRole('button', { name: 'Save Changes' }).click();

        // 5. Verify success toast and modal close
        await expect(page.getByText('Profile updated successfully')).toBeVisible({ timeout: 15000 });
        await expect(modal).toBeHidden();

        // 6. Re-open Modal and verify persistence
        await page.click('[data-testid="account-menu-button"]');
        await page.click('[data-testid="my-profile-menu-item"]');

        await expect(modal).toBeVisible();
        await expect(page.getByLabel('Full Name')).toHaveValue(newName);
        await expect(page.getByLabel('LinkedIn')).toHaveValue(newLinkedin);
        await expect(page.getByLabel('About')).toHaveValue(newAbout);
    });


});
