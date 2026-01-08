import { Page, expect, Locator } from '@playwright/test';

export class AuthPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Navigation
  async goToLogin() {
    await this.page.goto('/login');
    await expect(this.page).toHaveURL('/login');
  }

  async goToRegister() {
    await this.page.goto('/register');
    await expect(this.page).toHaveURL('/register');
  }

  // Login actions
  async login(email: string, password: string) {
    await this.page.locator('[data-testid="email-input"]').fill(email);
    await this.page.locator('[data-testid="password-input"]').fill(password);
    await this.page.locator('[data-testid="login-button"]').click();
    // Wait for auth state to propagate
    await this.page.waitForTimeout(1000);
  }

  async loginViaAccountMenu() {
    await this.page.goto('/');
    // Use :visible to handle multiple account menu buttons (desktop/mobile)
    await this.page.locator('[data-testid="account-menu-button"]:visible').click();
    await this.page.click('[data-testid="login-button-menu"]');
    await expect(this.page).toHaveURL('/login');
  }

  async logout() {
    // Find the visible AccountMenu button
    const accountMenuButton = this.page.locator('[data-testid="account-menu-button"]:visible');

    // Check if the menu is already open before clicking
    const logoutButtonBeforeClick = this.page.locator('[data-testid="logout-button"]');
    const isMenuAlreadyOpen = await logoutButtonBeforeClick.count() > 0 && await logoutButtonBeforeClick.isVisible().catch(() => false);

    if (!isMenuAlreadyOpen) {
      await accountMenuButton.click();
    }

    // Wait for logout button and click it
    const logoutButton = this.page.locator('[data-testid="logout-button"]');

    try {
      await expect(logoutButton).toBeVisible({ timeout: 10000 });
      await logoutButton.click({ timeout: 10000 });

      // Wait for logout to complete - check URL change or logout button disappearance
      let logoutCompleted = false;
      for (let i = 0; i < 20; i++) { // 20 iterations = 10 seconds
        await this.page.waitForTimeout(500);

        const currentUrl = this.page.url();
        const logoutButtonStillExists = await logoutButton.count() > 0 && await logoutButton.isVisible().catch(() => false);

        // If URL changed to login or logout button disappeared, logout was successful
        if (currentUrl.includes('/login') || !logoutButtonStillExists) {
          logoutCompleted = true;
          break;
        }
      }

      if (!logoutCompleted) {
        throw new Error('Logout did not complete - page did not redirect and button did not disappear');
      }

    } catch (logoutWaitError) {
      // Try to find alternative logout buttons
      const logoutAlt = this.page.getByText(/logout|cerrar sesi(o|ó)n/i);
      const altExists = await logoutAlt.count() > 0;

      if (altExists) {
        await logoutAlt.click({ timeout: 30000 });
      } else {
        // If not authenticated, maybe menu shows login instead of logout
        const loginButtonInMenu = this.page.locator('[data-testid="login-button-menu"]');
        const hasLoginButton = await loginButtonInMenu.count() > 0;

        if (hasLoginButton) {
          // User is already logged out
          return;
        } else {
          throw new Error('Logout button not found after alternative attempts');
        }
      }
    }
  }

  // Registration actions
  async register(email: string, password: string) {
    await this.page.locator('[data-testid="email-input"]').fill(email);
    await this.page.locator('[data-testid="password-input"]').fill(password);
    await this.page.locator('[data-testid="register-button"]').click();
  }

  // Navigation between authentication pages
  async goToRegisterFromLogin() {
    await this.page.click('[data-testid="signup-link"]');
    await expect(this.page).toHaveURL('/register');
  }

  async goToLoginFromRegister() {
    await this.page.click('[data-testid="signin-link"]');
    await expect(this.page).toHaveURL('/login');
  }

  async clickForgotPassword() {
    await this.page.click('text="Don\'t remember your password?"');
    // Password recovery is not currently implemented
  }

  // Verifications
  async expectLoggedIn() {
    // Wait for login to complete - try multiple potential landing URLs
    try {
      await this.page.waitForURL(/\//, { timeout: 15000 });
    } catch (error) {
      // If waiting for URL fails, check if we're already on a valid page
      const currentUrl = this.page.url();
      if (!currentUrl.includes('/login') && !currentUrl.includes('/register')) {
        // We might already be on the right page, continue with verification
      } else {
        throw new Error(`Login did not redirect properly. Current URL: ${currentUrl}`);
      }
    }

    // Wait for the account menu button to appear after login
    const accountMenuButton = this.page.locator('[data-testid="account-menu-button"]:visible');
    await expect(accountMenuButton).toBeVisible({ timeout: 15000 });

    // Short pause to ensure UI is interactive
    await this.page.waitForTimeout(2000); // Increased from 500 to 2000
    const isExpanded = await accountMenuButton.getAttribute('aria-expanded') === 'true';

    if (!isExpanded) {
      await accountMenuButton.click();
      // Wait for animation/render
      await this.page.waitForTimeout(500);
    }

    const logoutButton = this.page.locator('[data-testid="logout-button"]');
    const logoutExists = await logoutButton.count() > 0;

    if (logoutExists) {
      const isVisible = await logoutButton.isVisible();

      if (!isVisible) {
        // If still not visible (maybe animation), wait
        await logoutButton.waitFor({ state: 'visible', timeout: 2000 }).catch(() => { });

        const isVisibleAfterWait = await logoutButton.isVisible();
        if (!isVisibleAfterWait) {
          // Try clicking again if it failed to open
          if (!isExpanded) await accountMenuButton.click();
        }
      }

      // Verify using expect so test fails properly if not visible
      await expect(logoutButton).toBeVisible({ timeout: 5000 });
    } else {
      // Look for other elements that confirm logged in state
      const userNameOrAvatar = this.page.locator('[data-testid="user-avatar"], [data-testid="user-name"]');
      const hasUserIndicator = await userNameOrAvatar.count() > 0;

      if (!hasUserIndicator) {
        throw new Error('No logged in session indicators found');
      }
    }

    // Close the menu only if we opened it (to restore state)
    // Or just always close it to be safe for subsequent steps
    if (await accountMenuButton.getAttribute('aria-expanded') === 'true') {
      await this.page.keyboard.press('Escape');
      // If escape didn't work (e.g. focus issue), click again
      if (await accountMenuButton.getAttribute('aria-expanded') === 'true') {
        await accountMenuButton.click();
      }
    }
  }

  async expectLoggedOut() {
    const currentUrl = this.page.url();

    // Check if we are on a public page (login, register, landing page)
    const isPublicPage = currentUrl.includes('/login') ||
      currentUrl.includes('/register') ||
      currentUrl.endsWith('/') ||
      new URL(currentUrl).pathname === '/';

    // Check if there's a login button in the menu
    const loginButtonMenu = this.page.locator('[data-testid="login-button-menu"]');
    let loginButtonExists = await loginButtonMenu.count() > 0;

    // If we don't find the login button in the menu, try opening the menu first
    if (!loginButtonExists) {
      const menuButton = this.page.locator('[data-testid="account-menu-button"]:visible');
      if (await menuButton.count() > 0) {
        await menuButton.click();
        // Check again if the login button appears
        loginButtonExists = await loginButtonMenu.count() > 0;
      }
    }

    // Check other signals that the user is logged out
    const loginForm = this.page.locator('form').filter({ hasText: 'login' });
    const hasLoginForm = await loginForm.count() > 0;

    // Look for registration or login links
    const registerOrLoginLinks = this.page.getByRole('link').filter({
      hasText: /sign up|sign in|register|login/i
    });
    const hasAuthLinks = await registerOrLoginLinks.count() > 0;

    // Check absence of logged-in user indicators
    const userIndicators = this.page.locator('[data-testid="user-name"], [data-testid="user-avatar"]');
    const noUserIndicators = (await userIndicators.count()) === 0;

    // Check that logout button is not present
    let logoutButtonPresent = false;
    try {
      const logoutButton = this.page.locator('[data-testid="logout-button"]');
      logoutButtonPresent = await logoutButton.isVisible({ timeout: 1000 }).catch(() => false);
    } catch (e) {
      // Ignore errors, just checking
    }

    // Determine if user is effectively logged out
    const isLoggedOut = loginButtonExists || hasLoginForm || hasAuthLinks ||
      (isPublicPage && noUserIndicators && !logoutButtonPresent);

    if (!isLoggedOut) {
      throw new Error('Insufficient logged out state indicators found');
    }

    // Use expect so test fails if condition is not met
    if (loginButtonExists) {
      await expect(loginButtonMenu).toBeVisible({ timeout: 5000 });
    } else if (hasLoginForm) {
      await expect(loginForm).toBeVisible();
    } else {
      // If none of the previous verifications are valid but we're on a public page,
      // we consider it sufficient to verify logged out state
      expect(isPublicPage).toBeTruthy();
    }
  }

  async expectLoginError(errorMessage: string) {
    await expect(this.page.locator('[data-testid="error-message"]')).toContainText(errorMessage);
  }

  async expectRegistrationSuccess() {
    // Wait for Success Modal
    const modalTitle = this.page.getByText('Verify your email');
    await expect(modalTitle).toBeVisible({ timeout: 10000 });

    // Verify description
    await expect(this.page.getByText('Your account has been created')).toBeVisible();

    // Click Go to Login
    const goToLoginBtn = this.page.getByText('Go to Login');
    await goToLoginBtn.click();

    // Verify redirection to login
    await expect(this.page).toHaveURL('/login');
  }

  async expectRegistrationError(errorMessage: string) {
    await expect(this.page.locator('[data-testid="error-message"]')).toContainText(errorMessage);
  }

  async expectFormValidationError() {
    // Check for invalid inputs
    const invalidInputs = this.page.locator('input:invalid');
    const count = await invalidInputs.count();

    // Check for backend error messages
    const errorMessage = this.page.locator('[data-testid="error-message"]');
    const hasErrorMessage = await errorMessage.isVisible().catch(() => false);

    if (hasErrorMessage) {
      const errorText = await errorMessage.textContent();

      // If there's an error message, verify it's relevant
      if (errorText && (errorText.includes('Invalid email format') || errorText.includes('email') || errorText.includes('required'))) {
        await expect(errorMessage).toBeVisible();
        return;
      }
    }

    // If there are multiple invalid inputs, check them
    if (count > 1) {
      await expect(invalidInputs.first()).toBeVisible();
    } else if (count === 1) {
      // Exactly one invalid input
      await expect(invalidInputs.first()).toBeVisible();
    } else {
      // If no invalid inputs or error messages, look for other validations
      const form = this.page.locator('form');
      const hasNoValidate = await form.getAttribute('novalidate').catch(() => null);

      // Try to verify if the email input is marked as invalid
      const emailInput = this.page.locator('[data-testid="email-input"]');
      const emailValue = await emailInput.inputValue();
      const emailValid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);

      if (!emailValid) {
        // Don't throw error, consider validation works
        return;
      }

      throw new Error('No invalid inputs or error messages found for form validation');
    }
  }

  // Verify visual elements
  async expectSocialLoginButtons() {
    await expect(this.page.locator('[data-testid="google-login"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="github-login"]')).toBeVisible();
  }

  async expectSocialRegisterButtons() {
    // Los botones sociales usan los mismos data-testid en login y registro
    await expect(this.page.locator('[data-testid="google-login"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="github-login"]')).toBeVisible();
  }

  async expectGradientBackground() {
    const rootElement = this.page.locator('.bg-gradient-to-br');
    await expect(rootElement).toBeVisible();
    // Verify specific gradient classes if necessary
    await expect(rootElement).toHaveClass(/from-indigo-\d+/);
  }
}
