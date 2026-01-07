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
  readonly languageToggle: Locator;

  constructor(page: Page) {
    this.page = page;
    // Navigation buttons use specific titles - handle both desktop and mobile IDs
    this.boardViewButton = page.getByTestId('board-view-toggle').or(page.getByTestId('board-view-toggle-mobile')).filter({ visible: true }).first();
    this.treeViewButton = page.getByTestId('tree-view-toggle').or(page.getByTestId('tree-view-toggle-mobile')).filter({ visible: true }).first();
    this.timeStatsButton = page.getByTestId('stats-view-toggle').or(page.getByTestId('stats-view-toggle-mobile')).filter({ visible: true }).first();
    this.themeToggle = page.getByTitle('Toggle Dark Mode').or(page.getByTestId('theme-toggle')).filter({ visible: true }).first();
    // Search input - Mobile uses 'Search...', Desktop uses 'Search tasks...'
    this.searchInput = page.getByPlaceholder('Search tasks...').or(page.getByPlaceholder('Search...')).filter({ visible: true }).first();
    // Add task button - Use data-testid for reliability
    this.addTaskButton = page.getByTestId('add-task-button').or(page.getByTestId('add-task-mobile-button')).filter({ visible: true }).first();
    // My Account menu
    this.accountMenu = page.getByTitle('My Account').or(page.getByTestId('account-menu-button')).filter({ visible: true }).first();
    this.importInput = page.locator('input[type="file"]');
    this.languageToggle = page.getByTestId('language-toggle').filter({ visible: true }).first();
  }

  async goto() {
    await this.page.goto('/');
  }

  async waitForLoadingComplete() {
    await this.page.waitForSelector('[data-loading="false"]', { timeout: 30000 });
  }

  async switchToView(view: 'board' | 'tree' | 'stats', force = false) {
    let baseId: string;
    switch (view) {
      case 'board':
        baseId = 'board-view-toggle';
        break;
      case 'tree':
        baseId = 'tree-view-toggle';
        break;
      case 'stats':
        baseId = 'stats-view-toggle';
        break;
    }

    const locator = this.page.getByTestId(baseId).or(this.page.getByTestId(`${baseId}-mobile`)).filter({ visible: true }).first();

    await locator.waitFor({ state: 'visible', timeout: 5000 });
    await locator.click({ force });
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
    await this.page.getByRole('menuitem').filter({ hasText: /Export Tasks|Exportar Tareas/i }).click();
  }

  async importTasks(filePath: string) {
    // Open account menu first
    await this.accountMenu.click();
    // Click on the Import Tasks option which is associated with a hidden file input
    await this.page.getByRole('menuitem').filter({ hasText: /Import Tasks|Importar Tareas/i }).click();
    await this.importInput.setInputFiles(filePath);
  }

  async toggleLanguage() {
    await this.languageToggle.click();
  }

  async verifyPageLoaded() {
    await expect(this.boardViewButton).toBeVisible();
    await expect(this.treeViewButton).toBeVisible();
    await expect(this.timeStatsButton).toBeVisible();
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
