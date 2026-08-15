-- Personal access tokens are stored as one-way hashes. The raw token is only
-- returned once by the API at creation time.
CREATE TABLE IF NOT EXISTS public.personal_access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  token_prefix text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_personal_access_tokens_user_id
  ON public.personal_access_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_personal_access_tokens_active_hash
  ON public.personal_access_tokens(token_hash)
  WHERE revoked_at IS NULL;

ALTER TABLE public.personal_access_tokens ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.personal_access_tokens FROM anon;
-- The API uses the server-only secret key for token creation and revocation.
-- Authenticated clients only need read access for the Settings list.
GRANT SELECT ON public.personal_access_tokens TO authenticated;

DROP POLICY IF EXISTS "Users can view their personal access tokens" ON public.personal_access_tokens;
CREATE POLICY "Users can view their personal access tokens"
  ON public.personal_access_tokens FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create their personal access tokens" ON public.personal_access_tokens;
CREATE POLICY "Users can create their personal access tokens"
  ON public.personal_access_tokens FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can revoke their personal access tokens" ON public.personal_access_tokens;
CREATE POLICY "Users can revoke their personal access tokens"
  ON public.personal_access_tokens FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
