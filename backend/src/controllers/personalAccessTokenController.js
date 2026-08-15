const { createPersonalAccessToken } = require('../utils/personalAccessTokens');
const { supabase, adminSupabase } = require('../config/supabaseClient');

const TOKEN_COLUMNS = 'id, name, token_prefix, created_at, last_used_at, expires_at, revoked_at';

const getDatabaseClient = (req) => req.supabase || supabase;

const getAdminDatabaseClient = () => adminSupabase;

const validateTokenName = (name) => {
  if (typeof name !== 'string' || !name.trim()) {
    return 'A token name is required';
  }

  if (name.trim().length > 100) {
    return 'Token name must be 100 characters or fewer';
  }

  return null;
};

const parseExpiration = (value) => {
  if (value === undefined || value === null || value === '') return { value: null, error: null };

  const days = Number(value);
  if (!Number.isInteger(days) || days < 1 || days > 3650) {
    return { value: null, error: 'expires_in_days must be an integer between 1 and 3650' };
  }

  return {
    value: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
    error: null
  };
};

const requireSupabaseSession = (req, res, next) => {
  if (req.auth?.type !== 'supabase') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Personal access tokens can only be managed from a Supabase session'
    });
  }

  return next();
};

const listPersonalAccessTokens = async (req, res) => {
  try {
    const db = getDatabaseClient(req);
    if (!db) {
      return res.status(503).json({ error: 'Service unavailable', message: 'Supabase is not configured' });
    }

    const { data, error } = await db
      .from('personal_access_tokens')
      .select(TOKEN_COLUMNS)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.status(200).json({ tokens: data || [] });
  } catch (error) {
    console.error('List personal access tokens error:', error);
    return res.status(500).json({ error: 'Internal server error', message: 'Failed to fetch personal access tokens' });
  }
};

const createToken = async (req, res) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : req.body?.name;
    const nameError = validateTokenName(name);
    if (nameError) return res.status(400).json({ error: 'Validation error', message: nameError });

    const expiration = parseExpiration(req.body?.expires_in_days);
    if (expiration.error) return res.status(400).json({ error: 'Validation error', message: expiration.error });

    const db = getAdminDatabaseClient();
    if (!db) {
      return res.status(503).json({ error: 'Service unavailable', message: 'Supabase is not configured' });
    }

    const generated = createPersonalAccessToken();
    const { data, error } = await db
      .from('personal_access_tokens')
      .insert({
        user_id: req.user.id,
        name,
        token_prefix: generated.tokenPrefix,
        token_hash: generated.tokenHash,
        expires_at: expiration.value
      })
      .select(TOKEN_COLUMNS)
      .single();

    if (error) throw error;

    return res.status(201).json({
      token: generated.token,
      personal_access_token: data,
      warning: 'Copy this token now. It will not be shown again.'
    });
  } catch (error) {
    console.error('Create personal access token error:', error);
    return res.status(500).json({ error: 'Internal server error', message: 'Failed to create personal access token' });
  }
};

const revokeToken = async (req, res) => {
  try {
    const db = getAdminDatabaseClient();
    if (!db) {
      return res.status(503).json({ error: 'Service unavailable', message: 'Supabase is not configured' });
    }

    const { data, error } = await db
      .from('personal_access_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .is('revoked_at', null)
      .select(TOKEN_COLUMNS)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Not found', message: 'Personal access token not found' });

    return res.status(200).json({ token: data });
  } catch (error) {
    console.error('Revoke personal access token error:', error);
    return res.status(500).json({ error: 'Internal server error', message: 'Failed to revoke personal access token' });
  }
};

module.exports = {
  requireSupabaseSession,
  listPersonalAccessTokens,
  createToken,
  revokeToken
};
