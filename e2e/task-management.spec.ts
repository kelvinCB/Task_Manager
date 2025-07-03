import { test, expect } from '@playwright/test';
import { AppPage } from './page-objects/app.page';
import { TaskPage } from './page-objects/task.page';
import { BoardPage } from './page-objects/board.page';

test.describe('Task Management', () => {
  let appPage: AppPage;
  let taskPage: TaskPage;
  let boardPage: BoardPage;

  test.beforeEach(async ({ page }) => {
    appPage = new AppPage(page);
    taskPage = new TaskPage(page);
    boardPage = new BoardPage(page);
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

    // Click on the edit button for the task
    await boardPage.editTask('Original Task Title');
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

    // Use the BoardPage to delete the task directly (no confirmation dialog)
    await boardPage.deleteTask('Task to Delete');

    // Verify task is removed
    await expect(appPage.page.getByText('Task to Delete')).not.toBeVisible();
  });

  test('should prevent creating task without title (required field validation)', async () => {
    // Open task creation modal
    await appPage.openAddTaskModal();
    await taskPage.verifyModalOpen();

    // Try to create task without title (required field)
    await taskPage.createButton.click();

    // Modal should still be open because validation failed (form won't submit)
    await taskPage.verifyModalOpen();
    
    // Try adding a title now and verify it works
    await taskPage.titleInput.fill('Valid Task Title');
    await taskPage.createButton.click();
    await taskPage.verifyModalClosed();
    
    // Verify the task was created with valid title
    await expect(appPage.page.getByText('Valid Task Title')).toBeVisible();
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
