import { Page, Locator, expect } from '@playwright/test';

export class AppPage {
  readonly page: Page;
  readonly boardViewButton: Locator;
  readonly treeViewButton: Locator;
  readonly timeStatsButton: Locator;
  readonly themeToggle: Locator;
  readonly searchInput: Locator;
  readonly addTaskButton: Locator;
  readonly accountMenu: Locator;
  readonly importInput: Locator;

  constructor(page: Page) {
    this.page = page;
    // Navigation buttons use specific titles - use first() to handle desktop/mobile duplicates
    this.boardViewButton = page.getByTestId('board-view-toggle').filter({ visible: true }).first();
    this.treeViewButton = page.getByTestId('tree-view-toggle').filter({ visible: true }).first();
    this.timeStatsButton = page.getByTestId('stats-view-toggle').filter({ visible: true }).first();
    this.themeToggle = page.getByTitle('Toggle Dark Mode').first();
    // Search input - Mobile uses 'Search...', Desktop uses 'Search tasks...'
    this.searchInput = page.getByPlaceholder('Search tasks...').or(page.getByPlaceholder('Search...')).first();
    // Add task button - Use data-testid for reliability
    this.addTaskButton = page.getByTestId('add-task-button').first();
    // My Account menu
    this.accountMenu = page.getByTitle('My Account').first();
    this.importInput = page.locator('input[type="file"]');
  }

  async goto() {
    await this.page.goto('/');
  }

  async waitForLoadingComplete() {
    await this.page.waitForSelector('[data-loading="false"]', { timeout: 30000 });
  }

  async switchToView(view: 'board' | 'tree' | 'stats', force = false) {
    let testId: string;
    switch (view) {
      case 'board':
        testId = 'board-view-toggle';
        break;
      case 'tree':
        testId = 'tree-view-toggle';
        break;
      case 'stats':
        testId = 'stats-view-toggle';
        break;
    }

    const locator = this.page.getByTestId(testId);

    // Wait for at least one element to be attached
    try {
      await locator.first().waitFor({ state: 'attached', timeout: 5000 });
    } catch (e) {
      // ignore
    }

    const count = await locator.count();
    if (count === 0) {
      // If we can't find it, dump failure info
      // console.log(await this.page.content());
      throw new Error(`No ${view} view button found (testid: ${testId})`);
    }

    // Try clicking the visible one
    const visibleButton = locator.filter({ visible: true }).first();
    if (await visibleButton.count() > 0) {
      await visibleButton.click({ force });
      return;
    }

    // Fallback: click the first one using force (might be mobile hidden on desktop or vice versa, but unlikely if count > 0)
    console.log(`Warning: Clicking hidden ${view} button`);
    await locator.first().click({ force: true });
  }

  async toggleTheme() {
    await this.themeToggle.click();
  }

  async searchTasks(query: string) {
    await this.searchInput.fill(query);
  }

  async clearSearch() {
    await this.searchInput.clear();
  }

  async openAddTaskModal() {
    await this.addTaskButton.click();
  }

  async exportTasks() {
    // Open account menu first
    await this.accountMenu.click();
    // Click the Export Tasks option in the dropdown
    await this.page.getByRole('menuitem').filter({ hasText: 'Export Tasks' }).click();
  }

  async importTasks(filePath: string) {
    // Open account menu first
    await this.accountMenu.click();
    // Click on the Import Tasks option which is associated with a hidden file input
    await this.page.getByRole('menuitem').filter({ hasText: 'Import Tasks' }).click();
    await this.importInput.setInputFiles(filePath);
  }

  async verifyPageLoaded() {
    await expect(this.page.getByTestId('board-view-toggle').filter({ visible: true }).first()).toBeVisible();
    await expect(this.page.getByTestId('tree-view-toggle').filter({ visible: true }).first()).toBeVisible();
    await expect(this.page.getByTestId('stats-view-toggle').filter({ visible: true }).first()).toBeVisible();
  }

  async verifyCurrentView(view: 'board' | 'tree' | 'stats') {
    switch (view) {
      case 'board':
        await expect(this.page.getByTestId('board-view-container')).toBeVisible();
        break;
      case 'tree':
        await expect(this.page.getByTestId('tree-view-container')).toBeVisible();
        break;
      case 'stats':
        await expect(this.page.getByTestId('stats-view-container')).toBeVisible();
        break;
    }
  }

  async verifyTheme(theme: 'light' | 'dark') {
    const htmlElement = this.page.locator('html');
    if (theme === 'dark') {
      await expect(htmlElement).toHaveClass(/dark/);
    } else {
      await expect(htmlElement).not.toHaveClass(/dark/);
    }
  }
}
