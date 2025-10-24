const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; // Prefer service_role in production

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
