import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AccountSettingsPanel } from '../../../../components/features/account/AccountSettingsPanel';
import { personalAccessTokenService } from '../../../../services/personalAccessTokenService';

vi.mock('../../../../services/personalAccessTokenService', () => ({
  personalAccessTokenService: {
    list: vi.fn(),
    create: vi.fn(),
    revoke: vi.fn()
  }
}));

describe('AccountSettingsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(personalAccessTokenService.list).mockResolvedValue([]);
  });

  it('loads the token list and creates a token from the settings tab', async () => {
    vi.mocked(personalAccessTokenService.create).mockResolvedValue({
      token: 'kolium_pat_secret',
      personalAccessToken: {
        id: 'token-1',
        name: 'MCP',
        token_prefix: 'kolium_pat_secret',
        created_at: new Date().toISOString(),
        last_used_at: null,
        expires_at: null,
        revoked_at: null
      }
    });

    render(<AccountSettingsPanel theme="light" />);

    expect(await screen.findByTestId('account-settings-panel')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Token name'), { target: { value: 'MCP' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate token' }));

    await waitFor(() => {
      expect(personalAccessTokenService.create).toHaveBeenCalledWith('MCP', 90);
    });
    expect(screen.getByLabelText('New personal access token')).toHaveValue('kolium_pat_secret');
  });
});
