import { describe, expect, it } from 'vitest';
import { resolveSupabaseConfig } from '../../lib/supabaseConfig';

describe('resolveSupabaseConfig', () => {
  it('normalizes surrounding whitespace and trailing slashes', () => {
    expect(
      resolveSupabaseConfig(
        '  https://project-ref.supabase.co///  ',
        '  publishable-key  ',
      ),
    ).toEqual({
      url: 'https://project-ref.supabase.co',
      key: 'publishable-key',
    });
  });

  it.each([
    'http://project-ref.supabase.co',
    'https://supabase.co',
    'https://project-ref.supabase.co/path',
    'https://project-ref.supabase.co?query=value',
    'https://project-ref.supabase.co.evil.example',
    'not-a-url',
  ])('rejects an unsafe or malformed project URL: %s', (url) => {
    expect(() => resolveSupabaseConfig(url, 'publishable-key')).toThrow(
      /HTTPS Supabase project URL|https:\/\/<project-ref>\.supabase\.co/,
    );
  });

  it.each([
    [undefined, 'publishable-key'],
    ['   ', 'publishable-key'],
    ['https://project-ref.supabase.co', undefined],
    ['https://project-ref.supabase.co', '   '],
  ])('rejects missing configuration', (url, key) => {
    expect(() => resolveSupabaseConfig(url, key)).toThrow(
      /VITE_SUPABASE_URL and VITE_SUPABASE_KEY must be defined/,
    );
  });
});
