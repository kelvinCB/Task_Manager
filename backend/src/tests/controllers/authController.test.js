const authController = require('../../controllers/authController');
const supabase = require('../../config/supabaseClient');

// Mock the supabase client
jest.mock('../../config/supabaseClient', () => ({
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn()
  }
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
});