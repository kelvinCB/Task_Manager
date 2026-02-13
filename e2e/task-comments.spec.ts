import { test, expect } from '@playwright/test';
import { AppPage } from './page-objects/app.page';
import { TaskPage } from './page-objects/task.page';
import { AuthPage } from './page-objects/auth.page';

const generateUniqueTitle = (base: string) => `${base} - ${Date.now()}-${Math.floor(Math.random() * 1000)}`;

test.describe('Task Comments', () => {
  let appPage: AppPage;
  let taskPage: TaskPage;
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    appPage = new AppPage(page);
    taskPage = new TaskPage(page);
    authPage = new AuthPage(page);

    await appPage.goto();
    // Clear state
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await authPage.goToLogin();

    const email = process.env.E2E_USER_TASK_EMAIL || 'automation-kolium-task@yopmail.com';
    const password = process.env.E2E_USER_TASK_PASSWORD || 'Automation123';

    await authPage.login(email, password);

    // Wait for the app to be fully loaded
    await appPage.waitForLoadingComplete();
  });

  test('should add and view comments on a task', async ({ page }) => {
    test.setTimeout(90000);
    const taskTitle = generateUniqueTitle('Comment Task');

    await appPage.openAddTaskModal();
    await taskPage.createTask({ title: taskTitle, description: 'Task for comments' });

    // Search for the task to ensure it's visible
    await appPage.searchTasks(taskTitle);
    const taskCard = page.getByTestId('board-task-item').filter({ hasText: taskTitle }).first();
    await expect(taskCard).toBeVisible({ timeout: 10000 });

    // Open task detail
    await taskCard.click();

    // Check comments section - wait for it to be visible
    const commentsHeader = page.locator('h3').filter({ hasText: 'Comments' });
    await expect(commentsHeader).toBeVisible({ timeout: 10000 });

    // Wait for loading to finish or empty message
    const emptyMsg = page.getByText('No comments yet.').first();
    const loadingMsg = page.getByText('Loading...').first();
    await expect(loadingMsg.or(emptyMsg)).toBeVisible();

    // Add comment
    const commentContent = 'This is a test comment from E2E - ' + Date.now();
    const textarea = page.getByTestId('comment-input');
    await textarea.click();
    await textarea.fill(commentContent);

    // Check if button is enabled
    const sendButton = page.getByTestId('add-comment-button');
    await expect(sendButton).toBeEnabled();

    // Click the send button using force to bypass any overlay issues
    await sendButton.click({ force: true });

    // Wait for the API response
    await page.waitForTimeout(3000);

    // Verify comment appears in the UI
    await expect(page.getByText(commentContent)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('No comments yet.')).not.toBeVisible();

    // Persistence check - Close and reopen modal to trigger fresh fetch
    await page.locator('button[aria-label="Close modal"]').click();
    await page.waitForTimeout(500);
    await appPage.clearSearch();
    await appPage.searchTasks(taskTitle);

    const reopenedTaskCard = page.getByTestId('board-task-item').filter({ hasText: taskTitle }).first();
    await expect(reopenedTaskCard).toBeVisible({ timeout: 10000 });

    await reopenedTaskCard.click();

    // Check comments persist after reopening
    await expect(commentsHeader).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(commentContent)).toBeVisible({ timeout: 15000 });
  });
});
