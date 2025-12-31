const request = require('supertest');
const express = require('express');
const authRoutes = require('../../routes/auth');
const { supabase } = require('../../config/supabaseClient');

// Mock the supabase client
jest.mock('../../config/supabaseClient', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn()
    }
  }
}));

// Mock @supabase/supabase-js for createClient
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      updateUser: jest.fn()
    }
  }))
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

  describe('POST /api/auth/forgot-password', () => {
    it('should send password reset email successfully', async () => {
      supabase.auth.resetPasswordForEmail.mockResolvedValue({
        error: null
      });

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'test@example.com'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'If your email is in our system, you will receive a password reset link'
      });
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({
          redirectTo: expect.stringContaining('/reset-password')
        })
      );
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Email is required' });
      expect(supabase.auth.resetPasswordForEmail).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'invalid-email'
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid email format' });
      expect(supabase.auth.resetPasswordForEmail).not.toHaveBeenCalled();
    });

    it('should handle supabase error', async () => {
      const mockError = { message: 'User not found' };
      supabase.auth.resetPasswordForEmail.mockResolvedValue({
        error: mockError
      });

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'test@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'User not found' });
    });

    it('should return 500 for unexpected errors', async () => {
      supabase.auth.resetPasswordForEmail.mockRejectedValue(new Error('Network error'));

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'test@example.com'
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should reset password successfully', async () => {
      const { createClient } = require('@supabase/supabase-js');
      const mockSupabaseInstance = {
        auth: {
          updateUser: jest.fn().mockResolvedValue({ error: null })
        }
      };
      createClient.mockReturnValue(mockSupabaseInstance);

      const response = await request(app)
        .post('/api/auth/reset-password')
        .set('Authorization', 'Bearer test-access-token')
        .send({
          password: 'newpassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Password updated successfully' });
      expect(mockSupabaseInstance.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123'
      });
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .set('Authorization', 'Bearer test-access-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'New password is required' });
    });

    it('should return 401 for missing access token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          password: 'newpassword123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Access token is required' });
    });

    it('should return 400 for short password', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .set('Authorization', 'Bearer test-access-token')
        .send({
          password: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Password must be at least 6 characters long' });
    });

    it('should handle supabase error', async () => {
      const { createClient } = require('@supabase/supabase-js');
      const mockSupabaseInstance = {
        auth: {
          updateUser: jest.fn().mockResolvedValue({
            error: { message: 'Invalid or expired token' }
          })
        }
      };
      createClient.mockReturnValue(mockSupabaseInstance);

      const response = await request(app)
        .post('/api/auth/reset-password')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          password: 'newpassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid or expired token' });
    });

    it('should return 500 for unexpected errors', async () => {
      const { createClient } = require('@supabase/supabase-js');
      const mockSupabaseInstance = {
        auth: {
          updateUser: jest.fn().mockRejectedValue(new Error('Network error'))
        }
      };
      createClient.mockReturnValue(mockSupabaseInstance);

      const response = await request(app)
        .post('/api/auth/reset-password')
        .set('Authorization', 'Bearer test-access-token')
        .send({
          password: 'newpassword123'
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
