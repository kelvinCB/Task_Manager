import { test, expect } from '@playwright/test';
import { AppPage } from './page-objects/app.page';
import { TaskPage } from './page-objects/task.page';

test.describe('Task Search Functionality', () => {
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
    // Wait 1 second before ending test    // Take final screenshot with test name
    const testName = testInfo.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();  });

  // Helper function to create test tasks with different title patterns
  async function createSearchTestTasks() {
    // Task with normal title
    await appPage.openAddTaskModal();
    await taskPage.createTask({
      title: 'Review Project Documentation',
      description: 'Normal task with standard text'
    });

    // Task with special characters
    await appPage.openAddTaskModal();
    await taskPage.createTask({
      title: 'Update API @endpoints & validate $config',
      description: 'Task with special characters in title'
    });

    // Task with numbers
    await appPage.openAddTaskModal();
    await taskPage.createTask({
      title: 'Process 2024 Q1 Report v2.1',
      description: 'Task with numbers in title'
    });

    // Additional tasks for more comprehensive testing
    await appPage.openAddTaskModal();
    await taskPage.createTask({
      title: 'Setup Development Environment',
      description: 'Another normal task'
    });

    await appPage.openAddTaskModal();
    await taskPage.createTask({
      title: 'Bug Fix: Issue #123 & Update TODO',
      description: 'Task with mixed special characters and numbers'
    });
  }

  test('should search for tasks with normal text titles', async () => {
    await createSearchTestTasks();

    // Search for task with normal title
    await appPage.searchTasks('Review Project');

    // Verify the correct task is found
    await expect(appPage.page.getByText('Review Project Documentation')).toBeVisible();
    
    // Verify other tasks are filtered out
    await expect(appPage.page.getByText('Update API @endpoints')).not.toBeVisible();
    await expect(appPage.page.getByText('Process 2024 Q1')).not.toBeVisible();
    await expect(appPage.page.getByText('Setup Development')).not.toBeVisible();

    // Clear search and verify all tasks return
    await appPage.clearSearch();
    await expect(appPage.page.getByText('Review Project Documentation')).toBeVisible();
    await expect(appPage.page.getByText('Update API @endpoints')).toBeVisible();
    await expect(appPage.page.getByText('Process 2024 Q1')).toBeVisible();
  });

  test('should search for tasks with special characters in titles', async () => {
    await createSearchTestTasks();

    // Search for task with special characters - search for @ symbol
    await appPage.searchTasks('@endpoints');

    // Verify the correct task is found
    await expect(appPage.page.getByText('Update API @endpoints & validate $config')).toBeVisible();
    
    // Verify other tasks are filtered out
    await expect(appPage.page.getByText('Review Project Documentation')).not.toBeVisible();
    await expect(appPage.page.getByText('Process 2024 Q1')).not.toBeVisible();

    // Clear and test with $ symbol
    await appPage.clearSearch();
    await appPage.searchTasks('$config');

    // Verify the same task is found
    await expect(appPage.page.getByText('Update API @endpoints & validate $config')).toBeVisible();
    await expect(appPage.page.getByText('Review Project Documentation')).not.toBeVisible();

    // Clear and test with & symbol
    await appPage.clearSearch();
    await appPage.searchTasks('& validate');

    // Verify the same task is found
    await expect(appPage.page.getByText('Update API @endpoints & validate $config')).toBeVisible();
    await expect(appPage.page.getByText('Review Project Documentation')).not.toBeVisible();
  });

  test('should search for tasks with numbers in titles', async () => {
    await createSearchTestTasks();

    // Search for task with numbers - search for year
    await appPage.searchTasks('2024');

    // Verify the correct task is found
    await expect(appPage.page.getByText('Process 2024 Q1 Report v2.1')).toBeVisible();
    
    // Verify other tasks are filtered out (unless they also contain 2024)
    await expect(appPage.page.getByText('Review Project Documentation')).not.toBeVisible();
    await expect(appPage.page.getByText('Update API @endpoints')).not.toBeVisible();

    // Clear and test with version number
    await appPage.clearSearch();
    await appPage.searchTasks('v2.1');

    // Verify the same task is found
    await expect(appPage.page.getByText('Process 2024 Q1 Report v2.1')).toBeVisible();
    await expect(appPage.page.getByText('Review Project Documentation')).not.toBeVisible();

    // Clear and test with quarter notation
    await appPage.clearSearch();
    await appPage.searchTasks('Q1');

    // Verify the same task is found
    await expect(appPage.page.getByText('Process 2024 Q1 Report v2.1')).toBeVisible();
    await expect(appPage.page.getByText('Review Project Documentation')).not.toBeVisible();
  });

  test('should handle mixed search with numbers and special characters', async () => {
    await createSearchTestTasks();

    // Search for task with both numbers and special characters
    await appPage.searchTasks('#123');

    // Verify the correct task is found
    await expect(appPage.page.getByText('Bug Fix: Issue #123 & Update TODO')).toBeVisible();
    
    // Verify other tasks are filtered out
    await expect(appPage.page.getByText('Review Project Documentation')).not.toBeVisible();
    await expect(appPage.page.getByText('Process 2024 Q1')).not.toBeVisible();

    // Test partial search with colon
    await appPage.clearSearch();
    await appPage.searchTasks('Bug Fix:');

    // Verify the same task is found
    await expect(appPage.page.getByText('Bug Fix: Issue #123 & Update TODO')).toBeVisible();
    await expect(appPage.page.getByText('Review Project Documentation')).not.toBeVisible();
  });

  test('should handle case-insensitive search', async () => {
    await createSearchTestTasks();

    // Search with lowercase
    await appPage.searchTasks('review project');

    // Verify task is found despite case difference
    await expect(appPage.page.getByText('Review Project Documentation')).toBeVisible();

    // Clear and search with uppercase
    await appPage.clearSearch();
    await appPage.searchTasks('REVIEW PROJECT');

    // Verify task is still found
    await expect(appPage.page.getByText('Review Project Documentation')).toBeVisible();

    // Clear and search with mixed case
    await appPage.clearSearch();
    await appPage.searchTasks('ReViEw PrOjEcT');

    // Verify task is still found
    await expect(appPage.page.getByText('Review Project Documentation')).toBeVisible();
  });

  test('should handle empty search (show all tasks)', async () => {
    await createSearchTestTasks();

    // First apply a filter
    await appPage.searchTasks('Review');
    await expect(appPage.page.getByText('Review Project Documentation')).toBeVisible();
    await expect(appPage.page.getByText('Update API @endpoints')).not.toBeVisible();

    // Clear search
    await appPage.clearSearch();

    // Verify all tasks are visible again
    await expect(appPage.page.getByText('Review Project Documentation')).toBeVisible();
    await expect(appPage.page.getByText('Update API @endpoints & validate $config')).toBeVisible();
    await expect(appPage.page.getByText('Process 2024 Q1 Report v2.1')).toBeVisible();
    await expect(appPage.page.getByText('Setup Development Environment')).toBeVisible();
    await expect(appPage.page.getByText('Bug Fix: Issue #123 & Update TODO')).toBeVisible();
  });

  test('should handle search with no results', async () => {
    await createSearchTestTasks();

    // Search for something that doesn't exist
    await appPage.searchTasks('NonExistentTask');

    // Verify no tasks are visible or empty state is shown
    await expect(appPage.page.getByText('Review Project Documentation')).not.toBeVisible();
    await expect(appPage.page.getByText('Update API @endpoints')).not.toBeVisible();
    await expect(appPage.page.getByText('Process 2024 Q1')).not.toBeVisible();
    
    // Check for empty state message (might be "No tasks found" or similar)
    const emptyStateMessages = [
      'No tasks found',
      'No results',
      'No matching tasks',
      'No tasks match your search'
    ];
    
    let emptyStateFound = false;
    for (const message of emptyStateMessages) {
      try {
        await expect(appPage.page.getByText(message)).toBeVisible({ timeout: 1000 });
        emptyStateFound = true;
        break;
      } catch (e) {
        // Continue to next message
      }
    }
    
    // If no specific empty state message, just verify task count is 0
    if (!emptyStateFound) {
      const taskElements = appPage.page.locator('[data-testid*="task"], .task-item, .task-card');
      await expect(taskElements).toHaveCount(0);
    }
  });
});
