const authController = require('../../controllers/authController');
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

describe('Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
    // Set FRONTEND_URL for tests
    process.env.FRONTEND_URL = 'http://localhost:5173';
  });

  describe('register', () => {
    it('should register a user successfully', async () => {
      const mockUser = {
        id: 'test-id',
        email: 'test@example.com',
        created_at: new Date().toISOString()
      };
      
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      supabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      await authController.register(req, res);

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ user: mockUser });
    });

    it('should return 400 if email is missing', async () => {
      req.body = {
        password: 'password123'
      };

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email and password are required' });
      expect(supabase.auth.signUp).not.toHaveBeenCalled();
    });

    it('should return 400 if password is missing', async () => {
      req.body = {
        email: 'test@example.com'
      };

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email and password are required' });
      expect(supabase.auth.signUp).not.toHaveBeenCalled();
    });

    it('should handle supabase auth error', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockError = { message: 'User already exists' };
      supabase.auth.signUp.mockResolvedValue({
        data: null,
        error: mockError
      });

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'User already exists' });
    });

    it('should handle unexpected errors', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      supabase.auth.signUp.mockRejectedValue(new Error('Database connection failed'));

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('login', () => {
    it('should login a user successfully', async () => {
      const mockUser = {
        id: 'test-id',
        email: 'test@example.com'
      };
      
      const mockSession = {
        access_token: 'mock-token',
        user: mockUser
      };

      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      });

      await authController.login(req, res);

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ 
        session: mockSession, 
        user: mockUser 
      });
    });

    it('should return 400 if email is missing', async () => {
      req.body = {
        password: 'password123'
      };

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email and password are required' });
      expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });

    it('should return 400 if password is missing', async () => {
      req.body = {
        email: 'test@example.com'
      };

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email and password are required' });
      expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });

    it('should handle invalid credentials', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const mockError = { message: 'Invalid login credentials' };
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: mockError
      });

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid login credentials' });
    });

    it('should handle unexpected errors', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      supabase.auth.signInWithPassword.mockRejectedValue(new Error('Database connection failed'));

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email successfully', async () => {
      req.body = {
        email: 'test@example.com'
      };

      supabase.auth.resetPasswordForEmail.mockResolvedValue({
        error: null
      });

      await authController.forgotPassword(req, res);

      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          redirectTo: 'http://localhost:5173/reset-password'
        }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'If your email is in our system, you will receive a password reset link'
      });
    });

    it('should return 400 if email is missing', async () => {
      req.body = {};

      await authController.forgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email is required' });
      expect(supabase.auth.resetPasswordForEmail).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      req.body = {
        email: 'invalid-email'
      };

      await authController.forgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid email format' });
      expect(supabase.auth.resetPasswordForEmail).not.toHaveBeenCalled();
    });

    it('should normalize email (lowercase and trim)', async () => {
      req.body = {
        email: '  TEST@EXAMPLE.COM  '
      };

      supabase.auth.resetPasswordForEmail.mockResolvedValue({
        error: null
      });

      await authController.forgotPassword(req, res);

      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({
          redirectTo: expect.stringContaining('/reset-password')
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'If your email is in our system, you will receive a password reset link'
      });
    });

    it('should handle supabase error gracefully', async () => {
      req.body = {
        email: 'test@example.com'
      };

      const mockError = { message: 'User not found' };
      supabase.auth.resetPasswordForEmail.mockResolvedValue({
        error: mockError
      });

      await authController.forgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('should handle unexpected errors', async () => {
      req.body = {
        email: 'test@example.com'
      };

      supabase.auth.resetPasswordForEmail.mockRejectedValue(new Error('Network error'));

      await authController.forgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('resetPassword', () => {
    beforeEach(() => {
      req.headers = {
        authorization: 'Bearer test-access-token'
      };
    });

    it('should reset password successfully', async () => {
      req.body = {
        password: 'newpassword123'
      };

      const { createClient } = require('@supabase/supabase-js');
      const mockSupabaseInstance = {
        auth: {
          updateUser: jest.fn().mockResolvedValue({ error: null })
        }
      };
      createClient.mockReturnValue(mockSupabaseInstance);

      await authController.resetPassword(req, res);

      expect(createClient).toHaveBeenCalledWith(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_KEY,
        {
          global: {
            headers: {
              Authorization: 'Bearer test-access-token'
            }
          }
        }
      );
      expect(mockSupabaseInstance.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123'
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Password updated successfully' });
    });

    it('should return 400 if password is missing', async () => {
      req.body = {};

      await authController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'New password is required' });
    });

    it('should return 401 if access token is missing', async () => {
      req.headers = {};
      req.body = {
        password: 'newpassword123'
      };

      await authController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access token is required' });
    });

    it('should validate password length', async () => {
      req.body = {
        password: '123'
      };

      await authController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Password must be at least 6 characters long' });
    });

    it('should handle supabase error', async () => {
      req.body = {
        password: 'newpassword123'
      };

      const { createClient } = require('@supabase/supabase-js');
      const mockSupabaseInstance = {
        auth: {
          updateUser: jest.fn().mockResolvedValue({ 
            error: { message: 'Invalid or expired token' } 
          })
        }
      };
      createClient.mockReturnValue(mockSupabaseInstance);

      await authController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
    });

    it('should handle unexpected errors', async () => {
      req.body = {
        password: 'newpassword123'
      };

      const { createClient } = require('@supabase/supabase-js');
      const mockSupabaseInstance = {
        auth: {
          updateUser: jest.fn().mockRejectedValue(new Error('Network error'))
        }
      };
      createClient.mockReturnValue(mockSupabaseInstance);

      await authController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });
});
