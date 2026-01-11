const request = require('supertest');
const express = require('express');
const timeEntryRoutes = require('../../routes/timeEntries');

// Test app
const app = express();
app.use(express.json());
app.use('/api/time-entries', timeEntryRoutes);

jest.mock('../../config/supabaseClient', () => {
  const { mockCreateChain } = jest.requireActual('../testHelper');
  const mockClient = mockCreateChain();
  mockClient.supabase = mockClient;
  mockClient.auth = { getUser: jest.fn() };
  mockClient.createClientWithToken = jest.fn(() => mockCreateChain());
  return mockClient;
});

const supabase = require('../../config/supabaseClient');
const { mockCreateChain } = require('../testHelper');

// Mock auth middleware
jest.mock('../../middlewares/authMiddleware', () => ({
  authenticateUser: jest.fn((req, res, next) => {
    req.user = { id: 'user-123', email: 'test@example.com' };
    next();
  })
}));

describe('Time Entries Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    supabase.from.mockImplementation(() => mockCreateChain());
  });

  it('POST /api/time-entries/complete should insert a summary row', async () => {
    const mockTask = { id: 1, user_id: 'user-123' };
    const mockEntries = [{ id: 10, start_time: new Date().toISOString(), end_time: new Date().toISOString() }];

    supabase.from.mockImplementation((table) => {
      if (table === 'tasks') return mockCreateChain(mockTask);
      if (table === 'time_entries') return mockCreateChain(mockEntries);
      return mockCreateChain();
    });

    const response = await request(app)
      .post('/api/time-entries/complete')
      .send({ task_id: 1, duration_ms: 5000 });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('entry');
  });

  it('POST /api/time-entries/stop should stop an active entry', async () => {
    const mockTask = { id: 1, user_id: 'user-123' };
    const mockActiveEntry = { id: 5, task_id: 1, start_time: new Date().toISOString() };

    supabase.from.mockImplementation((table) => {
      if (table === 'tasks') return mockCreateChain(mockTask);
      if (table === 'time_entries') return mockCreateChain(mockActiveEntry); // For the select().single() after update
      return mockCreateChain();
    });

    const response = await request(app)
      .post('/api/time-entries/stop')
      .send({ task_id: 1 });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('entry');
  });
});
