import { test, expect } from '@playwright/test';
import { AppPage } from './page-objects/app.page';
import { TaskPage } from './page-objects/task.page';
import { BoardPage } from './page-objects/board.page';
import { AuthPage } from './page-objects/auth.page';

test.describe('Task Advanced Features', () => {
  let appPage: AppPage;
  let taskPage: TaskPage;
  let boardPage: BoardPage;
  let authPage: AuthPage;

  const TEST_EMAIL = 'automation-tasklite-001@yopmail.com';
  const TEST_PASSWORD = 'Automation123';

  test.beforeEach(async ({ page }) => {
    appPage = new AppPage(page);
    taskPage = new TaskPage(page);
    boardPage = new BoardPage(page);
    authPage = new AuthPage(page);
    await appPage.goto();

    // Clear local storage to start fresh
    await page.evaluate(() => localStorage.clear());
    await appPage.page.reload();
  });

  // ... (previous tests remain unchanged until AI section)

  test('should verify AI features are gated for unauthenticated users', async () => {
    // Ensure we are logged out (already done in beforeEach)

    // Open task creation modal
    await appPage.openAddTaskModal();
    await taskPage.verifyModalOpen();

    // Fill title
    await taskPage.titleInput.fill('Gating test');

    // Click AI assistant button
    await taskPage.aiButton.click();

    // Verify AuthRequiredModal appears immediately with AI message
    await expect(appPage.page.getByText('Unlock AI Power')).toBeVisible();
    await expect(appPage.page.getByText(/Unlock the power of AI to supercharge your productivity/)).toBeVisible();

    // Close modal
    await appPage.page.locator('[role="dialog"]').filter({ hasText: 'Unlock AI Power' }).getByRole('button', { name: /close modal/i }).click();
    await expect(appPage.page.getByText('Unlock AI Power')).not.toBeVisible();
  });

  test('should create a task using AI description generation', async ({ page }) => {
    test.setTimeout(90000); // Allow up to 90 seconds for AI generation

    // Login first
    await authPage.goToLogin();
    await authPage.login(TEST_EMAIL, TEST_PASSWORD);
    await authPage.expectLoggedIn();

    // Open task creation modal
    await appPage.openAddTaskModal();
    await taskPage.verifyModalOpen();

    // Fill only the title
    await taskPage.titleInput.fill('Create project documentation');

    // Click AI assistant button (stars icon in description field)
    await taskPage.aiButton.click();

    // Wait for AI modal/panel to appear
    await expect(taskPage.aiGenerateButton).toBeVisible();

    // Click the generate button
    await taskPage.aiGenerateButton.click();

    // Wait for AI to generate description (up to 60 seconds for slow API responses)
    // Check that description was generated
    await appPage.page.waitForFunction(() => {
      const descInput = document.querySelector('#task-description') as HTMLTextAreaElement;
      return descInput && descInput.value.length > 0;
    }, {}, { timeout: 60000 });

    const descriptionValue = await taskPage.descriptionInput.inputValue();
    expect(descriptionValue.length).toBeGreaterThan(0);
    expect(descriptionValue).not.toBe('');

    // Save the task
    await taskPage.createButton.click();
    await taskPage.verifyModalClosed();

    // Verify task was created with AI-generated description
    await expect(appPage.page.getByText('Create project documentation').first()).toBeVisible();
    // Note: We can't check exact description text as it's AI-generated
  });

  test('should handle AI description generation timeout gracefully', async () => {
    // Login first
    await authPage.goToLogin();
    await authPage.login(TEST_EMAIL, TEST_PASSWORD);
    await authPage.expectLoggedIn();

    // Open task creation modal
    await appPage.openAddTaskModal();
    await taskPage.verifyModalOpen();

    const timestamp = Date.now();
    const uniqueTitle = `Test AI timeout handling ${timestamp}`;

    // Fill title
    await taskPage.titleInput.fill(uniqueTitle);

    // Click AI assistant button
    await taskPage.aiButton.click();

    // Wait for AI options panel to appear
    await expect(appPage.page.getByText('AI POWERED')).toBeVisible({ timeout: 30000 });
    await expect(appPage.page.getByText('Generate Description')).toBeVisible({ timeout: 30000 });

    // Click the specific AI dismiss button
    await expect(taskPage.aiCancelButton).toBeVisible({ timeout: 30000 });
    // Add small delay to ensure button is interactable
    await appPage.page.waitForTimeout(1000);
    await taskPage.aiCancelButton.click();

    // Wait for AI panel to close
    await expect(appPage.page.getByText('AI POWERED')).not.toBeVisible();

    // Verify we're still in the main task form
    await expect(taskPage.titleInput).toBeVisible();
    await expect(taskPage.titleInput).toHaveValue(uniqueTitle);

    // Description field should be visible and ready
    await expect(taskPage.descriptionInput).toBeVisible();

    const uniqueDescription = 'Manual description after AI cancel ' + timestamp;

    // Manually add description
    await taskPage.descriptionInput.fill(uniqueDescription);

    // Save the task
    await taskPage.createButton.click();
    await taskPage.verifyModalClosed();

    // Verify task was created with manual description
    await expect(appPage.page.getByText(uniqueTitle)).toBeVisible();
    await expect(appPage.page.getByText(uniqueDescription)).toBeVisible();
  });

  test('should improve grammar using AI', async () => {
    test.setTimeout(90000);

    // Login first
    await authPage.goToLogin();
    await authPage.login(TEST_EMAIL, TEST_PASSWORD);
    await authPage.expectLoggedIn();

    // Create a task first with poor grammar
    await appPage.openAddTaskModal();
    const uniqueTitle = `Grammar Test ${Date.now()}`;
    const poorGrammarText = 'me want fix grammar now good';

    await taskPage.fillTaskForm({
      title: uniqueTitle,
      description: poorGrammarText
    });

    // Save initial task
    await taskPage.createButton.click();
    await taskPage.verifyModalClosed();

    // Wait for task to appear without reloading (avoids AI auto-trigger)
    await expect(appPage.page.getByText(uniqueTitle).first()).toBeVisible({ timeout: 30000 });

    // Switch to board view and edit the task  
    await appPage.switchToView('board');
    await expect(appPage.page.getByText(uniqueTitle).first()).toBeVisible();
    
    // Use BoardPage to properly edit the task
    await boardPage.editTask(uniqueTitle);

    // Click AI assistant button
    await taskPage.aiButton.click();

    // Wait for AI options and click Improve Grammar
    await expect(taskPage.aiImproveButton).toBeVisible({ timeout: 10000 });
    await taskPage.aiImproveButton.click();
    
    // Wait for AI to process grammar improvement (~12-15 seconds observed)
    await appPage.page.waitForTimeout(20000);

    // Wait for AI to improve description (check simple logic: text changed)
    // We pass poorGrammarText as an argument to the function
    await appPage.page.waitForFunction((originalText) => {
      const descInput = document.querySelector('#task-description') as HTMLTextAreaElement;
      return descInput && descInput.value !== originalText;
    }, poorGrammarText, { timeout: 90000 });

    const newDescription = await taskPage.descriptionInput.inputValue();
    expect(newDescription).not.toBe(poorGrammarText);
    expect(newDescription.length).toBeGreaterThan(0);

    // Close/Save
    await taskPage.updateButton.click();
    await taskPage.verifyModalClosed();
  });
});
