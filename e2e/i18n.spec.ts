import { test, expect } from '@playwright/test';
import { AuthPage } from './page-objects/auth.page';
import { AppPage } from './page-objects/app.page';

test.describe('Internationalization (i18n)', () => {
    test.use({ locale: 'en-US' });

    let appPage: AppPage;
    let authPage: AuthPage;

    test.beforeEach(async ({ page }) => {
        appPage = new AppPage(page);
        authPage = new AuthPage(page);
        // Clear local storage to start fresh
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();
    });

    test('should default to English and translate login page', async ({ page }) => {
        await authPage.goToLogin();
        // Check English text
        await expect(page.getByText('Sign In', { exact: true }).first()).toBeVisible();
        await expect(page.getByText('Don\'t have an account?')).toBeVisible();

        // Switch to Spanish
        const toggle = page.getByTestId('language-toggle').filter({ visible: true }).first();
        await toggle.click();

        // Verify Spanish text
        await expect(page.getByText('Iniciar Sesión').first()).toBeVisible();
        await expect(page.getByText('¿No tienes una cuenta?')).toBeVisible();
    });

    test('should persist language selection after reload', async ({ page }) => {
        await authPage.goToLogin();

        // Switch to Spanish
        const toggle = page.getByTestId('language-toggle').filter({ visible: true }).first();
        await toggle.click();
        await expect(page.getByText('Iniciar Sesión').first()).toBeVisible();

        // Reload page
        await page.reload();

        // Verify still in Spanish
        await expect(page.getByText('Iniciar Sesión').first()).toBeVisible();
        await expect(page.getByTitle('Switch to English').filter({ visible: true }).first()).toBeVisible();
    });

    test('should translate Board and Tree views', async ({ page }) => {
        // We might need to login or use a public path if available
        // Assuming the app is accessible or we login here
        await appPage.goto();
        const toggle = page.getByTestId('language-toggle').filter({ visible: true }).first();

        // Switch to Spanish
        await toggle.click();

        // Verify Board View translations (column headers are always there)
        await expect(page.getByText('Pendiente').first()).toBeVisible(); // "Open" in ES
        await expect(page.getByText('En Progreso').first()).toBeVisible(); // "In Progress" in ES
        await expect(page.getByText('Completado').first()).toBeVisible(); // "Done" in ES

        // Switch to Tree View
        await appPage.switchToView('tree');

        // Verify Tree View header/actions (always visible)
        await expect(page.getByText('Tareas').first()).toBeVisible(); // "Tasks" in ES (nav.tasks)
    });
});
