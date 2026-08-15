import React, { useCallback, useEffect, useState } from 'react';
import { Copy, KeyRound, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import {
  personalAccessTokenService,
  PersonalAccessToken
} from '../../../services/personalAccessTokenService';

interface AccountSettingsPanelProps {
  theme: 'dark' | 'light';
}

const formatDate = (value: string | null, locale: string) => {
  if (!value) return null;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value));
};

export const AccountSettingsPanel: React.FC<AccountSettingsPanelProps> = ({ theme }) => {
  const { t, i18n } = useTranslation();
  const [tokens, setTokens] = useState<PersonalAccessToken[]>([]);
  const [name, setName] = useState('');
  const [expiresInDays, setExpiresInDays] = useState<number | null>(90);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadTokens = useCallback(async () => {
    setIsLoading(true);
    try {
      setTokens(await personalAccessTokenService.list());
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('account.settings_load_error'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadTokens();
  }, [loadTokens]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError(t('account.settings_token_name_required'));
      return;
    }

    setIsSaving(true);
    setError(null);
    setNotice(null);
    try {
      const created = await personalAccessTokenService.create(name.trim(), expiresInDays);
      setNewToken(created.token);
      setName('');
      setNotice(t('account.settings_token_created'));
      await loadTokens();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : t('account.settings_create_error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevoke = async (id: string) => {
    setError(null);
    try {
      await personalAccessTokenService.revoke(id);
      setTokens((current) => current.map((token) => token.id === id
        ? { ...token, revoked_at: new Date().toISOString() }
        : token));
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : t('account.settings_revoke_error'));
    }
  };

  const handleCopy = async () => {
    if (!newToken || !navigator.clipboard) return;
    await navigator.clipboard.writeText(newToken);
    setNotice(t('account.settings_token_copied'));
  };

  const dateLocale = i18n.language === 'es' ? 'es-ES' : 'en-US';
  const inputClass = theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-100' : '';

  return (
    <div className="max-h-[60vh] overflow-y-auto px-6 py-5 space-y-6" data-testid="account-settings-panel">
      <div>
        <div className="flex items-center gap-2">
          <ShieldCheck size={20} className="text-indigo-500" />
          <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {t('account.settings_title')}
          </h3>
        </div>
        <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          {t('account.settings_description')}
        </p>
      </div>

      <form onSubmit={handleCreate} className={`space-y-4 rounded-xl border p-4 ${theme === 'dark' ? 'border-gray-700 bg-gray-800/60' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex items-center gap-2">
          <KeyRound size={18} className="text-indigo-500" />
          <h4 className={`font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{t('account.settings_create_token')}</h4>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="personal-access-token-name" className={theme === 'dark' ? 'text-gray-200' : ''}>{t('account.settings_token_name')}</Label>
          <Input
            id="personal-access-token-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t('account.settings_token_name_placeholder')}
            maxLength={100}
            className={inputClass}
            disabled={isSaving}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="personal-access-token-expiration" className={theme === 'dark' ? 'text-gray-200' : ''}>{t('account.settings_token_expiration')}</Label>
          <select
            id="personal-access-token-expiration"
            value={expiresInDays === null ? 'never' : String(expiresInDays)}
            onChange={(event) => setExpiresInDays(event.target.value === 'never' ? null : Number(event.target.value))}
            className={`flex h-9 w-full rounded-lg border bg-background px-3 py-2 text-sm ${inputClass}`}
            disabled={isSaving}
          >
            <option value="30">{t('account.settings_token_expire_30')}</option>
            <option value="90">{t('account.settings_token_expire_90')}</option>
            <option value="365">{t('account.settings_token_expire_365')}</option>
            <option value="never">{t('account.settings_token_never_expire')}</option>
          </select>
        </div>
        <Button type="submit" data-testid="generate-personal-access-token" disabled={isSaving || !name.trim()}>
          <KeyRound size={16} className="mr-2" />
          {isSaving ? t('common.loading') : t('account.settings_generate_token')}
        </Button>
      </form>

      {newToken && (
        <div className="space-y-3 rounded-xl border border-amber-400/60 bg-amber-50 p-4 dark:bg-amber-950/30" data-testid="new-personal-access-token">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">{t('account.settings_token_once_title')}</p>
          <p className="text-xs text-amber-800 dark:text-amber-300">{t('account.settings_token_once_description')}</p>
          <div className="flex gap-2">
            <Input readOnly value={newToken} aria-label={t('account.settings_token_value')} className="font-mono text-xs" />
            <Button type="button" variant="outline" size="icon" onClick={() => void handleCopy()} aria-label={t('account.settings_copy_token')}>
              <Copy size={16} />
            </Button>
          </div>
        </div>
      )}

      {(error || notice) && (
        <p role={error ? 'alert' : 'status'} className={`text-sm ${error ? 'text-red-600' : 'text-emerald-600'}`}>
          {error || notice}
        </p>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className={`font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{t('account.settings_existing_tokens')}</h4>
          <Button type="button" variant="ghost" size="sm" onClick={() => void loadTokens()} disabled={isLoading} aria-label={t('account.settings_refresh_tokens')}>
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          </Button>
        </div>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        ) : tokens.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('account.settings_no_tokens')}</p>
        ) : (
          <div className="space-y-2">
            {tokens.map((token) => {
              const expired = token.expires_at && new Date(token.expires_at).getTime() <= Date.now();
              const inactive = Boolean(token.revoked_at || expired);
              return (
                <div key={token.id} data-testid={`personal-access-token-row-${token.id}`} className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="min-w-0">
                    <p className={`truncate text-sm font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{token.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{token.token_prefix}••••••••</p>
                    <p className="text-xs text-muted-foreground">
                      {inactive ? t('account.settings_revoked') : t('account.settings_active')}
                      {token.expires_at ? ` · ${t('account.settings_expires_on')} ${formatDate(token.expires_at, dateLocale)}` : ''}
                    </p>
                  </div>
                  {!inactive && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => void handleRevoke(token.id)} aria-label={`${t('account.settings_revoke')} ${token.name}`}>
                      <Trash2 size={16} className="text-red-500" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
