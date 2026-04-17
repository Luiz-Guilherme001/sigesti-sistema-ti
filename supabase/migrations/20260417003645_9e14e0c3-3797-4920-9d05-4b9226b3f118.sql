
-- 1) Trigger: impedir remover/rebaixar o último admin
CREATE OR REPLACE FUNCTION public.prevent_last_admin_removal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.role = 'admin' THEN
      SELECT COUNT(*) INTO admin_count FROM public.user_roles WHERE role = 'admin';
      IF admin_count <= 1 THEN
        RAISE EXCEPTION 'Não é possível remover o último administrador do sistema. Promova outro usuário a admin antes.';
      END IF;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.role = 'admin' AND NEW.role <> 'admin' THEN
      SELECT COUNT(*) INTO admin_count FROM public.user_roles WHERE role = 'admin';
      IF admin_count <= 1 THEN
        RAISE EXCEPTION 'Não é possível rebaixar o último administrador. Promova outro usuário a admin antes.';
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_last_admin_delete ON public.user_roles;
CREATE TRIGGER trg_prevent_last_admin_delete
BEFORE DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.prevent_last_admin_removal();

DROP TRIGGER IF EXISTS trg_prevent_last_admin_update ON public.user_roles;
CREATE TRIGGER trg_prevent_last_admin_update
BEFORE UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.prevent_last_admin_removal();

-- 2) Função de emergência: promove a admin SOMENTE se não houver admin
CREATE OR REPLACE FUNCTION public.set_first_admin(_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count INTEGER;
  target_user_id UUID;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM public.user_roles WHERE role = 'admin';
  IF admin_count > 0 THEN
    RETURN 'ERRO: Já existe administrador ativo. Use o painel administrativo para gerenciar papéis.';
  END IF;

  SELECT user_id INTO target_user_id FROM public.profiles WHERE lower(email) = lower(_email) LIMIT 1;
  IF target_user_id IS NULL THEN
    RETURN 'ERRO: Nenhum usuário encontrado com o e-mail informado. Cadastre-se primeiro.';
  END IF;

  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (target_user_id, 'admin');

  RETURN 'SUCESSO: Usuário ' || _email || ' promovido a administrador.';
END;
$$;
