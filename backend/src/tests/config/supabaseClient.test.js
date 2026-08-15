describe('Supabase runtime configuration', () => {
  const originalEnvironment = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnvironment };
    jest.resetModules();
  });

  it('does not crash the Vercel function when Supabase variables are missing', () => {
    process.env.NODE_ENV = 'production';
    process.env.VERCEL = '1';
    delete process.env.SUPABASE_URL;
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.SUPABASE_KEY;
    delete process.env.SUPABASE_PUBLISHABLE_KEY;
    delete process.env.VITE_SUPABASE_KEY;

    let client;
    jest.isolateModules(() => {
      client = require('../../config/supabaseClient');
    });

    expect(client.supabase).toBeNull();
    expect(client.isSupabaseConfigured).toBe(false);
  });
});
