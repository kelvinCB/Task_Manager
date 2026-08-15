import supabase from '../lib/supabaseClient';
import { API_BASE_URL } from '../utils/apiConfig';

export interface PersonalAccessToken {
  id: string;
  name: string;
  token_prefix: string;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
}

interface TokenResponse {
  tokens?: PersonalAccessToken[];
  token?: string;
  personal_access_token?: PersonalAccessToken;
  message?: string;
}

const getAccessToken = async (): Promise<string> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated. Please log in.');
  return session.access_token;
};

const request = async <T extends TokenResponse>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = await getAccessToken();
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    cache: 'no-store'
  });
  const data = await response.json().catch(() => ({})) as T & { error?: string; message?: string };

  if (!response.ok) {
    throw new Error(data.message || data.error || `Request failed with status ${response.status}`);
  }

  return data;
};

export const personalAccessTokenService = {
  async list(): Promise<PersonalAccessToken[]> {
    const response = await request<{ tokens: PersonalAccessToken[] }>('/api/personal-access-tokens');
    return response.tokens || [];
  },

  async create(name: string, expiresInDays: number | null): Promise<{ token: string; personalAccessToken: PersonalAccessToken }> {
    const response = await request<{ token?: string; personal_access_token?: PersonalAccessToken }>('/api/personal-access-tokens', {
      method: 'POST',
      body: JSON.stringify({ name, expires_in_days: expiresInDays })
    });

    if (!response.token || !response.personal_access_token) {
      throw new Error('Invalid response while creating personal access token');
    }

    return {
      token: response.token,
      personalAccessToken: response.personal_access_token
    };
  },

  async revoke(id: string): Promise<PersonalAccessToken> {
    const response = await request<{ token?: PersonalAccessToken }>(`/api/personal-access-tokens/${id}/revoke`, {
      method: 'POST'
    });

    if (!response.token) throw new Error('Invalid response while revoking personal access token');
    return response.token;
  }
};
