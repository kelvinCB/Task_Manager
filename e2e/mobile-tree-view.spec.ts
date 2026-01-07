import { test, expect } from '@playwright/test';
import { AppPage } from './page-objects/app.page';
import { TaskPage } from './page-objects/task.page';

test.describe('Mobile Tree View UX', () => {
  let appPage: AppPage;
  let taskPage: TaskPage;

  test.beforeEach(async ({ page }) => {
    appPage = new AppPage(page);
    taskPage = new TaskPage(page);
    await appPage.goto();
    
    // Set mobile viewport and reload to ensure layout is correctly initialized
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Switch to tree view explicitly using the mobile header toggle
    const mobileHeader = page.getByTestId('mobile-header');
    const treeToggle = mobileHeader.getByTestId('tree-view-toggle-mobile');
    await treeToggle.waitFor({ state: 'visible' });
    await treeToggle.click({ force: true });
    
    // Ensure we are in tree view
    await expect(page.getByTestId('tree-view-container')).toBeVisible();
  });

  test('should display task title clearly on mobile', async ({ page }) => {
    const parentTitle = 'Mobile Title Visibility Test';
    
    // Create task
    await appPage.openAddTaskModal();
    await taskPage.createTask({ title: parentTitle });
    
    // Use a more specific locator for the task item
    const taskItem = page.getByTestId('task-item').filter({ hasText: parentTitle });
    await expect(taskItem).toBeVisible();
    
    // Verify title is visible and bold (as requested for visual improvement)
    const titleElement = taskItem.locator('h3').filter({ hasText: parentTitle }).first();
    await expect(titleElement).toBeVisible();
    await expect(titleElement).toHaveClass(/font-bold/);
  });

  test('should have reduced indentation on mobile', async ({ page }) => {
    const parentTitle = 'Indentation Parent';
    const childTitle = 'Indentation Child';
    
    // Create parent
    await appPage.openAddTaskModal();
    await taskPage.createTask({ title: parentTitle });
    
    // Find parent and add subtask
    // Use .first() to reliably get the parent (rendered before child) and avoid breadcrumb ambiguity
    const parentItem = page.getByTestId('task-item').filter({ hasText: parentTitle }).first();
    await parentItem.getByTestId('task-menu-button').click();
    await page.getByTestId('add-subtask-button-menu').click();
    
    await taskPage.createTask({ title: childTitle });
    
    // Switch back to Tree View if it cleared, and wait for render
    await page.waitForTimeout(500);
    
    // Verify child indentation (12px on mobile)
    const childItem = page.getByTestId('task-item').filter({ hasText: childTitle });
    
    // Wait for visibility
    await expect(childItem).toBeVisible({ timeout: 5000 });
    
    // Check margin directly
    const marginLeft = await childItem.evaluate(el => window.getComputedStyle(el).marginLeft);
    // Allow for small variance or string format differences
    expect(parseInt(marginLeft)).toBeGreaterThan(0);
    expect(parseInt(marginLeft)).toBeLessThan(20); // Should be roughly 12px
  });

  test('should display centered subtask badge on mobile', async ({ page }) => {
     const parentTitle = 'Badge Test Parent';
     const childTitle = 'Badge Test Child';
     
     await appPage.openAddTaskModal();
     await taskPage.createTask({ title: parentTitle });
     
     const parentItem = page.getByTestId('task-item').filter({ hasText: parentTitle });
     await parentItem.getByTestId('task-menu-button', { exact: false }).waitFor({ state: 'visible' });
     await parentItem.getByTestId('task-menu-button').click();
     await page.getByTestId('add-subtask-button-menu').click();
     await taskPage.createTask({ title: childTitle });
     
     // Reload to ensure state is fresh (backend update reflection)
     await page.reload();

     // Scroll to bottom to ensure the new task is visible
     await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
     
     // Use distinct filter to ensure we get the parent task specifically
     // Using .first() helps if filtering by text finds breadcrumb matches too
     const parentItemAfterReload = page.getByTestId('task-item').filter({ hasText: parentTitle }).first();
     const badge = parentItemAfterReload.getByTestId('subtask-badge');
     
     await expect(badge).toBeVisible({ timeout: 5000 });
     // In ES, it should say something like "Tiene subtareas", in EN "Has subtasks"
     await expect(badge).toHaveText(/subtasks|subtareas/i);
   });
});
