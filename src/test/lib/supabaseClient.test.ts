import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(() => ({ auth: {} })),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: createClientMock,
}));

describe('supabaseClient', () => {
  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockClear();
    vi.stubEnv(
      'VITE_SUPABASE_URL',
      '  https://test-project.supabase.co///  ',
    );
    vi.stubEnv('VITE_SUPABASE_KEY', '  publishable-key  ');
  });

  it('creates a browser client with persistent, renewable OAuth sessions', async () => {
    const module = await import('../../lib/supabaseClient');

    expect(module.supabaseUrl).toBe('https://test-project.supabase.co');
    expect(createClientMock).toHaveBeenCalledWith(
      'https://test-project.supabase.co',
      'publishable-key',
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      },
    );
  });

  it('fails during startup when the project URL is unsafe', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'http://test-project.supabase.co');

    await expect(import('../../lib/supabaseClient')).rejects.toThrow(
      /https:\/\/<project-ref>\.supabase\.co/,
    );
    expect(createClientMock).not.toHaveBeenCalled();
  });
});
