import { test, expect } from '@playwright/test';
import { AppPage } from './page-objects/app.page';
import { TaskPage } from './page-objects/task.page';
import { AuthPage } from './page-objects/auth.page';

test.describe('AI Error Feedback', () => {
    let appPage: AppPage;
    let taskPage: TaskPage;
    let authPage: AuthPage;

    if (!process.env.E2E_USER_AI_EMAIL || !process.env.E2E_USER_AI_PASSWORD) {
        throw new Error('E2E_USER_AI_EMAIL and E2E_USER_AI_PASSWORD must be set in environment variables');
    }

    const TEST_EMAIL = process.env.E2E_USER_AI_EMAIL;
    const TEST_PASSWORD = process.env.E2E_USER_AI_PASSWORD;

    test.beforeEach(async ({ page }) => {
        appPage = new AppPage(page);
        taskPage = new TaskPage(page);
        authPage = new AuthPage(page);
        await appPage.goto();

        // Login for AI access
        await authPage.goToLogin();
        await authPage.login(TEST_EMAIL, TEST_PASSWORD);
        await authPage.expectLoggedIn();
    });

    test('should show in-app error when improving grammar with empty description', async () => {
        // Open task creation modal
        await appPage.openAddTaskModal();
        await taskPage.verifyModalOpen();

        // Fill title
        await taskPage.titleInput.fill('Error test task');

        // Click AI assistant button
        await taskPage.aiButton.click();
        await expect(taskPage.aiImproveButton).toBeVisible();

        // Click Improve Grammar without description
        await taskPage.aiImproveButton.click();

        // Verify in-app error message is visible instead of native alert
        const errorContainer = appPage.page.getByTestId('ai-error-container');
        await expect(errorContainer).toBeVisible();
        await expect(errorContainer.getByText('Please enter a description first.')).toBeVisible();

        // Close the error
        await errorContainer.getByRole('button', { name: /close error/i }).click();
        await expect(errorContainer).not.toBeVisible();
    });

    test('should clear errors when switching AI modes', async () => {
        await appPage.openAddTaskModal();
        await taskPage.titleInput.fill('Clear error test');
        await taskPage.aiButton.click();

        // Trigger error
        await taskPage.aiImproveButton.click();
        await expect(appPage.page.getByText('Please enter a description first.')).toBeVisible();

        // Close and reopen AI panel should clear error (based on my implementation)
        await taskPage.aiCancelButton.click();
        await taskPage.aiButton.click();
        await expect(appPage.page.getByText('Please enter a description first.')).not.toBeVisible();
    });
});
