-- Run once in existing WorkPulse database; no existing kiosk or attendance rows deleted.
ALTER TABLE public.kiosks ADD COLUMN IF NOT EXISTS login_id text;
ALTER TABLE public.kiosks ADD COLUMN IF NOT EXISTS password_hash text;
CREATE UNIQUE INDEX IF NOT EXISTS kiosks_login_id_unique ON public.kiosks(login_id) WHERE login_id IS NOT NULL;
-- The existing table RLS remains enabled. Credentials are accessed server-side only.
REVOKE ALL ON public.kiosks FROM anon, authenticated;
