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
    // Wait 1 second before ending test    // Take final screenshot with test name
    const testName = testInfo.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  });

  test('should create a new task successfully', async () => {
    // Open task creation modal
    await appPage.openAddTaskModal();
    await taskPage.verifyModalOpen();

    // Fill and submit task form
    const taskData = {
      title: 'E2E Test Task',
      description: 'This is a test task created by E2E tests',
      dueDate: '2030-12-31'
    };

    await taskPage.createTask(taskData);
    await taskPage.verifyModalClosed();

    // Verify task appears in the board
    await expect(appPage.page.getByText(taskData.title)).toBeVisible();
    await expect(appPage.page.getByText(taskData.description)).toBeVisible();
  });

  test('should edit an existing task in both Board and Tree views', async () => {
    // Create a task for Board View testing
    await appPage.openAddTaskModal();
    await taskPage.createTask({
      title: 'Original Board Task',
      description: 'Original description for board'
    });

    // Test editing in Board View
    await appPage.switchToView('board');
    await appPage.verifyCurrentView('board');
    await boardPage.editTask('Original Board Task');
    await taskPage.verifyModalOpen();

    await taskPage.updateTask({
      title: 'Updated Board Task',
      description: 'Updated description for board'
    });
    await taskPage.verifyModalClosed();
    await expect(appPage.page.getByText('Updated Board Task')).toBeVisible();

    // Create another task for Tree View testing
    await appPage.openAddTaskModal();
    await taskPage.createTask({
      title: 'Original Tree Task',
      description: 'Original description for tree'
    });

    // Test editing in Tree View
    await appPage.switchToView('tree');
    await appPage.verifyCurrentView('tree');

    const taskRow = appPage.page.locator('.group').filter({ hasText: 'Original Tree Task' });
    await taskRow.hover();
    const moreButton = taskRow.locator('[data-testid="task-menu-button"]');
    await moreButton.click();

    // Use the reliable test ID we added
    const editOption = appPage.page.getByTestId('edit-task-button');
    await editOption.click();
    await taskPage.verifyModalOpen();

    await taskPage.updateTask({
      title: 'Updated Tree Task',
      description: 'Updated description for tree'
    });
    await taskPage.verifyModalClosed();
    await expect(appPage.page.getByText('Updated Tree Task')).toBeVisible();
  });

  test('should delete a task in both Board and Tree views', async () => {
    // Test deletion in Board View
    await appPage.openAddTaskModal();
    await taskPage.createTask({
      title: 'Task to Delete in Board',
      description: 'This task will be deleted from board view'
    });

    await appPage.switchToView('board');
    await appPage.verifyCurrentView('board');
    await boardPage.deleteTask('Task to Delete in Board');
    await expect(appPage.page.getByText('Task to Delete in Board')).not.toBeVisible();

    // Test deletion in Tree View
    await appPage.openAddTaskModal();
    await taskPage.createTask({
      title: 'Task to Delete in Tree',
      description: 'This task will be deleted from tree view'
    });

    await appPage.switchToView('tree');
    await appPage.verifyCurrentView('tree');
    await expect(appPage.page.getByText('Task to Delete in Tree')).toBeVisible();

    const taskRow = appPage.page.locator('.group').filter({ hasText: 'Task to Delete in Tree' });
    await taskRow.hover();
    const moreButton = taskRow.locator('[data-testid="task-menu-button"]');
    await expect(moreButton).toBeVisible();
    await moreButton.click();

    const deleteOption = appPage.page.getByTestId('delete-task-button');
    await expect(deleteOption).toBeVisible();
    await deleteOption.click(); await expect(appPage.page.getByText('Task to Delete in Tree')).not.toBeVisible();
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
