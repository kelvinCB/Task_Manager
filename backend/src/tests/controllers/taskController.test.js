const { createTask, getTasks, getTaskById, updateTask, deleteTask } = require('../../controllers/taskController');
const supabase = require('../../config/supabaseClient');

// Mock Supabase client (compatible with both legacy and new exports)
const buildClient = () => ({
  from: jest.fn(),
  auth: { getUser: jest.fn() }
});
jest.mock('../../config/supabaseClient', () => {
  const client = buildClient();
  return {
    // legacy shape used in some tests: require(...).from(...)
    from: client.from,
    auth: client.auth,
    // new named export shape: { supabase, createClientWithToken }
    supabase: client,
    createClientWithToken: jest.fn(() => buildClient())
  };
});

describe('Task Controller', () => {
  let req, res;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Mock request and response objects
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

    // Mock console.error to avoid cluttering test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
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
        message: 'Invalid status. Must be one of: Open, In Progress, Done'
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

      const mockOrder = jest.fn().mockResolvedValue({ data: mockTasks, error: null });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      supabase.from.mockReturnValue({ select: mockSelect });

      await getTasks(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ tasks: mockTasks });
    });

    it('should filter tasks by status', async () => {
      req.query.status = 'Done';

      const mockTasks = [{ id: 1, title: 'Task 1', status: 'Done', user_id: 'user-123' }];

      const mockEqStatus = jest.fn().mockResolvedValue({ data: mockTasks, error: null });
      const mockOrder = jest.fn().mockReturnValue({ eq: mockEqStatus });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      supabase.from.mockReturnValue({ select: mockSelect });

      await getTasks(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ tasks: mockTasks });
    });

    it('should return 400 for invalid status filter', async () => {
      req.query.status = 'invalid_status';

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

      const mockSingle = jest.fn().mockResolvedValue({ data: mockTask, error: null });
      const mockEqUser = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq = jest.fn().mockReturnValue({ eq: mockEqUser });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      supabase.from.mockReturnValue({ select: mockSelect });

      await getTaskById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ task: mockTask });
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
