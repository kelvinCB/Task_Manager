const request = require('supertest');
const express = require('express');
const { mockCreateChain } = require('../testHelper');

const mockSupabase = mockCreateChain();

jest.mock('../../config/supabaseClient', () => ({
  supabase: mockSupabase,
  adminSupabase: mockSupabase,
  isSupabaseConfigured: true,
  isServiceRoleConfigured: true
}));

jest.mock('../../middlewares/authMiddleware', () => ({
  authenticateUser: jest.fn((req, res, next) => {
    req.user = { id: 'user-123' };
    req.auth = { type: 'supabase' };
    req.supabase = mockSupabase;
    next();
  })
}));

const tokenRoutes = require('../../routes/personalAccessTokens');
const app = express();
app.use(express.json());
app.use('/api/personal-access-tokens', tokenRoutes);

describe('Personal access token routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a token without returning the stored hash', async () => {
    const storedToken = {
      id: 'token-1',
      name: 'Kolium MCP',
      token_prefix: 'kolium_pat_12345678',
      created_at: new Date().toISOString(),
      last_used_at: null,
      expires_at: null,
      revoked_at: null
    };
    mockSupabase.from.mockReturnValue(mockCreateChain(storedToken));

    const response = await request(app)
      .post('/api/personal-access-tokens')
      .send({ name: 'Kolium MCP', expires_in_days: 90 });

    expect(response.status).toBe(201);
    expect(response.body.token).toMatch(/^kolium_pat_/);
    expect(response.body.personal_access_token).toEqual(storedToken);
    expect(response.body.personal_access_token.token_hash).toBeUndefined();
  });

  it('rejects an invalid token expiration', async () => {
    const response = await request(app)
      .post('/api/personal-access-tokens')
      .send({ name: 'Kolium MCP', expires_in_days: 0 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation error');
  });

  it('lists and revokes tokens for the authenticated user', async () => {
    const storedToken = { id: 'token-1', name: 'Kolium MCP', revoked_at: null };
    mockSupabase.from.mockReturnValue(mockCreateChain([storedToken]));
    const listResponse = await request(app).get('/api/personal-access-tokens');
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.tokens).toEqual([storedToken]);

    mockSupabase.from.mockReturnValue(mockCreateChain({ ...storedToken, revoked_at: new Date().toISOString() }));
    const revokeResponse = await request(app).post('/api/personal-access-tokens/token-1/revoke');
    expect(revokeResponse.status).toBe(200);
    expect(revokeResponse.body.token.id).toBe('token-1');
  });
});
