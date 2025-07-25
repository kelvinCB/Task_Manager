import { Page, Locator, expect } from '@playwright/test';

export class TaskPage {
  readonly page: Page;
  readonly taskModal: Locator;
  readonly titleInput: Locator;
  readonly descriptionInput: Locator;
  readonly dueDateInput: Locator;
  readonly statusSelect: Locator;
  readonly createButton: Locator;
  readonly updateButton: Locator;
  readonly cancelButton: Locator;
  readonly closeButton: Locator;
  readonly aiButton: Locator;
  readonly aiGenerateButton: Locator;
  readonly aiCancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Look for modal dialog content (the actual modal div)
    this.taskModal = page.locator('div').filter({ hasText: 'Create New Task' }).or(page.locator('div').filter({ hasText: 'Edit Task' })).first();
    // Use specific IDs from the actual implementation
    this.titleInput = page.locator('#task-title');
    this.descriptionInput = page.locator('#task-description');
    this.dueDateInput = page.locator('#task-due-date');
    this.statusSelect = page.locator('#task-status');
    // The actual buttons are "Save" and "Cancel"
    this.createButton = page.getByRole('button', { name: 'Save' });
    this.updateButton = page.getByRole('button', { name: 'Save' });
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });
    this.closeButton = page.getByRole('button').filter({ hasText: '' }); // X button has no text
    this.aiButton = page.getByTitle('AI Assistant - Generate description');
    this.aiGenerateButton = page.getByText('Add Description');
    this.aiCancelButton = page.locator('button').filter({ hasText: 'Cancel' }).last(); // AI panel cancel button
  }

  async verifyModalOpen() {
    await expect(this.taskModal).toBeVisible();
  }

  async verifyModalClosed() {
    await expect(this.taskModal).not.toBeVisible();
  }

  async fillTaskForm(data: {
    title: string;
    description?: string;
    dueDate?: string;
    status?: string;
  }) {
    await this.titleInput.fill(data.title);
    
    if (data.description) {
      await this.descriptionInput.fill(data.description);
    }
    
    if (data.dueDate) {
      await this.dueDateInput.fill(data.dueDate);
    }
    
    if (data.status) {
      await this.statusSelect.selectOption(data.status);
    }
  }

  async createTask(data: {
    title: string;
    description?: string;
    dueDate?: string;
    status?: string;
  }) {
    await this.fillTaskForm(data);
    await this.createButton.click();
  }

  async updateTask(data: {
    title?: string;
    description?: string;
    dueDate?: string;
    status?: string;
  }) {
    if (data.title !== undefined) {
      await this.titleInput.clear();
      await this.titleInput.fill(data.title);
    }
    
    if (data.description !== undefined) {
      await this.descriptionInput.clear();
      await this.descriptionInput.fill(data.description);
    }
    
    if (data.dueDate !== undefined) {
      await this.dueDateInput.clear();
      await this.dueDateInput.fill(data.dueDate);
    }
    
    if (data.status) {
      await this.statusSelect.selectOption(data.status);
    }
    
    await this.updateButton.click();
  }

  async cancelTask() {
    await this.cancelButton.click();
  }

  async closeTask() {
    await this.closeButton.click();
  }

  async useAIGeneration() {
    await this.aiButton.click();
    await expect(this.aiGenerateButton).toBeVisible();
    await this.aiGenerateButton.click();
  }

  async cancelAIGeneration() {
    await this.aiButton.click();
    await this.aiCancelButton.click();
  }

  async verifyFormValues(data: {
    title?: string;
    description?: string;
    dueDate?: string;
    status?: string;
  }) {
    if (data.title !== undefined) {
      await expect(this.titleInput).toHaveValue(data.title);
    }
    
    if (data.description !== undefined) {
      await expect(this.descriptionInput).toHaveValue(data.description);
    }
    
    if (data.dueDate !== undefined) {
      await expect(this.dueDateInput).toHaveValue(data.dueDate);
    }
    
    if (data.status !== undefined) {
      await expect(this.statusSelect).toHaveValue(data.status);
    }
  }

  async verifyValidationErrors() {
    // Check for validation error messages - specifically look for the role="alert" with red text
    const errorMessages = this.page.locator('[role="alert"]');
    await expect(errorMessages).toBeVisible();
  }
}
