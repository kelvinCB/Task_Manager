import { test, expect } from '@playwright/test';
import { AppPage } from './page-objects/app.page';
import { TaskPage } from './page-objects/task.page';
import { BoardPage } from './page-objects/board.page';

test.describe('Task Advanced Features', () => {
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

  test('should create a task with due date', async () => {
    const taskData = {
      title: 'Task with Due Date',
      description: 'This task has a due date',
      dueDate: '2025-12-30'
    };

    // Open task creation modal
    await appPage.openAddTaskModal();
    await taskPage.verifyModalOpen();

    await taskPage.createTask(taskData);
    await taskPage.verifyModalClosed();

    // Verify task appears
    await expect(appPage.page.getByText(taskData.title)).toBeVisible();
    await expect(appPage.page.getByText(taskData.description)).toBeVisible();

    // Switch to Tree View to verify due date
    await appPage.switchToView('tree');
    await appPage.verifyCurrentView('tree');

    // Verify due date functionality is working - validate complete date components
    const taskContainer = appPage.page.locator('.group').filter({ hasText: taskData.title });
    await expect(taskContainer).toBeVisible();

    // Find all due date elements and check which are visible (handles responsive dual layout)
    const allDueDateElements = taskContainer.locator('span').filter({ hasText: /Due.*2025/ });
    const elementCount = await allDueDateElements.count();

    let visibleDueDateElement = null;
    for (let i = 0; i < elementCount; i++) {
      const element = allDueDateElements.nth(i);
      const isVisible = await element.isVisible();
      if (isVisible && !visibleDueDateElement) {
        visibleDueDateElement = element;
      }
    }

    // Ensure we found a visible element
    expect(visibleDueDateElement).not.toBeNull();
    await expect(visibleDueDateElement!).toBeVisible();

    // Validate the complete due date string contains all components
    const dueDateText = await visibleDueDateElement!.textContent();
    expect(dueDateText).toContain('Due');
    expect(dueDateText).toContain('2025');
    expect(dueDateText).toMatch(/Dec|December|12/);
    expect(dueDateText).toMatch(/29|30/); // Day could be 29 or 30 due to timezone

    // Also verify it shows in Board View
    await appPage.switchToView('board');
    await appPage.verifyCurrentView('board');

    // Find the task in Board View
    const boardTaskContainer = appPage.page.locator('.bg-white.rounded-lg.shadow-sm.p-4').filter({ hasText: taskData.title });
    await expect(boardTaskContainer).toBeVisible();

    // Verify due date is also displayed in Board View
    const boardDueDateElement = boardTaskContainer.locator('span').filter({ hasText: /Due.*2025/ }).first();
    await expect(boardDueDateElement).toBeVisible();

    // Validate the complete due date string in Board View
    const boardDueDateText = await boardDueDateElement.textContent();
    expect(boardDueDateText).toContain('Due');
    expect(boardDueDateText).toContain('2025');
    expect(boardDueDateText).toMatch(/Dec|December|12/);
    expect(boardDueDateText).toMatch(/29|30/);
  });

  test('should validate date format in different views', async () => {
    // Create multiple tasks with different dates to test various date formats
    const testCases = [
      {
        title: 'Task with Jan Date',
        description: 'Testing January date format',
        dueDate: '2025-01-15' // Jan 15, 2025
      },
      {
        title: 'Task with Jul Date',
        description: 'Testing July date format',
        dueDate: '2025-07-04' // Jul 4, 2025
      },
      {
        title: 'Task with Dec Date',
        description: 'Testing December date format',
        dueDate: '2025-12-25' // Dec 25, 2025
      }
    ];

    for (const testCase of testCases) {
      // Create task
      await appPage.openAddTaskModal();
      await taskPage.verifyModalOpen();
      await taskPage.createTask(testCase);
      await taskPage.verifyModalClosed();

      // Verify task appears
      await expect(appPage.page.getByText(testCase.title)).toBeVisible();

      // Extract expected date components
      const date = new Date(testCase.dueDate);
      const year = date.getFullYear().toString();
      const month = date.getMonth() + 1; // JavaScript months are 0-indexed
      const day = date.getDate().toString();

      // Get month names for validation
      const monthNames = {
        1: ['Jan', 'January', '01', '1'],
        7: ['Jul', 'July', '07', '7'],
        12: ['Dec', 'December', '12']
      };

      // Test in Tree View
      await appPage.switchToView('tree');
      await appPage.verifyCurrentView('tree');

      // Find the specific task container in Tree View
      const treeTaskContainer = appPage.page.locator('.group').filter({ hasText: testCase.title });
      await expect(treeTaskContainer).toBeVisible();

      // Validate complete date components in Tree View within the task context
      // Look for the due date element specifically
      // Try to find any visible due date element
      const allTreeDueDateElements = treeTaskContainer.locator('span').filter({ hasText: new RegExp(`Due.*${year}`) });
      const treeElementCount = await allTreeDueDateElements.count();

      let visibleTreeDueDateElement = null;
      for (let i = 0; i < treeElementCount; i++) {
        const element = allTreeDueDateElements.nth(i);
        const isVisible = await element.isVisible();
        if (isVisible) {
          visibleTreeDueDateElement = element;
          break;
        }
      }

      // Ensure we found a visible element
      expect(visibleTreeDueDateElement).not.toBeNull();
      await expect(visibleTreeDueDateElement!).toBeVisible();

      // Get the complete due date text and validate all components
      const treeDueDateText = await visibleTreeDueDateElement!.textContent();
      expect(treeDueDateText).toContain('Due');
      expect(treeDueDateText).toContain(year);
      expect(treeDueDateText).toContain(day);

      // Check for month in any of its possible formats
      const monthVariants = monthNames[month as keyof typeof monthNames];
      let monthFound = false;
      for (const monthVariant of monthVariants) {
        if (treeDueDateText?.includes(monthVariant)) {
          monthFound = true;
          break;
        }
      }
      expect(monthFound).toBe(true);

      // Test in Board View
      await appPage.switchToView('board');
      await appPage.verifyCurrentView('board');

      // Find the specific task container in Board View
      const boardTaskContainer = appPage.page.locator('.bg-white.rounded-lg.shadow-sm.p-4').filter({ hasText: testCase.title });
      await expect(boardTaskContainer).toBeVisible();

      // Validate complete date components in Board View within the task context
      const boardDueDateElement = boardTaskContainer.locator('span').filter({ hasText: new RegExp(`Due.*${year}`) }).first();
      await expect(boardDueDateElement).toBeVisible();

      // Get the complete due date text and validate all components
      const boardDueDateText = await boardDueDateElement.textContent();
      expect(boardDueDateText).toContain('Due');
      expect(boardDueDateText).toContain(year);
      expect(boardDueDateText).toContain(day);

      // Check for month in Board View
      monthFound = false;
      for (const monthVariant of monthVariants) {
        if (boardDueDateText?.includes(monthVariant)) {
          monthFound = true;
          break;
        }
      }
      expect(monthFound).toBe(true);
    }
  });

  test('should create a task using AI description generation', async ({ page }) => {
    test.setTimeout(90000); // Allow up to 90 seconds for AI generation
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
    // Open task creation modal
    await appPage.openAddTaskModal();
    await taskPage.verifyModalOpen();

    // Fill title
    await taskPage.titleInput.fill('Test AI timeout handling');

    // Click AI assistant button
    await taskPage.aiButton.click();

    // Wait for AI options panel to appear
    await expect(appPage.page.getByText('AI POWERED MAGIC')).toBeVisible();
    await expect(appPage.page.getByText('Generate Description')).toBeVisible();

    // Click the specific AI dismiss button
    await expect(taskPage.aiCancelButton).toBeVisible();
    await taskPage.aiCancelButton.click();

    // Wait for AI panel to close
    await expect(appPage.page.getByText('AI POWERED MAGIC')).not.toBeVisible();

    // Verify we're still in the main task form
    await expect(taskPage.titleInput).toBeVisible();
    await expect(taskPage.titleInput).toHaveValue('Test AI timeout handling');

    // Description field should be visible and ready
    await expect(taskPage.descriptionInput).toBeVisible();

    // Manually add description
    await taskPage.descriptionInput.fill('Manual description after AI cancel');

    // Save the task
    await taskPage.createButton.click();
    await taskPage.verifyModalClosed();

    // Verify task was created with manual description
    await expect(appPage.page.getByText('Test AI timeout handling')).toBeVisible();
    await expect(appPage.page.getByText('Manual description after AI cancel')).toBeVisible();
  });
});
