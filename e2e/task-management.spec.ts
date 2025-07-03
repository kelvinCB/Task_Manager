import { test, expect } from '@playwright/test';
import { AppPage } from './page-objects/app.page';
import { TaskPage } from './page-objects/task.page';

test.describe('Task Management', () => {
  let appPage: AppPage;
  let taskPage: TaskPage;

  test.beforeEach(async ({ page }) => {
    appPage = new AppPage(page);
    taskPage = new TaskPage(page);
    await appPage.goto();
    
    // Clear local storage to start fresh
    await page.evaluate(() => localStorage.clear());
    await appPage.page.reload();
  });

  test.afterEach(async ({ page }, testInfo) => {
    // Wait 1 second before ending test
    await page.waitForTimeout(1000);
    
    // Take final screenshot with test name
    const testName = testInfo.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    await page.screenshot({ 
      path: `test-results/screenshots/${testName}_final.png`,
      fullPage: true 
    });
  });

  test('should create a new task successfully', async () => {
    // Open task creation modal
    await appPage.openAddTaskModal();
    await taskPage.verifyModalOpen();

    // Fill and submit task form
    const taskData = {
      title: 'E2E Test Task',
      description: 'This is a test task created by E2E tests',
      dueDate: '2024-12-31'
    };

    await taskPage.createTask(taskData);
    await taskPage.verifyModalClosed();

    // Verify task appears in the board
    await expect(appPage.page.getByText(taskData.title)).toBeVisible();
    await expect(appPage.page.getByText(taskData.description)).toBeVisible();
  });

  test('should edit an existing task', async () => {
    // First create a task
    await appPage.openAddTaskModal();
    await taskPage.createTask({
      title: 'Original Task Title',
      description: 'Original description'
    });

    // Click on the task to edit it
    await appPage.page.getByText('Original Task Title').click();
    await taskPage.verifyModalOpen();

    // Update the task
    const updatedData = {
      title: 'Updated Task Title',
      description: 'Updated description'
    };

    await taskPage.updateTask(updatedData);
    await taskPage.verifyModalClosed();

    // Verify the task was updated
    await expect(appPage.page.getByText(updatedData.title)).toBeVisible();
    await expect(appPage.page.getByText(updatedData.description)).toBeVisible();
    await expect(appPage.page.getByText('Original Task Title')).not.toBeVisible();
  });

  test('should delete a task', async () => {
    // Create a task first
    await appPage.openAddTaskModal();
    await taskPage.createTask({
      title: 'Task to Delete',
      description: 'This task will be deleted'
    });

    // Find and delete the task
    const taskItem = appPage.page.locator('[data-testid="task-item"]').filter({ hasText: 'Task to Delete' });
    const deleteButton = taskItem.getByRole('button', { name: /delete/i });
    
    await deleteButton.click();

    // Confirm deletion if there's a confirmation dialog
    const confirmButton = appPage.page.getByRole('button', { name: /confirm|yes|delete/i });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    // Verify task is removed
    await expect(appPage.page.getByText('Task to Delete')).not.toBeVisible();
  });

  test('should prevent creating task without title (required field validation)', async () => {
    // Open task creation modal
    await appPage.openAddTaskModal();
    await taskPage.verifyModalOpen();

    // Try to create task without title (required field)
    await taskPage.createButton.click();

    // Check for validation errors
    await taskPage.verifyValidationErrors();
    
    // Modal should still be open because validation failed
    await taskPage.verifyModalOpen();
  });

  test('should handle task form cancellation', async () => {
    // Open task creation modal
    await appPage.openAddTaskModal();
    await taskPage.verifyModalOpen();

    // Fill form partially
    await taskPage.titleInput.fill('Cancelled Task');
    await taskPage.descriptionInput.fill('This should not be saved');

    // Cancel the form
    await taskPage.cancelTask();
    await taskPage.verifyModalClosed();

    // Verify task was not created
    await expect(appPage.page.getByText('Cancelled Task')).not.toBeVisible();
  });
});
