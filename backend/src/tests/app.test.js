const request = require('supertest');
const app = require('../app');

describe('Express application health routes', () => {
  it('serves health diagnostics through the Vercel /api path', async () => {
    const response = await request(app).get('/api/health');

    expect([200, 503]).toContain(response.status);
    expect(response.body).toEqual(expect.objectContaining({
      status: expect.any(String),
      supabase: expect.any(String),
      personal_access_tokens: expect.any(String)
    }));
  });
});
