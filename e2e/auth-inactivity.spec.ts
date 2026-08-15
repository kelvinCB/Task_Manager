import { test, expect } from '@playwright/test';
import { AuthPage } from './page-objects/auth.page';

test.describe('Authentication inactivity timeout', () => {
  test('redirects an inactive session to login', async ({ page }) => {
    const email = process.env.E2E_USER_AUTH_EMAIL;
    const password = process.env.E2E_USER_AUTH_PASSWORD;
    test.skip(!email || !password, 'E2E auth credentials are required');

    const authPage = new AuthPage(page);
    await authPage.goToLogin();
    await authPage.login(email!, password!);
    await authPage.expectLoggedIn();

    await page.evaluate(() => {
      const authStorageKey = Object.keys(localStorage).find((key) => key.endsWith('-auth-token'));
      if (!authStorageKey) {
        throw new Error('Supabase session was not persisted in localStorage');
      }

      const session = JSON.parse(localStorage.getItem(authStorageKey) || '{}');
      localStorage.setItem('kolium:auth:last-activity', JSON.stringify({
        userId: session.user?.id,
        timestamp: Date.now() - (24 * 60 * 60 * 1000)
      }));
    });

    await page.reload();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId('login-button')).toBeVisible();
  });
});
