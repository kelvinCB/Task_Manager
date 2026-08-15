const { createClient } = require('@supabase/supabase-js');

if (!process.env.VERCEL) {
  const dotenv = require('dotenv');
  dotenv.config();
  dotenv.config({ path: '.env.production' });
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || (process.env.NODE_ENV === 'test' ? 'https://test.supabase.co' : undefined);
const publishableKey = process.env.SUPABASE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_KEY || (process.env.NODE_ENV === 'test' ? 'test-key' : undefined);
const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY;

const clientOptions = {
  auth: { persistSession: false, autoRefreshToken: false }
};

const isSupabaseConfigured = Boolean(supabaseUrl && publishableKey);
const isServiceRoleConfigured = Boolean(supabaseUrl && serviceKey);

// Keep module loading safe in serverless runtimes. A missing Vercel environment
// variable must produce a controlled 503 from the API, not a function invocation
// crash that turns every route into an opaque 500.
const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, publishableKey, clientOptions)
  : null;

// This client is only used for personal access token lookup. It is never sent to
// the browser and must be backed by a server-only secret key.
const adminSupabase = isServiceRoleConfigured
  ? createClient(supabaseUrl, serviceKey, clientOptions)
  : null;

// Factory: create a client that executes DB queries with the user's JWT (RLS aware)
const createClientWithToken = (token) => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase environment variables are not configured');
  }

  return createClient(supabaseUrl, publishableKey, {
    ...clientOptions,
    global: {
      headers: { Authorization: `Bearer ${token}` }
    }
  });
};

module.exports = {
  supabase,
  adminSupabase,
  createClientWithToken,
  isSupabaseConfigured,
  isServiceRoleConfigured,
  supabaseConfig: {
    url: supabaseUrl,
    hasPublishableKey: Boolean(publishableKey),
    hasServiceKey: Boolean(serviceKey)
  }
};
