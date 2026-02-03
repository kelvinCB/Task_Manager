import { test, expect } from '@playwright/test';
import { AuthPage } from './page-objects/auth.page';
import { TaskPage } from './page-objects/task.page';

// Test credentials from environment
const TEST_EMAIL = process.env.E2E_USER_AUTH_EMAIL!;
const TEST_PASSWORD = process.env.E2E_USER_AUTH_PASSWORD!;

test.describe('Authentication Restriction for Task Editing', () => {
    let authPage: AuthPage;
    let taskPage: TaskPage;

    test.beforeEach(async ({ page }) => {
        authPage = new AuthPage(page);
        taskPage = new TaskPage(page);
        await page.goto('/');
    });

    test('should show AuthRequiredModal when an unauthenticated user tries to edit a task from Board', async ({ page }) => {
        // Ensure we are logged out (though by default we should be)
        // We can verify this by checking if the task board has tasks but no user avatar

        // Find an edit button on a task card
        // Note: The app might have sample tasks or real tasks from Supabase
        const editButton = page.getByTestId('edit-task-button').first();

        // If no tasks exist, we might need to create one (unauthenticated user can create tasks)
        if (await editButton.count() === 0) {
            const addTaskButton = page.getByTestId('add-task-button').first();
            await addTaskButton.click();
            await taskPage.createTask({ title: 'Test Task for Auth check' });
            await taskPage.verifyModalClosed();
        }

        // Click edit on the first task
        // We hover first to make sure it's visible if needed, though getByTestId should handle it
        await page.getByTestId('edit-task-button').first().click();

        // Verify AuthRequiredModal appears
        await expect(page.getByTestId('auth-required-modal')).toBeVisible();
        await expect(page.getByTestId('auth-modal-title')).toBeVisible();

        // Verify redirection to login when clicking "Log In"
        await page.getByTestId('auth-modal-login-button').click();
        await expect(page).toHaveURL('/login');
    });

    test('should show AuthRequiredModal when an unauthenticated user tries to edit from Task Detail', async ({ page }) => {
        // 1. Create a task (unauthenticated can create)
        const addTaskButton = page.getByTestId('add-task-button').first();
        await addTaskButton.click();
        await taskPage.createTask({ title: 'Detail Test Task' });
        await taskPage.verifyModalClosed();

        // 2. Open task detail by clicking the title
        await page.getByText('Detail Test Task').first().click();

        // 3. Click Edit in detail modal (using the test ID we just added)
        await page.getByTestId('task-detail-edit-button').click();

        // 4. Verify AuthRequiredModal appears
        await expect(page.getByTestId('auth-required-modal')).toBeVisible();

        // Close modal and verify it disappears
        await page.getByTestId('auth-modal-close-button').click();
        await expect(page.getByTestId('auth-required-modal')).not.toBeVisible();
    });

    test('should allow editing when user is authenticated', async ({ page }) => {
        // 1. Login
        await authPage.goToLogin();
        await authPage.login(TEST_EMAIL, TEST_PASSWORD);
        await expect(page).toHaveURL('/');

        // 2. Create a task
        const addTaskButton = page.getByTestId('add-task-button').first();
        await addTaskButton.click();
        await taskPage.createTask({ title: 'Auth Edit Task' });
        await taskPage.verifyModalClosed();

        // 3. Click Edit
        await page.getByTestId('edit-task-button').first().click();

        // 4. Verify TaskForm opened instead of AuthRequiredModal
        await expect(page.getByTestId('task-form-modal')).toBeVisible();
        await expect(page.getByTestId('auth-required-modal')).not.toBeVisible();

        // Cleanup
        await taskPage.cancelTask();
    });
});
