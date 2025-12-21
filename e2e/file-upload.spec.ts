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
    console.log('[TEST] Starting beforeEach');
    authPage = new AuthPage(page);
    appPage = new AppPage(page);
    taskPage = new TaskPage(page);
    
    // Log browser console messages to stdout
    page.on('console', msg => console.log(`[BROWSER]: ${msg.text()}`));

    await page.goto('/login');
    console.log('[TEST] Navigated to /login');
    // Assuming E2E_TEST_USER credentials are set in environment
    await authPage.login(process.env.E2E_TEST_USER_EMAIL || 'test@example.com', process.env.E2E_TEST_USER_PASSWORD || 'password123');
    console.log('[TEST] Performed login action');
    
    // Explicit wait loop for login success
    try {
        await expect(page).toHaveURL('/', { timeout: 10000 });
    } catch (e) {
        console.log('[TEST ERROR] Login failed/timed out. Current URL:', page.url());
        console.log('[TEST ERROR] Body text:', await page.textContent('body'));
        
        // Retry logic: maybe registration needed?
        // For now, fail hard but with logs.
        throw e;
    }
    
    // Verify Dashboard
    await expect(page.getByTitle('Board View').first().or(page.getByTitle('Tree View').first())).toBeVisible({ timeout: 30000 });
    console.log('[TEST] Validated Dashboard loaded (beforeEach done)');
    
    // Ensure everything is settled
    await page.waitForLoadState('networkidle');
  });

  test('should allow attaching a file to a new task', async ({ page }) => {
    test.setTimeout(90000); // Allow extra time for file upload and waiting
    
    // 1. Open New Task Modal using AppPage helper
    console.log('[TEST] Opening Add Task Modal');
    await appPage.openAddTaskModal();
    console.log('[TEST] Clicked Add button');
    
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
    await expect(page.locator(`text=${validFileName} uploaded!`)).toBeVisible({ timeout: 30000 });
    console.log('[TEST] Upload success visible');

    // 5. Verify Description update
    // The description should now contain the attachment link
    const description = await taskPage.descriptionInput.inputValue();
    expect(description).toContain(`**Attachment:** [${validFileName}]`);
    console.log('[TEST] Description verification passed');

    // 6. Save Task using TaskPage helper
    await taskPage.createButton.click();
    console.log('[TEST] Clicked Save');
    await taskPage.verifyModalClosed();

    // 7. Verify Task is created
    // We expect it to appear in the list
    await taskPage.page.waitForTimeout(1000); // Short wait for list update
    await expect(appPage.page.getByText(uniqueTitle).first()).toBeVisible();
    console.log('[TEST] Task visible on dashboard');
  });
});
