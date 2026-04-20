-- Audit log table
CREATE TABLE IF NOT EXISTS public.role_change_logs (
  id BIGSERIAL PRIMARY KEY,
  changed_by UUID,
  changed_by_email TEXT,
  changed_user UUID,
  changed_user_email TEXT,
  old_role TEXT,
  new_role TEXT,
  action TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.role_change_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view role logs"
ON public.role_change_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_role_change_logs_changed_at ON public.role_change_logs(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_role_change_logs_new_role ON public.role_change_logs(new_role);

-- Trigger function to log role changes
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_email TEXT;
  target_email TEXT;
BEGIN
  SELECT email INTO actor_email FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;

  IF TG_OP = 'INSERT' THEN
    SELECT email INTO target_email FROM public.profiles WHERE user_id = NEW.user_id LIMIT 1;
    INSERT INTO public.role_change_logs (changed_by, changed_by_email, changed_user, changed_user_email, old_role, new_role, action)
    VALUES (auth.uid(), actor_email, NEW.user_id, target_email, NULL, NEW.role::text, 'INSERT');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    SELECT email INTO target_email FROM public.profiles WHERE user_id = NEW.user_id LIMIT 1;
    INSERT INTO public.role_change_logs (changed_by, changed_by_email, changed_user, changed_user_email, old_role, new_role, action)
    VALUES (auth.uid(), actor_email, NEW.user_id, target_email, OLD.role::text, NEW.role::text, 'UPDATE');
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT email INTO target_email FROM public.profiles WHERE user_id = OLD.user_id LIMIT 1;
    INSERT INTO public.role_change_logs (changed_by, changed_by_email, changed_user, changed_user_email, old_role, new_role, action)
    VALUES (auth.uid(), actor_email, OLD.user_id, target_email, OLD.role::text, NULL, 'DELETE');
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_role_change ON public.user_roles;
CREATE TRIGGER trg_log_role_change
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.log_role_change();

-- Admin preferences
CREATE TABLE IF NOT EXISTS public.admin_preferences (
  user_id UUID PRIMARY KEY,
  notify_new_users BOOLEAN NOT NULL DEFAULT TRUE,
  log_role_changes BOOLEAN NOT NULL DEFAULT TRUE,
  require_2fa BOOLEAN NOT NULL DEFAULT FALSE,
  block_after_failed BOOLEAN NOT NULL DEFAULT FALSE,
  theme TEXT NOT NULL DEFAULT 'dark',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view own prefs"
ON public.admin_preferences FOR SELECT TO authenticated
USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert own prefs"
ON public.admin_preferences FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update own prefs"
ON public.admin_preferences FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_admin_preferences_updated_at
BEFORE UPDATE ON public.admin_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();