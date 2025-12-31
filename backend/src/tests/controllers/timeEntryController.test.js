const { startEntry, stopEntry, getSummary, completeEntry } = require('../../controllers/timeEntryController');
const supabaseMod = require('../../config/supabaseClient');

const originalSupabase = supabaseMod.supabase;

describe('Time Entry Controller', () => {
  let req, res;
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();

    mockClient = {
      from: jest.fn(),
      auth: { getUser: jest.fn() }
    };
    
    supabaseMod.supabase = mockClient;

    req = {
      user: { id: 'user-123', email: 'test@example.com' },
      supabase: mockClient,
      body: {},
      params: {},
      query: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  afterEach(() => {
    supabaseMod.supabase = originalSupabase;
    jest.restoreAllMocks();
  });

  describe('startEntry', () => {
    it('should return 400 if task_id is missing', async () => {
      req.body = {};

      await startEntry(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation error',
        message: 'task_id is required'
      });
    });

    it('should return 404 for non-existent task', async () => {
      req.body = { task_id: 'task-999' };

      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } });
      const mockEqUser = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq = jest.fn().mockReturnValue({ eq: mockEqUser });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      mockClient.from.mockReturnValue({ select: mockSelect });

      await startEntry(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Not found',
        message: 'Task not found'
      });
    });
  });

  describe('stopEntry', () => {
    it('should return 404 if no open entry found', async () => {
      req.body = { task_id: 'task-123' };

      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } });
      const mockLimit = jest.fn().mockReturnValue({ single: mockSingle });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockEqTask =jest.fn().mockReturnValue({ order: mockOrder });
      const mockIs = jest.fn().mockReturnValue({ eq: mockEqTask });
      const mockEqUser = jest.fn().mockReturnValue({ is: mockIs });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEqUser });

      mockClient.from.mockReturnValue({ select: mockSelect });

      await stopEntry(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Not found',
        message: 'Open time entry not found'
      });
    });
  });

  describe('getSummary', () => {
    it('should return time summary successfully', async () => {
      req.query = {};

      const mockEntries = [];
      const mockEq = jest.fn().mockResolvedValue({ data: mockEntries, error: null });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      mockClient.from.mockReturnValue({ select: mockSelect });

      await getSummary(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ stats: [] });
    });
  });

  describe('completeEntry', () => {
    it('should validate task_id and duration_ms are required', async () => {
      req.body = { task_id: 'task-123' };

      await completeEntry(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation error',
        message: 'task_id and duration_ms are required'
      });
    });

    it('should return 404 for non-existent task', async () => {
      req.body = { task_id: 'task-999', duration_ms: 3600000 };

      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } });
      const mockEqUser = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq = jest.fn().mockReturnValue({ eq: mockEqUser });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      mockClient.from.mockReturnValue({ select: mockSelect });

      await completeEntry(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Not found',
        message: 'Task not found'
      });
    });
  });
});
