import { test, expect } from '@playwright/test';
import { AuthPage } from './page-objects/auth.page';
import { AppPage } from './page-objects/app.page';

const TEST_EMAIL = process.env.E2E_USER_AUTH_EMAIL;
const TEST_PASSWORD = process.env.E2E_USER_AUTH_PASSWORD;

test.describe('Help System E2E', () => {
    let authPage: AuthPage;
    let appPage: AppPage;

    test.beforeEach(async ({ page }) => {
        authPage = new AuthPage(page);
        appPage = new AppPage(page);

        // Login
        await authPage.goToLogin();
        await authPage.login(TEST_EMAIL!, TEST_PASSWORD!);
        await authPage.expectLoggedIn();
    });

    test('should show Help FAB only when logged in', async ({ page }) => {
        const fab = page.locator('#help-fab');
        await expect(fab).toBeVisible();

        // Logout
        await authPage.logout();
        await expect(fab).not.toBeVisible();
    });

    test('should open and close the help panel', async ({ page }) => {
        const fab = page.locator('#help-fab');
        await fab.click();
        await expect(page.getByTestId('help-panel')).toBeVisible();

        // Close panel
        await page.getByLabel('Close help panel').click();
        await expect(page.getByTestId('help-panel')).not.toBeVisible();
    });

    test('should display FAQs', async ({ page }) => {
        await page.locator('#help-fab').click();

        // Default tab is FAQ
        await expect(page.locator('text=FAQ')).toBeVisible();
        await expect(page.locator('text=How do I create a new task?')).toBeVisible();
        await expect(page.locator('text=How is time tracked?')).toBeVisible();
    });

    test('should submit a bug report', async ({ page }) => {
        await page.locator('#help-fab').click();

        // Switch to Bug tab
        await page.getByRole('button', { name: 'Bug' }).click();

        // Wait for tab switch and effect to clear input
        // Wait for tab switch and effect to clear input (increased for stability in CI)
        await page.waitForTimeout(2000);

        // Wait for input to be ready
        const bugInput = page.getByPlaceholder('Describe the bug you found...');
        await expect(bugInput).toBeVisible();
        await expect(bugInput).toBeEmpty();

        // Fill form
        const description = `E2E Bug Report ${Date.now()}`;
        await bugInput.fill(description);

        // Submit
        await page.getByRole('button', { name: 'Submit' }).click();

        // Verify success message (inline)
        await expect(page.getByTestId('success-message')).toBeVisible();
        await expect(page.getByTestId('success-message')).toHaveText(/Your report has been sent/);

        // Panel should remain open
        await expect(page.getByTestId('help-panel')).toBeVisible();
    });

    test('should submit a feature request', async ({ page }) => {
        await page.locator('#help-fab').click();

        // Switch to Feature tab
        await page.getByRole('button', { name: 'Feature' }).click();

        // Wait for tab switch and effect to clear input
        // Wait for tab switch and effect to clear input (increased for stability in CI)
        await page.waitForTimeout(2000);

        // Wait for input to be ready
        const featureInput = page.getByPlaceholder('What new feature or improvement would you like to see? We will build it for you!');
        await expect(featureInput).toBeVisible();
        await expect(featureInput).toBeEmpty();

        // Fill form
        const description = `E2E Feature Request ${Date.now()}`;
        await featureInput.fill(description);

        // Change priority
        await page.getByRole('button', { name: 'High' }).click();

        // Submit
        await page.getByRole('button', { name: 'Submit' }).click();

        // Verify success message (inline)
        await expect(page.getByTestId('success-message')).toBeVisible();
        await expect(page.getByTestId('success-message')).toHaveText(/Your report has been sent/);

        // Panel should remain open
        await expect(page.getByTestId('help-panel')).toBeVisible();

        // Description should be cleared
        await expect(page.getByPlaceholder('What new feature or improvement would you like to see? We will build it for you!')).toBeEmpty();
    });

    test('should be accessible on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });

        const fab = page.locator('#help-fab');
        await expect(fab).toBeVisible();

        await fab.click();
        await expect(page.locator('text=Help & Feedback')).toBeVisible();

        // Close panel
        await page.locator('button').filter({ has: page.locator('svg.lucide-x') }).click();
        await expect(page.locator('text=Help & Feedback')).not.toBeVisible();
    });
});
