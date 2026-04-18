-- 1. Tabela laboratorios
CREATE TABLE IF NOT EXISTS public.laboratorios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_laboratorio TEXT NOT NULL UNIQUE,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

INSERT INTO public.laboratorios (nome_laboratorio, descricao)
VALUES
  ('Laboratório 1', 'Laboratório de informática 1'),
  ('Laboratório 2', 'Laboratório de informática 2')
ON CONFLICT (nome_laboratorio) DO NOTHING;

-- 2. Novas colunas em computadores
ALTER TABLE public.computadores
  ADD COLUMN IF NOT EXISTS laboratorio_id UUID REFERENCES public.laboratorios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS numero_serie TEXT,
  ADD COLUMN IF NOT EXISTS data_aquisicao DATE;

-- 3. Nova coluna em manutencoes
ALTER TABLE public.manutencoes
  ADD COLUMN IF NOT EXISTS peca_utilizada TEXT;

-- 4. Trigger updated_at em laboratorios (reutiliza função existente)
DROP TRIGGER IF EXISTS update_laboratorios_updated_at ON public.laboratorios;
CREATE TRIGGER update_laboratorios_updated_at
  BEFORE UPDATE ON public.laboratorios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. RLS em laboratorios
ALTER TABLE public.laboratorios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated view laboratorios" ON public.laboratorios;
CREATE POLICY "Authenticated view laboratorios"
  ON public.laboratorios FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins manage laboratorios" ON public.laboratorios;
CREATE POLICY "Admins manage laboratorios"
  ON public.laboratorios FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));