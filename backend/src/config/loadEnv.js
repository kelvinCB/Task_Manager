const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const mode = process.env.NODE_ENV || 'development';

// Determine if we're running from root or backend directory
const isInBackend = process.cwd().endsWith('backend');
const baseDir = isInBackend ? process.cwd() : path.resolve(process.cwd(), 'backend');

const candidate = path.resolve(baseDir, `.env.${mode}`);
const fallback = path.resolve(baseDir, '.env');

const envPath = fs.existsSync(candidate) ? candidate : fallback;
dotenv.config({ path: envPath });

console.log(`[env] Loaded environment from: ${path.basename(envPath)} (mode=${mode})`);

// Validate required environment variables
['SUPABASE_URL', 'SUPABASE_KEY', 'PORT'].forEach((key) => {
  if (!process.env[key]) {
    console.warn(`[env] Warning: Missing ${key} in ${path.basename(envPath)} (mode=${mode})`);
  }
});