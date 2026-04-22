CREATE TABLE IF NOT EXISTS public.access_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('login', 'logout')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_access_logs_user ON public.access_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_access_logs_date ON public.access_logs(created_at DESC);

ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view access logs"
  ON public.access_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Users insert own access logs"
  ON public.access_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
