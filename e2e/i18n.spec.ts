import { test, expect } from '@playwright/test';
import { AuthPage } from './page-objects/auth.page';

test.describe('Internationalization (i18n)', () => {
    test.use({ locale: 'en-US' });

    let authPage: AuthPage;

    test.beforeEach(async ({ page }) => {
        authPage = new AuthPage(page);
        await authPage.goToLogin();
        // Assuming simple login or just checking public pages first
    });

    test('should default to English', async ({ page }) => {
        // Check English text on Login page
        await expect(page.getByText('Sign In', { exact: true }).first()).toBeVisible();
        await expect(page.getByText('Don\'t have an account?')).toBeVisible();
    });

    test('should switch language to Spanish and persist', async ({ page }) => {
        // Check initial state (English)
        const toggle = page.getByLabel('Toggle language');
        await expect(toggle).toBeVisible();

        // Switch to Spanish
        await toggle.click();

        // Verify Spanish text on Login page
        await expect(page.getByTitle('Switch to English')).toBeVisible();
        // Note: The text might take a brief moment to update, expect usually retries
        await expect(page.getByText('Iniciar Sesión').first()).toBeVisible(); // "Sign In" in ES
        await expect(page.getByText('¿No tienes una cuenta?')).toBeVisible(); // "Don't have an account?" in ES

        // Reload page to test persistence
        await page.reload();

        // Verify still Spanish
        await expect(page.getByText('Iniciar Sesión').first()).toBeVisible();
        await expect(page.getByLabel('Toggle language')).toBeVisible();
    });
});
