import { beforeEach, describe, expect, it, vi } from 'vitest';
import { personalAccessTokenService } from '../../services/personalAccessTokenService';
import supabase from '../../lib/supabaseClient';

vi.mock('../../lib/supabaseClient', () => ({
  default: {
    auth: {
      getSession: vi.fn()
    }
  }
}));

describe('personalAccessTokenService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { access_token: 'supabase-session-token' } }
    } as Awaited<ReturnType<typeof supabase.auth.getSession>>);
  });

  it('lists the current user personal access tokens', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ tokens: [{ id: 'token-1' }] }), { status: 200 })));

    await expect(personalAccessTokenService.list()).resolves.toEqual([{ id: 'token-1' }]);
    expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/personal-access-tokens', expect.objectContaining({
      headers: expect.any(Headers)
    }));
  });

  it('creates a token and returns the raw value exactly once', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      token: 'kolium_pat_secret',
      personal_access_token: { id: 'token-1', name: 'MCP' }
    }), { status: 201 })));

    await expect(personalAccessTokenService.create('MCP', 90)).resolves.toEqual({
      token: 'kolium_pat_secret',
      personalAccessToken: { id: 'token-1', name: 'MCP' }
    });
    expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/personal-access-tokens', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ name: 'MCP', expires_in_days: 90 })
    }));
  });

  it('surfaces API errors to the settings UI', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'Token revoked' }), { status: 401 })));

    await expect(personalAccessTokenService.list()).rejects.toThrow('Token revoked');
  });
});
