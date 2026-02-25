
const { createTask, getTasks, getTaskById, updateTask, deleteTask } = require('../../controllers/taskController');
const supabaseMod = require('../../config/supabaseClient');
const { mockCreateChain } = require('../testHelper');

// Save original items
const originalSupabase = supabaseMod.supabase;
const originalCreateClientWithToken = supabaseMod.createClientWithToken;

describe('Task Controller', () => {
  let req, res;
  let mockClient;
  let supabase;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create fresh mock client for each test
    mockClient = mockCreateChain();
    mockClient.auth = { getUser: jest.fn() };

    // Inject mock into the live module
    supabaseMod.supabase = mockClient;
    supabaseMod.createClientWithToken = jest.fn(() => mockClient);

    // Expose as 'supabase' for test convenience
    // This allows existing test code `supabase.from` to access `mockClient.from`
    supabase = mockClient;

    req = {
      user: { id: 'user-123', email: 'test@example.com' },
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
    // Restore original module state!
    supabaseMod.supabase = originalSupabase;
    supabaseMod.createClientWithToken = originalCreateClientWithToken;
    jest.restoreAllMocks();
  });

  describe('createTask', () => {
    it('should create a task successfully', async () => {
      req.body = {
        title: 'Test Task',
        description: 'Test Description',
        status: 'Open'
      };

      const mockTask = {
        id: 1,
        title: 'Test Task',
        description: 'Test Description',
        status: 'Open',
        user_id: 'user-123'
      };

      const mockSingle = jest.fn().mockResolvedValue({ data: mockTask, error: null });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });

      supabase.from.mockReturnValue({
        insert: mockInsert
      });

      await createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ task: mockTask });
    });

    it('should create a task with estimation and responsible fields', async () => {
      req.body = {
        title: 'Task with Fields',
        estimation: 5,
        responsible: 'John Doe'
      };

      const mockTask = {
        id: 1,
        title: 'Task with Fields',
        estimation: 5,
        responsible: 'John Doe',
        user_id: 'user-123'
      };

      const mockSingle = jest.fn().mockResolvedValue({ data: mockTask, error: null });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });

      supabase.from.mockReturnValue({ insert: mockInsert });

      await createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ task: mockTask });
      // Verify insert arguments include new fields
      expect(mockInsert).toHaveBeenCalledWith([expect.objectContaining({
        estimation: 5,
        responsible: 'John Doe'
      })]);
    });

    it('should return 400 if title is missing', async () => {
      req.body = { description: 'Test Description' };

      await createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation error',
        message: 'Title is required'
      });
    });

    it('should return 400 if status is invalid', async () => {
      req.body = {
        title: 'Test Task',
        status: 'invalid_status'
      };

      await createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation error',
        message: 'Invalid status. Must be one of: Open, In Progress, Review, Done'
      });
    });

    it('should return 400 if estimation is invalid', async () => {
      req.body = {
        title: 'Test Task',
        estimation: 4
      };

      await createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation error',
        message: 'Invalid estimation. Must be one of: 1, 2, 3, 5, 8, 13'
      });
    });

    it('should return 404 if parent task does not exist', async () => {
      req.body = {
        title: 'Test Task',
        parent_id: 999
      };

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
          })
        })
      });

      supabase.from.mockReturnValue({ select: mockSelect });

      await createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Not found',
        message: 'Parent task not found or does not belong to you'
      });
    });

    it('should map check violations to 400 on create', async () => {
      req.body = { title: 'Test Task', estimation: 5 };

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: { code: '23514', message: 'new row violates check constraint' } })
        })
      });

      supabase.from.mockReturnValue({ insert: mockInsert });

      await createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation error',
        message: 'new row violates check constraint'
      });
    });

    it('should handle database errors', async () => {
      req.body = { title: 'Test Task' };

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
        })
      });

      supabase.from.mockReturnValue({ insert: mockInsert });

      await createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Failed to create task'
      });
    });
  });

  describe('getTasks', () => {
    it('should get all tasks for authenticated user', async () => {
      const mockTasks = [
        { id: 1, title: 'Task 1', user_id: 'user-123' },
        { id: 2, title: 'Task 2', user_id: 'user-123' }
      ];

      supabase.from.mockImplementation((table) => {
        if (table === 'tasks') return mockCreateChain(mockTasks);
        if (table === 'time_entries') return mockCreateChain([]);
        return mockCreateChain();
      });

      await getTasks(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ tasks: mockTasks.map(t => ({ ...t, active_start_time: null })) });
    });

    it('should filter tasks by status', async () => {
      req.query.status = 'Done';

      const mockTasks = [{ id: 1, title: 'Task 1', status: 'Done', user_id: 'user-123' }];

      supabase.from.mockImplementation((table) => {
        if (table === 'tasks') return mockCreateChain(mockTasks);
        if (table === 'time_entries') return mockCreateChain([]);
        return mockCreateChain();
      });

      await getTasks(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ tasks: mockTasks.map(t => ({ ...t, active_start_time: null })) });
    });

    it('should return 400 for invalid status filter', async () => {
      req.query.status = 'invalid_status';

      // Mock db chain (needed because query is built before validation)
      const mockOrder = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      supabase.from.mockReturnValue({ select: mockSelect });

      await getTasks(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation error',
        message: 'Invalid status filter'
      });
    });

    it('should handle database errors', async () => {
      const mockOrder = jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      supabase.from.mockReturnValue({ select: mockSelect });

      await getTasks(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Failed to fetch tasks'
      });
    });
  });

  describe('getTaskById', () => {
    it('should get a task by id', async () => {
      req.params.id = '1';

      const mockTask = { id: 1, title: 'Task 1', user_id: 'user-123' };

      supabase.from.mockImplementation((table) => {
        if (table === 'tasks') return mockCreateChain(mockTask);
        if (table === 'time_entries') return mockCreateChain(null); // maybeSingle
        return mockCreateChain();
      });

      await getTaskById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ task: { ...mockTask, active_start_time: null } });
    });

    it('should return 400 for invalid task id', async () => {
      req.params.id = 'invalid';

      await getTaskById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation error',
        message: 'Invalid task ID'
      });
    });

    it('should return 404 if task not found', async () => {
      req.params.id = '999';

      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } });
      const mockEqUser = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq = jest.fn().mockReturnValue({ eq: mockEqUser });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      supabase.from.mockReturnValue({ select: mockSelect });

      await getTaskById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Not found',
        message: 'Task not found'
      });
    });

    it('should handle database errors', async () => {
      req.params.id = '1';

      const mockSingle = jest.fn().mockRejectedValue(new Error('Database error'));
      const mockEqUser = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq = jest.fn().mockReturnValue({ eq: mockEqUser });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      supabase.from.mockReturnValue({ select: mockSelect });

      await getTaskById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Failed to fetch task'
      });
    });

    it('should return all task fields including total_time_ms', async () => {
      req.params.id = '1';

      const mockTask = {
        id: 1,
        title: 'Task 1',
        description: 'Desc',
        status: 'Done',
        user_id: 'user-123',
        created_at: '2023-01-01T00:00:00Z',
        due_date: '2023-01-02',
        parent_id: null,
        total_time_ms: 5000
      };

      supabase.from.mockImplementation((table) => {
        if (table === 'tasks') return mockCreateChain(mockTask);
        if (table === 'time_entries') return mockCreateChain(null);
        return mockCreateChain();
      });

      await getTaskById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ task: { ...mockTask, active_start_time: null } });
    });
  });

  describe('updateTask', () => {
    it('should update a task successfully', async () => {
      req.params.id = '1';
      req.body = { title: 'Updated Task', status: 'In Progress' };

      const existingTask = { id: 1, title: 'Old Task', status: 'Open', user_id: 'user-123' };
      const updatedTask = { id: 1, title: 'Updated Task', status: 'In Progress', user_id: 'user-123' };

      // Mock for checking existing task
      const mockSingleExisting = jest.fn().mockResolvedValue({ data: existingTask, error: null });
      const mockEqUserExisting = jest.fn().mockReturnValue({ single: mockSingleExisting });
      const mockEqExisting = jest.fn().mockReturnValue({ eq: mockEqUserExisting });
      const mockSelectExisting = jest.fn().mockReturnValue({ eq: mockEqExisting });

      // Mock for update
      const mockSingleUpdate = jest.fn().mockResolvedValue({ data: updatedTask, error: null });
      const mockSelectUpdate = jest.fn().mockReturnValue({ single: mockSingleUpdate });
      const mockEqUserUpdate = jest.fn().mockReturnValue({ select: mockSelectUpdate });
      const mockEqUpdate = jest.fn().mockReturnValue({ eq: mockEqUserUpdate });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEqUpdate });

      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { select: mockSelectExisting };
        } else {
          return { update: mockUpdate };
        }
      });

      await updateTask(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ task: updatedTask });
    });

    it('should update estimation and responsible fields', async () => {
      req.params.id = '1';
      req.body = { estimation: 8, responsible: 'Alice' };

      const existingTask = { id: 1, title: 'Task', user_id: 'user-123' };
      const updatedTask = { id: 1, title: 'Task', estimation: 8, responsible: 'Alice', user_id: 'user-123' };

      // Mock for checking existing task
      const mockSingleExisting = jest.fn().mockResolvedValue({ data: existingTask, error: null });
      const mockEqUserExisting = jest.fn().mockReturnValue({ single: mockSingleExisting });
      const mockEqExisting = jest.fn().mockReturnValue({ eq: mockEqUserExisting });
      const mockSelectExisting = jest.fn().mockReturnValue({ eq: mockEqExisting });

      // Mock for update
      const mockSingleUpdate = jest.fn().mockResolvedValue({ data: updatedTask, error: null });
      const mockSelectUpdate = jest.fn().mockReturnValue({ single: mockSingleUpdate });
      const mockEqUserUpdate = jest.fn().mockReturnValue({ select: mockSelectUpdate });
      const mockEqUpdate = jest.fn().mockReturnValue({ eq: mockEqUserUpdate });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEqUpdate });

      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { select: mockSelectExisting };
        } else {
          return { update: mockUpdate };
        }
      });

      await updateTask(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ task: updatedTask });
      // Verify update arguments
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        estimation: 8,
        responsible: 'Alice'
      }));
    });

    it('should return 400 if estimation is invalid on update', async () => {
      req.params.id = '1';
      req.body = { estimation: 4 };

      const existingTask = { id: 1, title: 'Task', user_id: 'user-123' };
      const mockSingle = jest.fn().mockResolvedValue({ data: existingTask, error: null });
      const mockEqUser = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq = jest.fn().mockReturnValue({ eq: mockEqUser });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      supabase.from.mockReturnValue({ select: mockSelect });

      await updateTask(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation error',
        message: 'Invalid estimation. Must be one of: 1, 2, 3, 5, 8, 13'
      });
    });

    it('should return 400 if no fields to update', async () => {
      req.params.id = '1';
      req.body = {};

      const existingTask = { id: 1, title: 'Task', user_id: 'user-123' };

      const mockSingle = jest.fn().mockResolvedValue({ data: existingTask, error: null });
      const mockEqUser = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq = jest.fn().mockReturnValue({ eq: mockEqUser });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      supabase.from.mockReturnValue({ select: mockSelect });

      await updateTask(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation error',
        message: 'No fields to update'
      });
    });

    it('should return 404 if task not found', async () => {
      req.params.id = '999';
      req.body = { title: 'Updated Task' };

      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } });
      const mockEqUser = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq = jest.fn().mockReturnValue({ eq: mockEqUser });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      supabase.from.mockReturnValue({ select: mockSelect });

      await updateTask(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Not found',
        message: 'Task not found'
      });
    });

    it('should return 400 if task tries to be its own parent', async () => {
      req.params.id = '1';
      req.body = { parent_id: 1 };

      const existingTask = { id: 1, title: 'Task', parent_id: null, user_id: 'user-123' };

      const mockSingle = jest.fn().mockResolvedValue({ data: existingTask, error: null });
      const mockEqUser = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq = jest.fn().mockReturnValue({ eq: mockEqUser });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      supabase.from.mockReturnValue({ select: mockSelect });

      await updateTask(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation error',
        message: 'A task cannot be its own parent'
      });
    });

    it('should handle database errors', async () => {
      req.params.id = '1';
      req.body = { title: 'Updated Task' };

      const mockSingle = jest.fn().mockRejectedValue(new Error('Database error'));
      const mockEqUser = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq = jest.fn().mockReturnValue({ eq: mockEqUser });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      supabase.from.mockReturnValue({ select: mockSelect });

      await updateTask(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Failed to update task'
      });
    });
  });

  describe('deleteTask', () => {
    it('should delete a task successfully', async () => {
      req.params.id = '1';

      const existingTask = { id: 1 };

      // Mock for checking existing task
      const mockSingle = jest.fn().mockResolvedValue({ data: existingTask, error: null });
      const mockEqUser = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq = jest.fn().mockReturnValue({ eq: mockEqUser });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      // Mock for delete
      const mockEqUserDelete = jest.fn().mockResolvedValue({ error: null });
      const mockEqDelete = jest.fn().mockReturnValue({ eq: mockEqUserDelete });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockEqDelete });

      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { select: mockSelect };
        } else {
          return { delete: mockDelete };
        }
      });

      await deleteTask(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Task deleted successfully',
        task_id: '1'
      });
    });

    it('should return 400 for invalid task id', async () => {
      req.params.id = 'invalid';

      await deleteTask(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation error',
        message: 'Invalid task ID'
      });
    });

    it('should return 404 if task not found', async () => {
      req.params.id = '999';

      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } });
      const mockEqUser = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq = jest.fn().mockReturnValue({ eq: mockEqUser });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      supabase.from.mockReturnValue({ select: mockSelect });

      await deleteTask(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Not found',
        message: 'Task not found'
      });
    });

    it('should handle database errors', async () => {
      req.params.id = '1';

      const mockSingle = jest.fn().mockRejectedValue(new Error('Database error'));
      const mockEqUser = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq = jest.fn().mockReturnValue({ eq: mockEqUser });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      supabase.from.mockReturnValue({ select: mockSelect });

      await deleteTask(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Failed to delete task'
      });
    });
  });
});
