import { test, expect } from '@playwright/test';
import { AuthPage } from './page-objects/auth.page';
import { AppPage } from './page-objects/app.page';
import { TaskPage } from './page-objects/task.page';
import path from 'path';

test.describe('File Upload Service', () => {
  let authPage: AuthPage;
  let appPage: AppPage;
  let taskPage: TaskPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    appPage = new AppPage(page);
    taskPage = new TaskPage(page);

    await page.goto('/login');
    // Assuming E2E_TEST_USER credentials are set in environment
    if (!process.env.E2E_USER_FILE_EMAIL || !process.env.E2E_USER_FILE_PASSWORD) {
      throw new Error('E2E_USER_FILE_EMAIL and E2E_USER_FILE_PASSWORD must be set in environment variables');
    }
    await authPage.login(process.env.E2E_USER_FILE_EMAIL, process.env.E2E_USER_FILE_PASSWORD);

    // Explicit wait loop for login success
    try {
      await expect(page).toHaveURL('/', { timeout: 10000 });
    } catch (e) {
      throw e;
    }

    // Verify Dashboard
    // Use a CSS selector to match either button, and take the first one visible
    await expect(page.locator('button[title="Board View"], button[title="Tree View"]').first()).toBeVisible({ timeout: 30000 });

    // Ensure everything is settled
    await page.waitForLoadState('networkidle');
  });

  test('should allow attaching a file to a new task', async ({ page }) => {
    test.setTimeout(90000); // Allow extra time for file upload and waiting

    // 1. Open New Task Modal using AppPage helper
    await appPage.openAddTaskModal();

    // Validate modal using TaskPage helper
    await taskPage.verifyModalOpen();

    // 2. Fill Title
    const uniqueTitle = `Task with Attachment ${Date.now()}`;
    await taskPage.titleInput.fill(uniqueTitle);

    // 3. Upload File
    const validFileName = 'test-image.png';
    const validFileBuffer = Buffer.from('fake image content');

    // Trigger file chooser
    // The component uses a hidden input file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: validFileName,
      mimeType: 'image/png',
      buffer: validFileBuffer
    });

    // 4. Verify upload success indicator
    // Component shows "Checking..." then "uploaded!"
    // Using loose matching in case backend sanitizes filename
    await expect(page.getByText(/uploaded!/)).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/uploaded!/)).toContainText(validFileName);

    // 5. Verify Description update and Attachment List
    // The description should NOT contain the attachment link anymore (it's separated)
    const description = await taskPage.descriptionInput.inputValue();
    expect(description).not.toContain(`**Attachment:**`);

    // Verify Attachment Item appears in the list
    const attachmentItem = page.getByTestId('attachment-item');
    await expect(attachmentItem).toBeVisible();
    await expect(attachmentItem).toContainText(validFileName);
    await expect(page.getByTestId('attachment-view-link')).toBeVisible();
    await expect(page.getByTestId('attachment-delete-btn')).toBeVisible();

    // 6. Save Task using TaskPage helper
    await taskPage.createButton.click();
    await taskPage.verifyModalClosed();

    // 7. Verify Task is created
    // We expect it to appear in the list
    await taskPage.page.waitForTimeout(1000); // Short wait for list update
    const taskLink = appPage.page.getByText(uniqueTitle).first();
    await expect(taskLink).toBeVisible();

    // 8. Open Task Detail and Verify Attachment
    await taskLink.click();

    // Explicitly wait for modal content
    const detailModal = page.locator('div[role="dialog"]'); // Assuming modal has role dialog, or check class
    // Or use text matching
    await expect(page.getByText('Description')).toBeVisible();

    // Verify Attachment Section
    await expect(page.getByText('Attachments', { exact: true })).toBeVisible();
    const detailAttachmentItem = page.getByTestId('attachment-item');
    await expect(detailAttachmentItem).toBeVisible();
    await expect(detailAttachmentItem).toContainText(validFileName);

    // Check View and Download links
    await expect(page.getByTestId('attachment-download-btn')).toBeVisible();
  });

  test('should allow attaching a markdown file', async ({ page }) => {
    test.setTimeout(90000);

    // 1. Open New Task Modal using AppPage helper
    await appPage.openAddTaskModal();

    // Validate modal using TaskPage helper
    await taskPage.verifyModalOpen();

    // 2. Fill Title
    const uniqueTitle = `Markdown Task ${Date.now()}`;
    await taskPage.titleInput.fill(uniqueTitle);

    // 3. Upload File
    const validFileName = 'notes.md';
    const validFileBuffer = Buffer.from('# My Notes\nInformation here');

    // Trigger file chooser
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: validFileName,
      mimeType: 'text/markdown',
      buffer: validFileBuffer
    });

    // 4. Verify upload success indicator
    await expect(page.getByText(/uploaded!/)).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/uploaded!/)).toContainText(validFileName);

    // 5. Verify Attachment List
    const attachmentItem = page.getByTestId('attachment-item');
    await expect(attachmentItem).toBeVisible();
    await expect(attachmentItem).toContainText(validFileName);

    // 6. Save Task
    await taskPage.createButton.click();
    await taskPage.verifyModalClosed();

    // 7. Verify Task is created
    await taskPage.page.waitForTimeout(1000);
    const taskLink = appPage.page.getByText(uniqueTitle).first();
    await expect(taskLink).toBeVisible();

    // 8. Open Task Detail and Verify Attachment
    await taskLink.click();
    
    const detailAttachmentItem = page.locator('div[role="dialog"]').getByTestId('attachment-item');
    await expect(detailAttachmentItem).toBeVisible({ timeout: 10000 });
    await expect(detailAttachmentItem).toContainText(validFileName);
  });
});
