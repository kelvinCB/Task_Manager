const request = require('supertest');
const express = require('express');
const taskRoutes = require('../../routes/tasks');
const { authenticateUser } = require('../../middlewares/authMiddleware');
const supabase = require('../../config/supabaseClient');

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/tasks', taskRoutes);

// Mock Supabase client (compatible with both legacy and new exports)
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

// Mock authentication middleware
jest.mock('../../middlewares/authMiddleware', () => ({
  authenticateUser: jest.fn((req, res, next) => {
    req.user = { id: 'user-123', email: 'test@example.com' };
    next();
  }),
}));

describe('Task Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/tasks', () => {
    it('should create a new task successfully', async () => {
      const mockTask = {
        id: 1,
        title: 'Test Task',
        description: 'Test Description',
        status: 'todo',
        user_id: 'user-123'
      };

      const mockSingle = jest.fn().mockResolvedValue({ data: mockTask, error: null });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });

      supabase.from.mockReturnValue({ insert: mockInsert });

      const response = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Test Task',
          description: 'Test Description',
          status: 'todo'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('task');
      expect(response.body.task).toMatchObject({
        id: 1,
        title: 'Test Task'
      });
    });

    it('should return 400 for missing title', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({
          description: 'Test Description'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation error');
      expect(response.body).toHaveProperty('message', 'Title is required');
    });

    it('should return 400 for invalid status', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Test Task',
          status: 'invalid_status'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation error');
    });
  });

  describe('GET /api/tasks', () => {
    it('should get all tasks for authenticated user', async () => {
      const mockTasks = [
        { id: 1, title: 'Task 1', user_id: 'user-123' },
        { id: 2, title: 'Task 2', user_id: 'user-123' }
      ];

      const mockOrder = jest.fn().mockResolvedValue({ data: mockTasks, error: null });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      supabase.from.mockReturnValue({ select: mockSelect });

      const response = await request(app).get('/api/tasks');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tasks');
      expect(Array.isArray(response.body.tasks)).toBe(true);
      expect(response.body.tasks).toHaveLength(2);
    });

    it('should filter tasks by status', async () => {
      const mockTasks = [
        { id: 1, title: 'Task 1', status: 'done', user_id: 'user-123' }
      ];

      const mockEqStatus = jest.fn().mockResolvedValue({ data: mockTasks, error: null });
      const mockOrder = jest.fn().mockReturnValue({ eq: mockEqStatus });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      supabase.from.mockReturnValue({ select: mockSelect });

      const response = await request(app)
        .get('/api/tasks')
        .query({ status: 'done' });

      expect(response.status).toBe(200);
      expect(response.body.tasks).toHaveLength(1);
      expect(response.body.tasks[0].status).toBe('done');
    });

    it('should return 400 for invalid status filter', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .query({ status: 'invalid_status' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation error');
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should get a specific task by id', async () => {
      const mockTask = { id: 1, title: 'Task 1', user_id: 'user-123' };

      const mockSingle = jest.fn().mockResolvedValue({ data: mockTask, error: null });
      const mockEqUser = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq = jest.fn().mockReturnValue({ eq: mockEqUser });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      supabase.from.mockReturnValue({ select: mockSelect });

      const response = await request(app).get('/api/tasks/1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('task');
      expect(response.body.task.id).toBe(1);
    });

    it('should return 400 for invalid task id', async () => {
      const response = await request(app).get('/api/tasks/invalid');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation error');
      expect(response.body).toHaveProperty('message', 'Invalid task ID');
    });

    it('should return 404 for non-existent task', async () => {
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } });
      const mockEqUser = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq = jest.fn().mockReturnValue({ eq: mockEqUser });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      supabase.from.mockReturnValue({ select: mockSelect });

      const response = await request(app).get('/api/tasks/999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Not found');
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update a task successfully', async () => {
      const existingTask = { id: 1, title: 'Old Task', status: 'todo', user_id: 'user-123' };
      const updatedTask = { id: 1, title: 'Updated Task', status: 'in_progress', user_id: 'user-123' };

      const mockSingleExisting = jest.fn().mockResolvedValue({ data: existingTask, error: null });
      const mockEqUserExisting = jest.fn().mockReturnValue({ single: mockSingleExisting });
      const mockEqExisting = jest.fn().mockReturnValue({ eq: mockEqUserExisting });
      const mockSelectExisting = jest.fn().mockReturnValue({ eq: mockEqExisting });

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

      const response = await request(app)
        .put('/api/tasks/1')
        .send({
          title: 'Updated Task',
          status: 'in_progress'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('task');
      expect(response.body.task.title).toBe('Updated Task');
    });

    it('should return 404 for non-existent task', async () => {
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } });
      const mockEqUser = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq = jest.fn().mockReturnValue({ eq: mockEqUser });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      supabase.from.mockReturnValue({ select: mockSelect });

      const response = await request(app)
        .put('/api/tasks/999')
        .send({ title: 'Updated Task' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Not found');
    });

    it('should return 400 if no fields to update', async () => {
      const existingTask = { id: 1, title: 'Task', user_id: 'user-123' };

      const mockSingle = jest.fn().mockResolvedValue({ data: existingTask, error: null });
      const mockEqUser = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq = jest.fn().mockReturnValue({ eq: mockEqUser });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      supabase.from.mockReturnValue({ select: mockSelect });

      const response = await request(app)
        .put('/api/tasks/1')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation error');
      expect(response.body).toHaveProperty('message', 'No fields to update');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete a task successfully', async () => {
      const existingTask = { id: 1 };

      const mockSingle = jest.fn().mockResolvedValue({ data: existingTask, error: null });
      const mockEqUser = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq = jest.fn().mockReturnValue({ eq: mockEqUser });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

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

      const response = await request(app).delete('/api/tasks/1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Task deleted successfully');
      expect(response.body).toHaveProperty('task_id', '1');
    });

    it('should return 400 for invalid task id', async () => {
      const response = await request(app).delete('/api/tasks/invalid');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation error');
    });

    it('should return 404 for non-existent task', async () => {
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } });
      const mockEqUser = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq = jest.fn().mockReturnValue({ eq: mockEqUser });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      supabase.from.mockReturnValue({ select: mockSelect });

      const response = await request(app).delete('/api/tasks/999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Not found');
    });
  });

  describe('Error Handling', () => {
    it('should return JSON error for malformed requests', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBe(400);
    });

    it('should handle database errors gracefully', async () => {
      const mockOrder = jest.fn().mockRejectedValue(new Error('Database connection error'));
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      supabase.from.mockReturnValue({ select: mockSelect });

      const response = await request(app).get('/api/tasks');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Internal server error');
    });
  });
});
