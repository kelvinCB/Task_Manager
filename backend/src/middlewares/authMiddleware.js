const supabase = require('../config/supabaseClient');

/**
 * Authentication middleware to validate JWT tokens and extract user information
 * This middleware protects routes by ensuring only authenticated users can access them
 * and provides the user object in req.user for subsequent route handlers
 */
const authenticateUser = async (req, res, next) => {
  try {
    // Extract the authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'No authentication token provided' 
      });
    }

    // Extract the token (remove 'Bearer ' prefix)
    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid token format' 
      });
    }

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid or expired token' 
      });
    }

    // Attach user information to the request object
    req.user = {
      id: user.id,
      email: user.email,
      ...user
    };

    // Continue to the next middleware/route handler
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to authenticate user' 
    });
  }
};

module.exports = {
  authenticateUser
};
