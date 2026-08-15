const crypto = require('crypto');
const {
  supabase,
  adminSupabase,
  createClientWithToken,
  isSupabaseConfigured,
  isServiceRoleConfigured
} = require('../config/supabaseClient');

const PERSONAL_ACCESS_TOKEN_PREFIX = 'kolium_pat_';

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const isPersonalAccessToken = (token) => token.startsWith(PERSONAL_ACCESS_TOKEN_PREFIX);

const respondWithServiceUnavailable = (res, message) => res.status(503).json({
  error: 'Service unavailable',
  message,
  code: 'SUPABASE_NOT_CONFIGURED'
});

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

    if (isPersonalAccessToken(token)) {
      if (!isServiceRoleConfigured || !adminSupabase) {
        return respondWithServiceUnavailable(res, 'Personal access tokens require a server-side Supabase secret key');
      }

      const { data: personalAccessToken, error: tokenError } = await adminSupabase
        .from('personal_access_tokens')
        .select('id, user_id, expires_at, revoked_at')
        .eq('token_hash', hashToken(token))
        .maybeSingle();

      if (tokenError) {
        console.error('Personal access token lookup error:', tokenError);
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or expired token'
        });
      }

      const isExpired = personalAccessToken?.expires_at && new Date(personalAccessToken.expires_at).getTime() <= Date.now();
      if (!personalAccessToken || personalAccessToken.revoked_at || isExpired) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or expired token'
        });
      }

      const { error: lastUsedError } = await adminSupabase
        .from('personal_access_tokens')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', personalAccessToken.id);

      if (lastUsedError) {
        console.warn('Failed to update personal access token usage:', lastUsedError);
      }

      req.user = { id: personalAccessToken.user_id };
      req.auth = { type: 'personal_access_token', tokenId: personalAccessToken.id };
      // PATs are intentionally looked up with the server-only client. All task,
      // comment and time-entry controllers still scope queries to req.user.id.
      req.supabase = adminSupabase;
      return next();
    }

    if (!isSupabaseConfigured || !supabase) {
      return respondWithServiceUnavailable(res, 'Supabase environment variables are not configured');
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
    req.auth = { type: 'supabase' };

    // Attach a per-request Supabase client authorized with the user's JWT
    req.supabase = createClientWithToken(token);

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
