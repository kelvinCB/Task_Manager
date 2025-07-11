const request = require('supertest');
const express = require('express');
const authRoutes = require('../../routes/auth');
const supabase = require('../../config/supabaseClient');

// Mock the supabase client
jest.mock('../../config/supabaseClient', () => ({
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn()
  }
}));

describe('Auth Routes Integration Tests', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'test-id',
        email: 'test@example.com',
        created_at: new Date().toISOString()
      };

      supabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ user: mockUser });
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should return 400 for invalid request body', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com'
          // missing password
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Email and password are required' });
      expect(supabase.auth.signUp).not.toHaveBeenCalled();
    });

    it('should return 400 for supabase auth error', async () => {
      const mockError = { message: 'User already registered' };
      supabase.auth.signUp.mockResolvedValue({
        data: null,
        error: mockError
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'User already registered' });
    });

    it('should return 500 for unexpected errors', async () => {
      supabase.auth.signUp.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user successfully', async () => {
      const mockUser = {
        id: 'test-id',
        email: 'test@example.com'
      };
      
      const mockSession = {
        access_token: 'mock-token',
        user: mockUser
      };

      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ 
        session: mockSession, 
        user: mockUser 
      });
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
          // missing password
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Email and password are required' });
      expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid credentials', async () => {
      const mockError = { message: 'Invalid login credentials' };
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: mockError
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Invalid login credentials' });
    });

    it('should return 500 for unexpected errors', async () => {
      supabase.auth.signInWithPassword.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
    });
  });

  describe('Route not found', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/auth/nonexistent');

      expect(response.status).toBe(404);
    });
  });
});