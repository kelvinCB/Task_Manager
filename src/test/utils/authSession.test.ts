import { describe, expect, it } from 'vitest';
import {
  DEFAULT_AUTH_INACTIVITY_TIMEOUT_MS,
  isSessionInactive
} from '../../utils/authSession';

describe('auth session inactivity helpers', () => {
  it('treats a missing activity timestamp as active during first sign-in', () => {
    expect(isSessionInactive(null)).toBe(false);
  });

  it('expires a session at the configured timeout', () => {
    const now = 1_000_000;
    expect(isSessionInactive(now - DEFAULT_AUTH_INACTIVITY_TIMEOUT_MS, now)).toBe(true);
    expect(isSessionInactive(now - DEFAULT_AUTH_INACTIVITY_TIMEOUT_MS + 1, now)).toBe(false);
  });
});
