
const supabaseMod = require('../../config/supabaseClient');
const { mockCreateChain } = require('../testHelper');

// Mock supabaseClient before requiring controller
jest.mock('../../config/supabaseClient', () => {
  const { mockCreateChain } = jest.requireActual('../testHelper');
  const mock = mockCreateChain();
  mock.auth = { getUser: jest.fn() };
  return {
    supabase: mock,
    createClientWithToken: jest.fn(() => mock)
  };
});

const { startEntry, stopEntry, getSummary, completeEntry } = require('../../controllers/timeEntryController');
const { supabase } = require('../../config/supabaseClient');

describe('Time Entry Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      user: { id: 'user-123' },
      body: {},
      query: {},
      params: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Default mock for all tables
    supabase.from.mockImplementation(() => mockCreateChain());
  });

  describe('startEntry', () => {
    it('should start a time entry successfully', async () => {
      req.body = { task_id: 1 };
      const mockTask = { id: 1, user_id: 'user-123', status: 'Open' };
      const mockNewEntry = { id: 10, task_id: 1, user_id: 'user-123', start_time: new Date().toISOString() };

      supabase.from.mockImplementation((table) => {
        if (table === 'tasks') return mockCreateChain(mockTask);
        if (table === 'time_entries') {
          const chain = mockCreateChain(null); // Default for maybeSingle (no existing entry)
          // But for insert().select().single() we need mockNewEntry
          chain.insert.mockReturnValue(mockCreateChain(mockNewEntry));
          return chain;
        }
        return mockCreateChain();
      });

      await startEntry(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ entry: mockNewEntry });
    });

    it('should return 400 if task_id is missing', async () => {
      req.body = {};
      await startEntry(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return existing entry if timer already active', async () => {
      req.body = { task_id: 1 };
      const mockExistingEntry = { id: 5, task_id: 1, user_id: 'user-123', end_time: null };

      supabase.from.mockImplementation((table) => {
        if (table === 'time_entries') return mockCreateChain(mockExistingEntry);
        return mockCreateChain();
      });

      await startEntry(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'A timer is already active for this task'
      }));
    });

    it('should return 404 if task not found', async () => {
      req.body = { task_id: 999 };
      supabase.from.mockImplementation((table) => {
        if (table === 'tasks') return mockCreateChain(null);
        return mockCreateChain();
      });

      await startEntry(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('stopEntry', () => {
    it('should stop an active entry successfully', async () => {
      req.body = { task_id: 1 };
      const mockEntry = { id: 5, task_id: 1, user_id: 'user-123', start_time: '2023-01-01T10:00:00Z' };
      const mockStoppedEntry = { ...mockEntry, end_time: new Date().toISOString() };

      supabase.from.mockImplementation((table) => {
        if (table === 'time_entries') {
          const chain = mockCreateChain(mockEntry); // For find entry
          // For update().eq().eq().select().single()
          chain.update.mockReturnValue(mockCreateChain(mockStoppedEntry));
          // For sync (select all) - use then override or just return array in mockCreateChain
          // syncTaskTotalTime does: const { data: entries, error } = await db.from('time_entries').select('...').eq('...').eq('...')
          // So we need a chain that resolves to an array.
          const syncChain = mockCreateChain([mockStoppedEntry]);

          let callCount = 0;
          const originalFrom = supabase.from;
          // This is getting complicated. Let's just make mockCreateChain resolve to array if needed.
          // Or override 'then' for the sync call.

          // Actually, stopEntry calls db.from('time_entries') twice.
          // 1. find entry (single)
          // 2. update entry (single)
          // Then syncTaskTotalTime calls it again:
          // 3. select all (list)
          // 4. update task (different table)

          callCount++;
          if (callCount === 1) return chain; // find
          if (callCount === 2) return chain; // update (chain.update is mocked)
          return syncChain; // syncTaskTotalTime select
        }
        return mockCreateChain({}); // sync update task
      });

      await stopEntry(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ entry: mockStoppedEntry });
    });

    it('should stop an active entry by entry_id successfully', async () => {
      req.body = { entry_id: 5 };
      const mockEntry = { id: 5, task_id: 1, user_id: 'user-123', start_time: '2023-01-01T10:00:00Z' };
      const mockStoppedEntry = { ...mockEntry, end_time: new Date().toISOString() };

      supabase.from.mockImplementation((table) => {
        if (table === 'time_entries') return mockCreateChain(mockEntry);
        return mockCreateChain({});
      });

      await stopEntry(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ entry: expect.objectContaining({ id: 5 }) });
    });

    it('should return 404 if no active entry found', async () => {
      req.body = { task_id: 1 };
      supabase.from.mockReturnValue(mockCreateChain(null));

      await stopEntry(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getSummary', () => {
    it('should return summary stats successfully', async () => {
      const mockEntries = [
        { id: 1, task_id: 1, start_time: '2023-01-01T10:00:00Z', end_time: '2023-01-01T11:00:00Z' }
      ];
      const mockTasks = [{ id: 1, title: 'Task 1', status: 'In Progress' }];

      supabase.from.mockImplementation((table) => {
        if (table === 'time_entries') return mockCreateChain(mockEntries);
        if (table === 'tasks') return mockCreateChain(mockTasks);
        return mockCreateChain();
      });

      await getSummary(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ stats: expect.any(Array) }));
    });
  });

  describe('completeEntry', () => {
    it('should record summary row successfully', async () => {
      req.body = { task_id: 1, duration_ms: 1000 };
      const mockTask = { id: 1, user_id: 'user-123' };
      const mockEntry = { id: 10, task_id: 1, duration_ms: 1000, start_time: new Date().toISOString(), end_time: new Date().toISOString() };

      supabase.from.mockImplementation((table) => {
        if (table === 'tasks') return mockCreateChain(mockTask);
        if (table === 'time_entries') {
          const chain = mockCreateChain([mockEntry]); // Resolves to array for syncTaskTotalTime
          chain.insert.mockReturnValue(mockCreateChain(mockEntry)); // Resolves to object for insert
          return chain;
        }
        return mockCreateChain();
      });

      await completeEntry(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ entry: mockEntry });
    });

    it('should return 404 if task not found', async () => {
      req.body = { task_id: 999, duration_ms: 1000 };
      supabase.from.mockImplementation((table) => {
        if (table === 'tasks') return mockCreateChain(null);
        return mockCreateChain();
      });

      await completeEntry(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 if task_id or duration_ms missing', async () => {
      req.body = { task_id: 1 };
      await completeEntry(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
