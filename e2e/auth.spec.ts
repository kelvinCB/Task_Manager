import { test, expect } from '@playwright/test';
import { AuthPage } from './page-objects/auth.page';
import { AppPage } from './page-objects/app.page';

// Test credentials
const TEST_EMAIL = 'automation-tasklite-001@yopmail.com';
const TEST_PASSWORD = 'Automation123';
const INVALID_EMAIL = 'invalid.email';
const INVALID_PASSWORD = '123'; // Too short

// Function to generate random email with the required pattern
const generateRandomEmail = () => {
  const randomNumber = Math.floor(10000 + Math.random() * 90000); // 5-digit random number
  return `automation-tasklite-${randomNumber}@yopmail.com`;
};

test.describe('Authentication E2E Tests', () => {
  test.use({ viewport: { width: 1280, height: 720 } });
  let authPage: AuthPage;
  let appPage: AppPage;

  // Create new instances for each test
  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    appPage = new AppPage(page);
  });

  test.describe('Scenario 1: Login through Account Menu', () => {
    test('User can access login from My Account and successfully log in', async ({ page }) => {
      // Access login from Account menu
      await authPage.loginViaAccountMenu();
      
      // Verify visual elements of the page
      await authPage.expectGradientBackground();
      await authPage.expectSocialLoginButtons();
      
      // Perform login with correct credentials
      await authPage.login(TEST_EMAIL, TEST_PASSWORD);
      
      // Verify redirection to dashboard and logged in state
      await expect(page).toHaveURL('/');
      await authPage.expectLoggedIn();
    });
    
    test('Shows error when credentials are incorrect', async ({ page }) => {
      await authPage.goToLogin();
      await authPage.login(TEST_EMAIL, 'contraseña-incorrecta');
      
      // Verificar mensaje de error
      await authPage.expectLoginError('Invalid login credentials');
    });

    test('Form validation - required fields', async ({ page }) => {
      await authPage.goToLogin();
      
      // Try to submit empty form
      await page.click('[data-testid="login-button"]');
      
      // Verify browser validation (required fields)
      await authPage.expectFormValidationError();
    });

    test('Email format validation', async ({ page }) => {
      await authPage.goToLogin();
      
      // Email with invalid format
      await authPage.login(INVALID_EMAIL, TEST_PASSWORD);
      
      // Verify browser validation or error message
      await authPage.expectFormValidationError();
    });

    test('Navigation to register page', async ({ page }) => {
      await authPage.goToLogin();
      await authPage.goToRegisterFromLogin();
      await expect(page).toHaveURL('/register');
    });

    test('Verify existence of "Forgot password" link', async ({ page }) => {
      await authPage.goToLogin();
      await expect(page.locator('text="Don\'t remember your password?"')).toBeVisible();
    });
  });

  test.describe('Scenario 2: Logout from account', () => {
    test.beforeEach(async ({ page }) => {
      // Login before each test in this group
      await authPage.goToLogin();
      await authPage.login(TEST_EMAIL, TEST_PASSWORD);
      await authPage.expectLoggedIn();
    });
    
    test('User can logout successfully', async ({ page }) => {
      // Perform logout
      await page.waitForSelector('[data-testid="account-menu-button"]', { state: 'visible', timeout: 5000 });
      await authPage.logout();
      
      // Verify logged out state
      await authPage.expectLoggedOut();
    });
  });

  test.describe('Scenario 3: Registration of new users', () => {
    test('User can register successfully', async ({ page }) => {
      await authPage.goToRegister();
      
      // Verify visual elements of the page
      await authPage.expectGradientBackground();
      await authPage.expectSocialRegisterButtons();
      
      // Try registration with multiple emails if needed
      let success = false;
      let attempts = 0;
      const maxAttempts = 5;
      
      while (!success && attempts < maxAttempts) {
        const randomEmail = generateRandomEmail();
        await authPage.register(randomEmail, TEST_PASSWORD);
        
        // Check if we got an error for existing email
        const errorLocator = page.locator('[data-testid="error-message"]');
        const hasError = await errorLocator.isVisible();
        
        if (hasError) {
          const errorText = await errorLocator.textContent();
          if (errorText && (errorText.includes('Email already in use') || errorText.includes('User already registered'))) {
            console.log(`Email ${randomEmail} already exists, trying another one...`);
            attempts++;
            continue;
          }
        }
        
        // If no error about existing email, we should be successful
        success = true;
        
        // Verify success and redirection
        await authPage.expectRegistrationSuccess();
      }
      
      if (!success) {
        throw new Error(`Failed to register after ${maxAttempts} attempts with different emails`);
      }
    });
    
    test('Form validation - required fields', async ({ page }) => {
      await authPage.goToRegister();
      
      // Try to submit empty form
      await authPage.page.click('[data-testid="register-button"]');
      
      // Verify browser validation (required fields)
      await authPage.expectFormValidationError();
    });

    test('Password validation - minimum 6 characters', async ({ page }) => {
      await authPage.goToRegister();
      
      // Password too short with a random email
      const randomEmail = generateRandomEmail();
      await authPage.register(randomEmail, INVALID_PASSWORD);
      
      // Verify error message
      await authPage.expectRegistrationError('Password should be at least 6 characters');
    });
    
    test('Error when registering existing email', async ({ page }) => {
      await authPage.goToRegister();
      
      // Use email that already exists - we know this one exists
      await authPage.register(TEST_EMAIL, TEST_PASSWORD);
      
      // Supabase may be configured to not reveal if an email exists (security feature)
      // Check if we got an error message OR if we were redirected (Supabase security behavior)
      const errorLocator = page.locator('[data-testid="error-message"]');
      const hasError = await errorLocator.isVisible().catch(() => false);
      
      if (hasError) {
        // If error is shown, verify it mentions the user already exists or email is not confirmed (common Supabase response)
        const errorMessage = page.locator('[data-testid="error-message"]');
        await expect(errorMessage).toContainText(/User already registered|Email not confirmed/);
      } else {
        // If no error shown, Supabase is configured for security (no email enumeration)
        // It will show the success modal (same as new registration)
        
        // Use the shared method to handle modal interaction
        await authPage.expectRegistrationSuccess();
      }
    });

    test('Navigation to login page', async ({ page }) => {
      await authPage.goToRegister();
      await authPage.goToLoginFromRegister();
      await expect(page).toHaveURL('/login');
    });
  });
});
