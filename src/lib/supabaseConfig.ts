export interface SupabaseConfig {
  url: string;
  key: string;
}

const SUPABASE_HOST_PATTERN = /^[a-z0-9-]+\.supabase\.co$/i;

export const resolveSupabaseConfig = (
  rawUrl: string | undefined,
  rawKey: string | undefined,
): SupabaseConfig => {
  const urlValue = rawUrl?.trim().replace(/\/+$/, '');
  const key = rawKey?.trim();

  if (!urlValue || !key) {
    throw new Error(
      'VITE_SUPABASE_URL and VITE_SUPABASE_KEY must be defined. Use a Supabase publishable key (or legacy anon key) in the browser.',
    );
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(urlValue);
  } catch {
    throw new Error(
      'VITE_SUPABASE_URL must be a valid HTTPS Supabase project URL.',
    );
  }

  const isProjectOrigin =
    parsedUrl.protocol === 'https:' &&
    SUPABASE_HOST_PATTERN.test(parsedUrl.hostname) &&
    parsedUrl.pathname === '/' &&
    !parsedUrl.username &&
    !parsedUrl.password &&
    !parsedUrl.search &&
    !parsedUrl.hash;

  if (!isProjectOrigin) {
    throw new Error(
      'VITE_SUPABASE_URL must use the form https://<project-ref>.supabase.co.',
    );
  }

  return {
    url: parsedUrl.origin,
    key,
  };
};
