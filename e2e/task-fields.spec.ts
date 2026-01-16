import { test, expect } from '@playwright/test';
import { AuthPage } from './page-objects/auth.page';

test.describe.skip('Task Fields', () => {
    let authPage: AuthPage;

    test.beforeEach(async ({ page }) => {
        test.setTimeout(60000);
        // Clear local storage to start fresh
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());

        authPage = new AuthPage(page);
        await authPage.goToLogin();
        await page.waitForTimeout(2000); // Wait for page to settle
        await authPage.login(
            process.env.E2E_USER_TASK_EMAIL || 'automation-kolium-task@yopmail.com',
            process.env.E2E_USER_TASK_PASSWORD || 'Automation123'
        );
    });

    test('should create task with fields and verify in Board View detail', async ({ page }) => {
        // Switch to Board View explicitly
        await page.getByTestId('board-view-toggle').click();

        // 1. Create Task
        await page.getByTestId('add-task-button').click();
        const taskTitle = `Board View Task ${Date.now()}`;
        await page.getByLabel('Title').fill(taskTitle);
        await page.getByLabel('Estimation').selectOption('5');
        await page.getByLabel('Responsible').fill('Board User');
        await page.getByTestId('task-form-submit-button').click();

        // 2. Open Detail from Board View
        const taskCard = page.getByTestId('board-task-item').filter({ hasText: taskTitle });
        await expect(taskCard).toBeVisible();
        await taskCard.click();

        // 3. Verify Details
        await expect(page.getByText('5 points', { exact: false })).toBeVisible(); // Matches "Estimation: 5" or just "5"
        await expect(page.getByText('Board User')).toBeVisible();

        // Close modal
        await page.getByLabel('Close modal').click();
    });

    test('should verify fields in Tree View detail', async ({ page }) => {
        // Switch to Tree View
        await page.getByTestId('tree-view-toggle').click();

        // 1. Create Task (can reuse creation logic or just create a new one for isolation)
        await page.getByTestId('add-task-button').click();
        const taskTitle = `Tree View Task ${Date.now()}`;
        await page.getByLabel('Title').fill(taskTitle);
        await page.getByLabel('Estimation').selectOption('8');
        await page.getByLabel('Responsible').fill('Tree User');
        await page.getByTestId('task-form-submit-button').click();

        // 2. Open Detail from Tree View
        // Tree view items might need expansion, but root items are usually visible
        const taskItem = page.getByText(taskTitle);
        await expect(taskItem).toBeVisible();

        // Click on the task text/content to open detail (avoiding expand/collapse buttons if any)
        await taskItem.click();

        // 3. Verify Details
        await expect(page.getByText('8 points', { exact: false })).toBeVisible();
        await expect(page.getByText('Tree User')).toBeVisible();
    });

    test('should edit task in Board View and verify pre-fill', async ({ page }) => {
        await page.getByTestId('board-view-toggle').click();

        // 1. Create Task
        await page.getByTestId('add-task-button').click();
        const taskTitle = `Board Edit Task ${Date.now()}`;
        await page.getByLabel('Title').fill(taskTitle);
        await page.getByLabel('Estimation').selectOption('3');
        await page.getByLabel('Responsible').fill('Pre-fill Check');
        await page.getByTestId('task-form-submit-button').click();

        // 2. Open Edit Form via Task Card -> Edit Button (if available) or Detail -> Edit
        const taskCard = page.getByTestId('board-task-item').filter({ hasText: taskTitle });
        await taskCard.hover(); // Hover to show actions
        await taskCard.getByTestId('edit-task-button').click();

        // 3. Verify Pre-fill
        await expect(page.getByLabel('Estimation')).toHaveValue('3');
        await expect(page.getByLabel('Responsible')).toHaveValue('Pre-fill Check');

        // 4. Modify and Save
        await page.getByLabel('Estimation').selectOption('21'); // Invalid Fibonacci? UI constraints? 
        // Dropdown options are: 1, 2, 3, 5, 8, 13. Let's stick to valid ones.
        await page.getByLabel('Estimation').selectOption('13');
        await page.getByLabel('Responsible').fill('Updated User');
        await page.getByTestId('task-form-submit-button').click();

        // 5. Verify Update in Detail
        await taskCard.click();
        await expect(page.getByText('13 points', { exact: false })).toBeVisible();
        await expect(page.getByText('Updated User')).toBeVisible();
    });

    test('should edit task in Tree View and verify pre-fill', async ({ page }) => {
        await page.getByTestId('tree-view-toggle').click();

        // 1. Create Task
        await page.getByTestId('add-task-button').click();
        const taskTitle = `Tree Edit Task ${Date.now()}`;
        await page.getByLabel('Title').fill(taskTitle);
        await page.getByLabel('Estimation').selectOption('2');
        await page.getByLabel('Responsible').fill('Tree Pre-fill');
        await page.getByTestId('task-form-submit-button').click();

        // 2. Open Edit Form
        const taskRow = page.getByTestId('tree-node').filter({ hasText: taskTitle });
        await taskRow.hover();
        await taskRow.getByTestId('edit-task-button').click();

        // 3. Verify Pre-fill
        await expect(page.getByLabel('Estimation')).toHaveValue('2');
        await expect(page.getByLabel('Responsible')).toHaveValue('Tree Pre-fill');

        // 4. Modify and Save
        await page.getByLabel('Estimation').selectOption('5');
        await page.getByLabel('Responsible').fill('Tree Updated');
        await page.getByTestId('task-form-submit-button').click();

        // 5. Verify Update in Detail
        await taskRow.getByText(taskTitle).click(); // Open detail
        await expect(page.getByText('5 points', { exact: false })).toBeVisible();
        await expect(page.getByText('Tree Updated')).toBeVisible();
    });
});
