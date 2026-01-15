/**
 * Centralized API configuration for the Task Manager application.
 * This ensures consistency between different services and environments.
 */

// Use VITE_API_URL if provided, otherwise default to relative '/api' in production
// or 'http://localhost:3001' in development.
const getApiBaseUrl = () => {
  const env = import.meta.env;

  if (env.VITE_API_URL) {
    return env.VITE_API_URL;
  }

  if (env.VITE_BACKEND_URL) {
    return env.VITE_BACKEND_URL;
  }

  // In production (Vercel), we typically want relative paths if frontend and backend 
  // are served from the same domain.
  if (env.PROD) {
    // If we're on Vercel, the backend is usually at /api
    return '';
  }

  // Default to local backend for development
  // Direct connection to bypass any potential Vite proxy buffering
  return 'http://localhost:3001';
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Helper to build API URLs ensuring trailing/leading slashes are handled correctly
 */
export const getApiUrl = (endpoint: string) => {
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
};
