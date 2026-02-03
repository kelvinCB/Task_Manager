import { test, expect } from '@playwright/test';
import { AppPage } from './page-objects/app.page';
import { TaskPage } from './page-objects/task.page';
import { BoardPage } from './page-objects/board.page';
import { AuthPage } from './page-objects/auth.page';

// Helper to generate unique titles to avoid collisions in parallel runs
const generateUniqueTitle = (base: string) => `${base} - ${Date.now()}-${Math.floor(Math.random() * 1000)}`;

test.describe('Task Management', () => {
  let appPage: AppPage;
  let taskPage: TaskPage;
  let boardPage: BoardPage;
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    appPage = new AppPage(page);
    taskPage = new TaskPage(page);
    boardPage = new BoardPage(page);
    authPage = new AuthPage(page);

    await appPage.goto();

    // Clear local storage to start fresh
    await page.evaluate(() => localStorage.clear());
    await appPage.page.reload();

    // Login before tests that require editing
    await authPage.goToLogin();
    await authPage.login(
      process.env.E2E_USER_TASK_EMAIL || 'automation-kolium-task@yopmail.com',
      process.env.E2E_USER_TASK_PASSWORD || 'Automation123'
    );
    await expect(page).toHaveURL('/');
  });



  test('should create a new task successfully', async () => {
    // Open task creation modal
    await appPage.openAddTaskModal();
    await taskPage.verifyModalOpen();

    // Fill and submit task form
    const taskTitle = generateUniqueTitle('E2E Test Task');
    const taskDescription = 'This is a test task created by E2E tests';
    const taskData = {
      title: taskTitle,
      description: taskDescription,
      dueDate: '2030-12-31'
    };

    await taskPage.createTask(taskData);
    await taskPage.verifyModalClosed();

    // Verify task appears in the board
    await expect(appPage.page.getByText(taskTitle).first()).toBeVisible();
    await expect(appPage.page.getByText(taskDescription).first()).toBeVisible();
  });

  test('should edit an existing task in both Board and Tree views', async () => {
    const boardTaskTitle = generateUniqueTitle('Original Board Task');
    const updatedBoardTaskTitle = generateUniqueTitle('Updated Board Task');
    const treeTaskTitle = generateUniqueTitle('Original Tree Task');
    const updatedTreeTaskTitle = generateUniqueTitle('Updated Tree Task');

    // Create a task for Board View testing
    await appPage.openAddTaskModal();
    await taskPage.createTask({
      title: boardTaskTitle,
      description: 'Original description for board'
    });

    // Test editing in Board View
    await appPage.switchToView('board');
    await appPage.verifyCurrentView('board');
    await boardPage.editTask(boardTaskTitle);
    await taskPage.verifyModalOpen();

    await taskPage.updateTask({
      title: updatedBoardTaskTitle,
      description: 'Updated description for board'
    });
    await taskPage.verifyModalClosed();
    await expect(appPage.page.getByText(updatedBoardTaskTitle).first()).toBeVisible();

    // Create another task for Tree View testing
    await appPage.openAddTaskModal();
    await taskPage.createTask({
      title: treeTaskTitle,
      description: 'Original description for tree'
    });

    // Test editing in Tree View
    await appPage.switchToView('tree');
    await appPage.verifyCurrentView('tree');

    const taskRow = appPage.page.locator('.group').filter({ hasText: treeTaskTitle });
    await taskRow.hover();
    const moreButton = taskRow.locator('[data-testid="task-menu-button"]');
    await moreButton.click();

    // Use the reliable test ID we added
    const editOption = appPage.page.getByTestId('edit-task-button-menu');
    await editOption.click();
    await taskPage.verifyModalOpen();

    await taskPage.updateTask({
      title: updatedTreeTaskTitle,
      description: 'Updated description for tree'
    });
    await taskPage.verifyModalClosed();
    await expect(appPage.page.getByText(updatedTreeTaskTitle).first()).toBeVisible();
  });

  test('should delete a task in both Board and Tree views', async () => {
    const boardTaskToDelete = generateUniqueTitle('Task to Delete in Board');
    const treeTaskToDelete = generateUniqueTitle('Task to Delete in Tree');

    // Test deletion in Board View
    await appPage.openAddTaskModal();
    await taskPage.createTask({
      title: boardTaskToDelete,
      description: 'This task will be deleted from board view'
    });

    await appPage.switchToView('board');
    await appPage.verifyCurrentView('board');
    await boardPage.deleteTask(boardTaskToDelete);

    // Confirm deletion in modal
    await expect(appPage.page.getByRole('dialog')).toBeVisible();
    await appPage.page.getByTestId('confirm-delete-button').click();

    await expect(appPage.page.getByText(boardTaskToDelete)).not.toBeVisible();

    // Test deletion in Tree View
    await appPage.openAddTaskModal();
    await taskPage.createTask({
      title: treeTaskToDelete,
      description: 'This task will be deleted from tree view'
    });

    await appPage.switchToView('tree');
    await appPage.verifyCurrentView('tree');
    await expect(appPage.page.getByText(treeTaskToDelete)).toBeVisible();

    const taskRow = appPage.page.locator('.group').filter({ hasText: treeTaskToDelete });
    await taskRow.hover();
    const moreButton = taskRow.locator('[data-testid="task-menu-button"]');
    await expect(moreButton).toBeVisible();
    await moreButton.click();

    const deleteOption = appPage.page.getByTestId('delete-task-button');
    await expect(deleteOption).toBeVisible();
    await deleteOption.click();

    // Confirm deletion in modal
    await expect(appPage.page.getByRole('dialog')).toBeVisible();
    await appPage.page.getByTestId('confirm-delete-button').click();

    // Verify task is gone
    await expect(appPage.page.getByText(treeTaskToDelete).first()).not.toBeVisible();
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
    const validTitle = generateUniqueTitle('Valid Task Title');
    await taskPage.titleInput.fill(validTitle);
    await taskPage.createButton.click();
    await taskPage.verifyModalClosed();

    // Verify the task was created with valid title
    await expect(appPage.page.getByText(validTitle).first()).toBeVisible();
  });

  test('should handle task form cancellation', async () => {
    // Open task creation modal
    await appPage.openAddTaskModal();
    await taskPage.verifyModalOpen();

    // Fill form partially
    const cancelledTitle = generateUniqueTitle('Cancelled Task');
    await taskPage.titleInput.fill(cancelledTitle);
    await taskPage.descriptionInput.fill('This should not be saved');

    // Cancel the form
    await taskPage.cancelTask();
    await taskPage.verifyModalClosed();

    // Verify task was not created
    await expect(appPage.page.getByText(cancelledTitle)).not.toBeVisible();
  });
});
