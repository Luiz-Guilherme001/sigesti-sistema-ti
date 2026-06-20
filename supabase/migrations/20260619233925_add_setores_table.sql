-- Cria a tabela setores
CREATE TABLE IF NOT EXISTS public.setores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  created_at timestamp without time zone DEFAULT now(),
  imagem_url text,
  icone text,
  CONSTRAINT setores_pkey PRIMARY KEY (id)
);

-- Adiciona a coluna setor_id em profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS setor_id uuid REFERENCES public.setores(id);

-- Adiciona a coluna setor_id em computadores
ALTER TABLE public.computadores
  ADD COLUMN IF NOT EXISTS setor_id uuid REFERENCES public.setores(id);

-- Cria a tabela chamados (não existia no banco)
CREATE TABLE IF NOT EXISTS public.chamados (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao text NOT NULL,
  tipo text DEFAULT 'manutencao'::text,
  status text DEFAULT 'aberto'::text,
  prioridade text DEFAULT 'media'::text,
  solicitante_id uuid,
  solicitante_nome text,
  solicitante_email text,
  tecnico_id uuid,
  tecnico_nome text,
  equipamento_id uuid,
  equipamento_nome text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  setor_id uuid REFERENCES public.setores(id),
  setor_nome text,
  data_encerramento timestamp with time zone,
  CONSTRAINT chamados_pkey PRIMARY KEY (id)
);

-- Habilita RLS em chamados
ALTER TABLE public.chamados ENABLE ROW LEVEL SECURITY;

-- Policy: usuários autenticados podem ver todos os chamados
CREATE POLICY "Usuarios autenticados podem ver chamados"
  ON public.chamados
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: usuários autenticados podem criar chamados
CREATE POLICY "Usuarios autenticados podem criar chamados"
  ON public.chamados
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: staff (admin/tecnico) pode atualizar chamados
CREATE POLICY "Staff pode atualizar chamados"
  ON public.chamados
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'tecnico'));

-- Policy: admin pode excluir chamados
CREATE POLICY "Admin pode excluir chamados"
  ON public.chamados
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Habilita RLS
ALTER TABLE public.setores ENABLE ROW LEVEL SECURITY;

-- Policy: todos os usuários autenticados podem visualizar setores
CREATE POLICY "Usuarios autenticados podem ver setores"
  ON public.setores
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: apenas admin pode inserir/editar/excluir setores
CREATE POLICY "Admin pode gerenciar setores"
  ON public.setores
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));