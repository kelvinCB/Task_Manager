// global-setup.ts
import { FullConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function globalSetup(config: FullConfig) {
  // Load environment variables from .env.production for E2E tests
  dotenv.config({ path: path.resolve(__dirname, '../.env.production') });
  
  console.log('\n🔧 E2E Global Setup: Environment variables loaded from .env.production');
  console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅ Loaded' : '❌ Missing');
  console.log('VITE_SUPABASE_KEY:', process.env.VITE_SUPABASE_KEY ? '✅ Loaded' : '❌ Missing');
  console.log('VITE_OPENAI_API_KEY:', process.env.VITE_OPENAI_API_KEY ? '✅ Loaded' : '❌ Missing');
  console.log('E2E_USER_AUTH_EMAIL:', process.env.E2E_USER_AUTH_EMAIL ? '✅ Loaded' : '❌ Missing');
  console.log('E2E_USER_TASK_EMAIL:', process.env.E2E_USER_TASK_EMAIL ? '✅ Loaded' : '❌ Missing');
  console.log('E2E_USER_PROFILE_EMAIL:', process.env.E2E_USER_PROFILE_EMAIL ? '✅ Loaded' : '❌ Missing');
  console.log('E2E_USER_FILE_EMAIL:', process.env.E2E_USER_FILE_EMAIL ? '✅ Loaded' : '❌ Missing');
  console.log('E2E_USER_AI_EMAIL:', process.env.E2E_USER_AI_EMAIL ? '✅ Loaded' : '❌ Missing');
  console.log('E2E_USER_TIME_EMAIL:', process.env.E2E_USER_TIME_EMAIL ? '✅ Loaded' : '❌ Missing');
  console.log('');
}

export default globalSetup;
