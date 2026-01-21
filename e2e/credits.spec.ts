import { test, expect } from '@playwright/test';
import { AuthPage } from './page-objects/auth.page';
import { AppPage } from './page-objects/app.page';

import { createClient } from '@supabase/supabase-js';

test.describe('Credit Management', () => {
    test.describe.configure({ mode: 'serial' });

    let authPage: AuthPage;
    let appPage: AppPage;
    let userId: string;

    const noCreditsUser = {
        email: process.env.E2E_USER_NO_CREDITS_EMAIL || '',
        password: process.env.E2E_USER_NO_CREDITS_PASSWORD || ''
    };

    // Fix viewport for headed mode debugging
    test.use({
        viewport: { width: 1280, height: 720 }
    });

    const adminSecret = process.env.ADMIN_API_SECRET || '';
    const apiUrl = process.env.VITE_BACKEND_URL || 'http://localhost:3001';

    test.beforeAll(async () => {
        if (!noCreditsUser.email || !adminSecret) {
            console.warn('Skipping credits test: Missing status credentials or admin secret');
            test.skip();
        }

        // Ensure user exists using Supabase Admin
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_KEY;

        if (supabaseUrl && serviceKey) {
            try {
                const supabase = createClient(supabaseUrl, serviceKey, {
                    auth: {
                        autoRefreshToken: false,
                        persistSession: false
                    }
                });

                // Attempt to create user
                const { data, error } = await supabase.auth.admin.createUser({
                    email: noCreditsUser.email,
                    password: noCreditsUser.password,
                    email_confirm: true
                });

                if (error) {
                    if (error.message.includes('already been registered') || error.code === 'email_exists') {
                        console.log(`User ${noCreditsUser.email} already exists, fetching existing user...`);
                        const { data: { users } } = await supabase.auth.admin.listUsers();
                        const existingUser = users?.find(u => u.email === noCreditsUser.email);
                        if (existingUser) {
                            userId = existingUser.id;
                            // Reset password just in case
                            await supabase.auth.admin.updateUserById(userId, { password: noCreditsUser.password });
                        } else {
                            // If not found in first page, we really have a problem or need to search better
                            // But for E2E this usually means it's one of the first few
                            throw new Error(`User claimed to exist but not found in first page of users: ${noCreditsUser.email}`);
                        }
                    } else {
                        console.error(`User creation FAILED for ${noCreditsUser.email}:`, error.message);
                        throw error;
                    }
                } else {
                    console.log(`User ${noCreditsUser.email} created successfully. ID: ${data.user?.id}`);
                    userId = data.user.id;
                }

                // Wait for Profile creation (handled by Supabase Trigger)
                let profileExists = false;
                for (let i = 0; i < 10; i++) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('id')
                        .eq('id', userId)
                        .maybeSingle(); // or .select and check length

                    if (profile) {
                        console.log('Profile confirmed created via Trigger');
                        profileExists = true;
                        break;
                    }
                    console.log('Waiting for profile creation...');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

                if (!profileExists) {
                    console.warn('Profile was NOT created by trigger. Attempting manual creation...');
                    // Fallback check? Or fail? failing is better to know.
                    // But let's try manual insert if trigger is broken locally
                    await supabase.from('profiles').insert({ id: userId, email: noCreditsUser.email }).select();
                }
            } catch (err) {
                console.error('Failed to initialize Supabase Admin for test setup:', err);
                // We should probably throw here so the test fails fast
                throw err;
            }
        }
    });

    test('should show error when user has no credits', async ({ page, request }) => {
        if (!process.env.SUPABASE_SERVICE_KEY) {
            console.warn('Skipping test: SUPABASE_SERVICE_KEY not found');
            test.skip();
        }
        authPage = new AuthPage(page);
        appPage = new AppPage(page);

        // 1. Login
        await authPage.goToLogin();
        await authPage.login(noCreditsUser.email, noCreditsUser.password);
        await authPage.expectLoggedIn();

        // 2. Set Credits to 0 via Admin API (User ID captured in beforeAll)
        // Ensure userId is present
        expect(userId).toBeDefined();

        const setCreditsResponse = await request.post(`${apiUrl}/api/admin/credits/set`, {
            headers: {
                'x-admin-secret': adminSecret
            },
            data: {
                userId: userId,
                amount: 0
            }
        });
        if (!setCreditsResponse.ok()) {
            console.error('Set Credits Failed:', setCreditsResponse.status(), await setCreditsResponse.text());
        }
        expect(setCreditsResponse.ok()).toBeTruthy();
        const setCreditsData = await setCreditsResponse.json();
        expect(setCreditsData.current).toBe(0);

        // 4. Reload page to reflect 0 credits (context update)
        await page.reload();
        await authPage.expectLoggedIn();

        // 5. Attempt AI Action (Generate Description)
        await appPage.openAddTaskModal();
        await page.fill('#task-title', 'Test Task No Credits');

        // Click Generate AI - Assuming specific selector or text
        // Click AI Assistant button to open options
        await page.click('button[title="AI Assistant"]');

        // Wait for options panel
        await page.waitForTimeout(500);

        // Click Generate Description button
        await page.click('button:has-text("Generate Description")');

        // 6. Verify "No Credits" Error Feedback
        const errorLocator = page.locator('[data-testid="ai-error-container"]');
        await expect(errorLocator).toBeVisible();
        await expect(errorLocator).toContainText(/credits|recargas/i);
    });

    test('should show error when generating image with no credits', async ({ page, request }) => {
        if (!process.env.SUPABASE_SERVICE_KEY) {
            test.skip();
        }
        authPage = new AuthPage(page);
        appPage = new AppPage(page);

        // 1. Login
        await authPage.goToLogin();
        await authPage.login(noCreditsUser.email, noCreditsUser.password);
        await authPage.expectLoggedIn();

        // 2. Set Credits to 0 via Admin API
        const setCreditsResponse = await request.post(`${apiUrl}/api/admin/credits/set`, {
            headers: { 'x-admin-secret': adminSecret },
            data: { userId: userId, amount: 0 }
        });
        expect(setCreditsResponse.ok()).toBeTruthy();
        const setCreditsData = await setCreditsResponse.json();
        expect(setCreditsData.current).toBe(0);

        // 3. Reload and attempt Image Generation
        await page.reload();
        await authPage.expectLoggedIn();
        await appPage.openAddTaskModal();
        await page.fill('#task-title', 'Test Image Gen No Credits');

        // Open AI Options
        await page.click('button[title="AI Assistant"]');
        await page.waitForTimeout(500);

        // Click Generate Image button to show prompt input
        await page.click('button:has-text("Generate Image")');

        // Wait for prompt input and fill it
        const promptInput = page.locator('textarea[placeholder*="Describe the image"]');
        await expect(promptInput).toBeVisible();
        await promptInput.fill('A test image prompt');

        // Click Confirm to generate
        await page.click('button:has-text("Confirm")');

        // Verify "No Credits" Error Feedback
        const errorLocator = page.locator('[data-testid="ai-error-container"]');
        await expect(errorLocator).toBeVisible();
        // The error message might differ slightly but generally mentions credits
        await expect(errorLocator).toContainText(/credits|recargas/i);
    });
});
