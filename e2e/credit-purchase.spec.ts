import { test, expect } from '@playwright/test';
import { AuthPage } from './page-objects/auth.page';
import { AppPage } from './page-objects/app.page';

test.describe('Credit Purchase Flow', () => {
    let authPage: AuthPage;
    let appPage: AppPage;

    const testUser = {
        email: process.env.E2E_TEST_USER_EMAIL || '',
        password: process.env.E2E_TEST_USER_PASSWORD || ''
    };

    test.beforeAll(async () => {
        if (!testUser.email) {
            console.warn('Skipping credit purchase test: Missing credentials');
            test.skip();
        }
    });

    test('should navigate to pricing from Buy Credits button in profile modal', async ({ page }) => {
        authPage = new AuthPage(page);
        appPage = new AppPage(page);

        // Login
        await authPage.goToLogin();
        await authPage.login(testUser.email, testUser.password);
        await authPage.expectLoggedIn();

        // Open Profile Modal
        await appPage.accountMenu.click();
        await page.getByTestId('my-profile-menu-item').click();

        // Wait for modal
        await expect(page.getByTestId('my-profile-modal')).toBeVisible();

        // Click Buy Credits button
        await page.getByTestId('buy-credits-button').click();

        // Verify navigation to pricing page
        await expect(page).toHaveURL(/\/pricing/);
    });

    test('should navigate to pricing from Upgrade Plan button in profile modal', async ({ page }) => {
        authPage = new AuthPage(page);
        appPage = new AppPage(page);

        // Login
        await authPage.goToLogin();
        await authPage.login(testUser.email, testUser.password);
        await authPage.expectLoggedIn();

        // Open Profile Modal
        await appPage.accountMenu.click();
        await page.getByTestId('my-profile-menu-item').click();

        // Wait for modal
        await expect(page.getByTestId('my-profile-modal')).toBeVisible();

        // Verify Current Plan shows "Starter Plan"
        const currentPlanInput = page.locator('input[id="current-plan"]');
        await expect(currentPlanInput).toBeVisible();
        await expect(currentPlanInput).toHaveValue(/Starter Plan|Plan Inicial/); // English or Spanish

        // Click Upgrade Plan button
        await page.getByTestId('upgrade-plan-button').click();

        // Verify navigation to pricing page
        await expect(page).toHaveURL(/\/pricing/);
    });

    test('should display Buy Credits and Upgrade Plan buttons together', async ({ page }) => {
        authPage = new AuthPage(page);
        appPage = new AppPage(page);

        // Login
        await authPage.goToLogin();
        await authPage.login(testUser.email, testUser.password);
        await authPage.expectLoggedIn();

        // Open Profile Modal
        await appPage.accountMenu.click();
        await page.getByTestId('my-profile-menu-item').click();

        // Wait for modal
        await expect(page.getByTestId('my-profile-modal')).toBeVisible();

        // Verify both buttons are present
        await expect(page.getByTestId('buy-credits-button')).toBeVisible();
        await expect(page.getByTestId('upgrade-plan-button')).toBeVisible();

        // Verify they have appropriate icons and text
        const buyCreditsBtn = page.getByTestId('buy-credits-button');
        await expect(buyCreditsBtn).toContainText(/Buy Credits|Comprar Créditos/);

        const upgradePlanBtn = page.getByTestId('upgrade-plan-button');
        await expect(upgradePlanBtn).toContainText(/Upgrade Plan|Mejorar Plan/);
    });
});
