const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

if (!process.env.VERCEL) {
  dotenv.config();
  dotenv.config({ path: '.env.production' });
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || (process.env.NODE_ENV === 'test' ? 'https://test.supabase.co' : undefined);
// Prefer service_role for admin checks; fallback to anon key
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_KEY || (process.env.NODE_ENV === 'test' ? 'test-key' : undefined);

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and Key must be provided in the .env file');
}

// Default client (no user context). Use for auth endpoints and admin operations.
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

// Factory: create a client that executes DB queries with the user's JWT (RLS aware)
const createClientWithToken = (token) =>
  createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: { Authorization: `Bearer ${token}` }
    }
  });

module.exports = {
  supabase,
  createClientWithToken
};
