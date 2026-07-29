import { createClient } from '@supabase/supabase-js';
import { resolveSupabaseConfig } from './supabaseConfig';

const config = resolveSupabaseConfig(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY,
);

export const supabaseUrl = config.url;

const supabase = createClient(supabaseUrl, config.key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default supabase;
