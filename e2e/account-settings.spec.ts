import { test, expect } from '@playwright/test';
import { AuthPage } from './page-objects/auth.page';

test.describe('Account settings personal access tokens', () => {
  test.use({ viewport: { width: 1280, height: 600 } });

  test('creates and revokes a token from the Settings tab', async ({ page }) => {
    const email = process.env.E2E_USER_PROFILE_EMAIL;
    const password = process.env.E2E_USER_PROFILE_PASSWORD;
    test.skip(!email || !password, 'E2E profile credentials are required');

    let tokens: Array<Record<string, unknown>> = [];
    await page.route('**/api/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          profile: {
            username: 'playwright-user',
            display_name: 'Playwright User',
            avatar_url: null,
            credits: 5,
            linkedin: null,
            about: null
          }
        })
      });
    });
    await page.route('**/api/personal-access-tokens**', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (request.method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ tokens }) });
        return;
      }

      if (request.method() === 'POST' && url.pathname.endsWith('/revoke')) {
        const id = url.pathname.split('/').at(-2);
        tokens = tokens.map((token) => token.id === id ? { ...token, revoked_at: new Date().toISOString() } : token);
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: tokens.find((token) => token.id === id) }) });
        return;
      }

      const created = {
        id: `token-${Date.now()}`,
        name: 'Playwright MCP',
        token_prefix: 'kolium_pat_e2e12345',
        created_at: new Date().toISOString(),
        last_used_at: null,
        expires_at: null,
        revoked_at: null
      };
      tokens = [created, ...tokens];
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'kolium_pat_e2e-secret', personal_access_token: created })
      });
    });

    const authPage = new AuthPage(page);
    await authPage.goToLogin();
    await authPage.login(email!, password!);
    await authPage.expectLoggedIn();

    await page.locator('[data-testid="account-menu-button"]:visible').first().click();
    await page.getByTestId('my-profile-menu-item').click();
    const settingsTab = page.getByTestId('settings-tab');
    await expect(settingsTab).toBeVisible();
    await expect(settingsTab).toBeInViewport();
    await settingsTab.click();
    await expect(settingsTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('account-settings-panel')).toBeVisible();

    await page.getByLabel('Token name').fill('Playwright MCP');
    await page.getByTestId('generate-personal-access-token').click();
    await expect(page.getByLabel('New personal access token')).toHaveValue('kolium_pat_e2e-secret');
    await expect(page.getByTestId(/personal-access-token-row-/)).toContainText('Playwright MCP');

    await page.getByRole('button', { name: /Revoke Playwright MCP/i }).click();
    await expect(page.getByTestId(/personal-access-token-row-/)).toContainText(/Revoked or expired/i);
  });
});
