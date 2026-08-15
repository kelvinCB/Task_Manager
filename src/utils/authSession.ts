export const AUTH_ACTIVITY_STORAGE_KEY = 'kolium:auth:last-activity';
export const DEFAULT_AUTH_INACTIVITY_TIMEOUT_MS = 8 * 60 * 60 * 1000;

const configuredTimeout = Number(import.meta.env.VITE_AUTH_INACTIVITY_TIMEOUT_MS);

export const AUTH_INACTIVITY_TIMEOUT_MS = Number.isFinite(configuredTimeout) && configuredTimeout > 0
  ? configuredTimeout
  : DEFAULT_AUTH_INACTIVITY_TIMEOUT_MS;

type ActivityRecord = {
  userId: string;
  timestamp: number;
};

const readActivityRecord = (): ActivityRecord | null => {
  if (typeof window === 'undefined') return null;

  try {
    const value = window.localStorage.getItem(AUTH_ACTIVITY_STORAGE_KEY);
    if (!value) return null;

    const parsed = JSON.parse(value) as ActivityRecord;
    if (!parsed || typeof parsed.userId !== 'string' || !Number.isFinite(parsed.timestamp)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

export const getLastActivity = (userId: string): number | null => {
  const record = readActivityRecord();
  return record?.userId === userId ? record.timestamp : null;
};

export const recordActivity = (userId: string, timestamp = Date.now()): void => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(AUTH_ACTIVITY_STORAGE_KEY, JSON.stringify({ userId, timestamp }));
  } catch {
    // Storage can be unavailable in private browsing or restricted webviews.
  }
};

export const clearActivity = (): void => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(AUTH_ACTIVITY_STORAGE_KEY);
  } catch {
    // Ignore storage cleanup failures; Supabase sign-out still clears its session.
  }
};

export const isSessionInactive = (
  lastActivity: number | null,
  now = Date.now(),
  timeout = AUTH_INACTIVITY_TIMEOUT_MS
): boolean => Boolean(lastActivity && now - lastActivity >= timeout);
