const request = require('supertest');
const express = require('express');
const timeEntryRoutes = require('../../routes/timeEntries');
const supabase = require('../../config/supabaseClient');

// Test app
const app = express();
app.use(express.json());
app.use('/api/time-entries', timeEntryRoutes);

// Mock Supabase client
const buildClient = () => ({
  from: jest.fn(),
  auth: { getUser: jest.fn() }
});
jest.mock('../../config/supabaseClient', () => {
  const client = buildClient();
  return {
    from: client.from,
    auth: client.auth,
    supabase: client,
    createClientWithToken: jest.fn(() => buildClient())
  };
});

// Mock auth middleware to always set a user
jest.mock('../../middlewares/authMiddleware', () => ({
  authenticateUser: jest.fn((req, res, next) => {
    req.user = { id: 'user-123', email: 'test@example.com' };
    next();
  })
}));

describe('Time Entries Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  it('POST /api/time-entries/complete should insert a summary row', async () => {
    // First call to supabase.from('tasks') for task ownership check
    const mockTaskSingle = jest.fn().mockResolvedValue({ data: { id: 1, user_id: 'user-123' }, error: null });
    const mockTaskEqUser = jest.fn().mockReturnValue({ single: mockTaskSingle });
    const mockTaskEq = jest.fn().mockReturnValue({ eq: mockTaskEqUser });
    const mockTaskSelect = jest.fn().mockReturnValue({ eq: mockTaskEq });

    // Second call to supabase.from('time_entries') for insert
    const mockInsertSingle = jest.fn().mockResolvedValue({ data: { id: 99 }, error: null });
    const mockInsertSelect = jest.fn().mockReturnValue({ single: mockInsertSingle });
    const mockInsert = jest.fn().mockReturnValue({ select: mockInsertSelect });

    let call = 0;
    supabase.from.mockImplementation(() => {
      call += 1;
      return call === 1 ? { select: mockTaskSelect } : { insert: mockInsert };
    });

    const response = await request(app)
      .post('/api/time-entries/complete')
      .send({ task_id: 1, duration_ms: 5000 });

    expect(response.status).toBe(201);
    expect(mockInsert).toHaveBeenCalled();
  });
});

