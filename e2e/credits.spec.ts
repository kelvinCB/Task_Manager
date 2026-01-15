import { test, expect } from '@playwright/test';
import { AuthPage } from './page-objects/auth.page';
import { AppPage } from './page-objects/app.page';

import { createClient } from '@supabase/supabase-js';

test.describe('Credit Management', () => {
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

                // Clean up existing user to ensure fresh state
                const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
                if (!listError && users) {
                    const existingUser = users.find(u => u.email === noCreditsUser.email);
                    if (existingUser) {
                        await supabase.auth.admin.deleteUser(existingUser.id);
                        console.log(`Deleted existing test user: ${noCreditsUser.email}`);
                    }
                }

                const { data, error } = await supabase.auth.admin.createUser({
                    email: noCreditsUser.email,
                    password: noCreditsUser.password,
                    email_confirm: true
                });

                if (error) {
                    console.error(`User creation FAILED for ${noCreditsUser.email}:`, error.message);
                    throw error; // Fail the test setup if user creation fails
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

        // Click Generate AI button
        await page.click('button:has-text("Generate")');

        // 6. Verify "No Credits" Error Feedback
        const errorLocator = page.locator('[data-testid="ai-error-container"]');
        await expect(errorLocator).toBeVisible();
        await expect(errorLocator).toContainText(/credits|recargas/i);
    });
});
