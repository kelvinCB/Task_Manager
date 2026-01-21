import { test, expect } from '@playwright/test';

test.describe('Pricing Page', () => {
    test.beforeEach(async ({ page }) => {
        // We can test this as a public page first if it doesn't require auth
        await page.goto('/pricing');
    });

    test('should render pricing page components correctly', async ({ page }) => {
        // Check title
        await expect(page.getByText('Upgrade your productivity')).toBeVisible();

        // Check plans
        await expect(page.getByText('Starter', { exact: true })).toBeVisible();
        await expect(page.getByText('Professional', { exact: true })).toBeVisible();
        await expect(page.getByText('Enterprise', { exact: true })).toBeVisible();

        // Check pricing toggle
        await expect(page.getByLabel('Annual billing')).toBeVisible();
    });

    test('should show FAQ section', async ({ page }) => {
        await expect(page.getByText('Frequently Asked Questions')).toBeVisible();
        await expect(page.getByText('Can I switch plans later?')).toBeVisible();
    });

    test('should allow navigation back', async ({ page }) => {
        // Build history stack
        await page.goto('/');
        await page.goto('/pricing');
        
        await expect(page.getByText('Back')).toBeVisible();
        await page.getByText('Back').click();
        
        // Should return to dashboard/login
        await expect(page).not.toHaveURL(/\/pricing/);
    });

    test('should navigate to pricing from dashboard account menu', async ({ page }) => {
        // Need to login first for account menu
        await page.goto('/login');
        await page.getByPlaceholder('Email').fill(process.env.E2E_TEST_USER_EMAIL || 'test@example.com');
        await page.getByPlaceholder('Password').fill(process.env.E2E_TEST_USER_PASSWORD || 'password123');
        await page.getByRole('button', { name: /sign in/i }).click();

        // Wait for dashboard
        await expect(page).toHaveURL('/');
        await expect(page.getByTestId('board-view-container')).toBeVisible({ timeout: 10000 });

        // Open account menu
        // Open account menu (filter by visibility to handle mobile/desktop duplicates)
        await page.getByTestId('account-menu-button').filter({ hasText: 'My Account' }).click();
        
        // Click upgrade plan
        await expect(page.getByTestId('upgrade-plan-menu-item')).toBeVisible();
        await page.getByTestId('upgrade-plan-menu-item').click();

        // Verify URL
        await expect(page).toHaveURL(/\/pricing/);
    });

    test('should redirect to pricing from get credits button when quota exceeded', async ({ page }) => {
        // Use the specific No Credits user
        const noCreditsEmail = process.env.E2E_USER_NO_CREDITS_EMAIL;
        const noCreditsPassword = process.env.E2E_USER_NO_CREDITS_PASSWORD;

        if (!noCreditsEmail || !noCreditsPassword) {
            test.skip(true, 'No credits user credentials not found in environment');
            return;
        }

        // Login as no-credits user
        await page.goto('/login', { waitUntil: 'domcontentloaded' });
        await page.getByPlaceholder('Email').fill(noCreditsEmail);
        await page.getByPlaceholder('Password').fill(noCreditsPassword);
        await page.getByRole('button', { name: /sign in/i }).click();

        // Wait for dashboard and open new task modal
        await page.getByTestId('add-task-button').click();
        
        // Fill title to enable form interactive parts if needed
        await page.getByPlaceholder('What needs to be done?').fill('Test AI Credits');

        // Click AI Assistant to expand options
        await page.getByTitle('AI Assistant').click();

        // Directly click Generate description (implicitly waits for it to become visible after expansion)
        await page.getByText('Generate description').click();

        // Check for specific error message "You have no credits left."
        // We skip checking for "Generating..." as it might appear too briefly if the failure is immediate.
        await expect(page.getByText('You have no credits left.')).toBeVisible({ timeout: 10000 });
        
        // Click "Get Credits" (implicitly waits for it to appear in the error alert)
        await page.getByRole('button', { name: /get credits/i }).click();
        await expect(page).toHaveURL(/\/pricing/);
    });
});
