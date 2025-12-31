const { authenticateUser } = require('../../middlewares/authMiddleware');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      headers: {},
      user: undefined,
      supabase: undefined
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  describe('authenticateUser', () => {
    it('should return 401 when no authorization header', async () => {
      req.headers = {};

      await authenticateUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'No authentication token provided'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when header doesn\'t start with "Bearer "', async () => {
      req.headers.authorization = 'InvalidFormat token-123';

      await authenticateUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'No authentication token provided'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when token is empty', async () => {
      req.headers.authorization = 'Bearer ';

      await authenticateUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Invalid token format'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
