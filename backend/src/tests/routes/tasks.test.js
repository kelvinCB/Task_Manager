const request = require('supertest');
const express = require('express');
const taskRoutes = require('../../routes/tasks');

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/tasks', taskRoutes);

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

// Mock authentication middleware
jest.mock('../../middlewares/authMiddleware', () => ({
  authenticateUser: jest.fn((req, res, next) => {
    req.user = { id: 'user-123', email: 'test@example.com' };
    next();
  })
}));

describe('Task Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock for from() to return a basic chain
    supabase.from.mockImplementation(() => mockCreateChain());
  });

  describe('POST /api/tasks', () => {
    it('should create a new task successfully', async () => {
      const mockTask = { id: 1, title: 'Test Task', user_id: 'user-123' };
      supabase.from.mockReturnValue(mockCreateChain(mockTask));

      const response = await request(app)
        .post('/api/tasks')
        .send({ title: 'Test Task' });

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
        .send({ description: 'No title here' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation error');
    });

    it('should return 400 for invalid status', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({ title: 'Test', status: 'INVALID_STATUS' });

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

      const mockTasksChain = mockCreateChain(mockTasks);
      const mockActiveChain = mockCreateChain([{ task_id: 1, start_time: new Date().toISOString() }]);

      supabase.from.mockImplementation((table) => {
        if (table === 'tasks') return mockTasksChain;
        if (table === 'time_entries') return mockActiveChain;
        return mockCreateChain();
      });

      const response = await request(app).get('/api/tasks');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tasks');
      expect(Array.isArray(response.body.tasks)).toBe(true);
      expect(response.body.tasks).toHaveLength(2);
      // check injection
      expect(response.body.tasks[0]).toHaveProperty('active_start_time');
      expect(typeof response.body.tasks[0].active_start_time).toBe('string');
    });

    it('should filter tasks by status', async () => {
      const mockTasks = [
        { id: 1, title: 'Task 1', status: 'Done', user_id: 'user-123' }
      ];

      const mockTasksChain = mockCreateChain(mockTasks);
      const mockActiveChain = mockCreateChain([]);

      supabase.from.mockImplementation((table) => {
        if (table === 'tasks') return mockTasksChain;
        if (table === 'time_entries') return mockActiveChain;
        return mockCreateChain();
      });

      const response = await request(app)
        .get('/api/tasks')
        .query({ status: 'Done' });

      expect(response.status).toBe(200);
      expect(response.body.tasks).toHaveLength(1);
      expect(response.body.tasks[0].status).toBe('Done');
    });

    it('should return 400 for invalid status filter', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .query({ status: 'INVALID' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should get a specific task by id', async () => {
      const mockTask = { id: 1, title: 'Task 1', user_id: 'user-123' };

      const mockTaskChain = mockCreateChain(mockTask);
      const mockActiveChain = mockCreateChain({ start_time: new Date().toISOString() });

      supabase.from.mockImplementation((table) => {
        if (table === 'tasks') return mockTaskChain;
        if (table === 'time_entries') return mockActiveChain;
        return mockCreateChain();
      });

      const response = await request(app).get('/api/tasks/1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('task');
      expect(response.body.task.id).toBe(1);
      expect(response.body.task).toHaveProperty('active_start_time');
    });

    it('should return 404 for non-existent task', async () => {
      supabase.from.mockReturnValue(mockCreateChain(null));

      const response = await request(app).get('/api/tasks/999');
      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update a task successfully', async () => {
      const mockTask = { id: 1, title: 'Updated Task', user_id: 'user-123' };
      supabase.from.mockReturnValue(mockCreateChain(mockTask));

      const response = await request(app)
        .put('/api/tasks/1')
        .send({ title: 'Updated Task' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('task');
      expect(response.body.task.title).toBe('Updated Task');
    });

    it('should return 400 if no fields to update', async () => {
      // Mock existing task check success
      supabase.from.mockReturnValue(mockCreateChain({ id: 1, user_id: 'user-123' }));

      const response = await request(app)
        .put('/api/tasks/1')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete a task successfully', async () => {
      supabase.from.mockReturnValue(mockCreateChain({ id: 1 }));

      const response = await request(app).delete('/api/tasks/1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Task deleted successfully');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      supabase.from.mockReturnValue(mockCreateChain(null, { message: 'DB Error' }));

      const response = await request(app).get('/api/tasks');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Internal server error');
    });
  });
});
