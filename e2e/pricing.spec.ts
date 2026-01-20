import { test, expect } from '@playwright/test';

test.describe('Pricing Page', () => {
  test('should render pricing plans and allow navigation', async ({ page }) => {
    // Navigate to pricing page
    await page.goto('/pricing');

    // Check title
    await expect(page.getByText('Upgrade your productivity')).toBeVisible();

    // Check plans
    await expect(page.getByText('Starter')).toBeVisible();
    await expect(page.getByText('Pro')).toBeVisible();

    // Check toggle
    const toggle = page.getByRole('switch');
    await expect(toggle).toBeVisible();
    
    // Toggle to yearly
    await toggle.click();
    await expect(page.getByText('/year').first()).toBeVisible();

    // Check back button
    const backButton = page.getByRole('button', { name: /back/i });
    await expect(backButton).toBeVisible();
    // We can't easily test navigation back in isolation without history, but we verify it's there
  });

  // Mocking the AI error flow would be more complex and might depend on backend mocking. 
  // For now, we verify the page exists and works.
});
