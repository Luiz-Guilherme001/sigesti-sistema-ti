-- Cria a tabela reserva_salas (agendamento de laboratórios e espaços)
CREATE TABLE IF NOT EXISTS public.reserva_salas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  professor_nome text NOT NULL,
  professor_email text NOT NULL,
  laboratorio_id text NOT NULL,
  data_reserva date NOT NULL,
  horario_inicio time without time zone NOT NULL,
  horario_fim time without time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  professor_setor text,
  CONSTRAINT reserva_salas_pkey PRIMARY KEY (id)
);

-- Habilita RLS
ALTER TABLE public.reserva_salas ENABLE ROW LEVEL SECURITY;

-- Policy: usuários autenticados podem ver todas as reservas (para evitar conflitos de horário)
CREATE POLICY "Usuarios autenticados podem ver reservas"
  ON public.reserva_salas
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: usuários autenticados podem criar suas próprias reservas
CREATE POLICY "Usuarios autenticados podem criar reservas"
  ON public.reserva_salas
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: usuários podem cancelar suas próprias reservas, admin pode cancelar qualquer uma
CREATE POLICY "Usuarios podem cancelar suas reservas"
  ON public.reserva_salas
  FOR DELETE
  TO authenticated
  USING (
    professor_email = (SELECT email FROM public.profiles WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );