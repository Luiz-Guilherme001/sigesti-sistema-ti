import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Reserva {
  id:              string;
  professor_nome:  string;
  professor_email: string;
  professor_setor: string | null;
  laboratorio_id:  string;
  data_reserva:    string;
  horario_inicio:  string;
  horario_fim:     string;
  created_at:      string;
  status:          'pendente' | 'aprovado' | 'rejeitado';
  observacao?:     string | null;
}

export interface Laboratorio {
  id:               string;
  nome_laboratorio: string;
}

const SETORES_COORDENACAO = [
  'b751d128-94c9-4e2d-a363-0756f763df39',
  'd6229edd-ecc4-41d5-af58-b96fc7249a77',
  '35b19e15-37cb-4d14-bab1-5bf4d3b70f6d',
  '665f781c-6537-416b-a475-956740ded1b4',
  '01373263-5d93-474d-9160-5f2ecb1192b2',
];

export const useReservas = (authUid: string, userEmail: string) => {
  const [minhasReservas, setMinhasReservas]         = useState<Reserva[]>([]);
  const [laboratorios, setLaboratorios]             = useState<Laboratorio[]>([]);
  const [reservasDoDia, setReservasDoDia]           = useState<Reserva[]>([]);
  const [reservasPendentes, setReservasPendentes]   = useState<Reserva[]>([]);
  const [isLoading, setIsLoading]                   = useState(true);
  const [userNome, setUserNome]                     = useState<string>('');
  const [userSetor, setUserSetor]                   = useState<string | null>(null);
  const [userSetorId, setUserSetorId]               = useState<string | null>(null);
  const [isAdmin, setIsAdmin]                       = useState(false);
  const [isCoordenador, setIsCoordenador]           = useState(false);

  useEffect(() => {
    if (!authUid) return;

    const init = async () => {
      try {
        const hoje = new Date().toISOString().split('T')[0];

        // Busca nome, setor e papel do usuário logado
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('nome, setor_id, setores(nome)')
          .eq('user_id', authUid)
          .maybeSingle();

        if (profileError) throw profileError;

        const nome    = profileData?.nome ?? userEmail;
        const setor   = (profileData?.setores as any)?.nome ?? null;
        const setorId = profileData?.setor_id ?? null;

        setUserNome(nome);
        setUserSetor(setor);
        setUserSetorId(setorId);

        // Verifica se é admin
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authUid)
          .eq('role', 'admin')
          .maybeSingle();

        const admin = !!roleData;
        const coord = setorId ? SETORES_COORDENACAO.includes(setorId) : false;

        setIsAdmin(admin);
        setIsCoordenador(coord);

        const [labRes, reservaRes] = await Promise.all([
          supabase.from('laboratorios').select('id, nome_laboratorio'),
          supabase
            .from('reserva_salas')
            .select('*')
            .eq('professor_email', userEmail)
            .gte('data_reserva', hoje)
            .order('data_reserva', { ascending: true }),
        ]);

        if (labRes.error)     throw labRes.error;
        if (reservaRes.error) throw reservaRes.error;

        setLaboratorios(labRes.data || []);
        setMinhasReservas((reservaRes.data || []) as Reserva[]);

        // Se for admin ou coordenador, carrega pendentes
        if (admin || coord) {
          const { data: pendentes, error: pendError } = await supabase
            .from('reserva_salas')
            .select('*')
            .eq('status', 'pendente')
            .gte('data_reserva', hoje)
            .order('data_reserva', { ascending: true });

          if (pendError) throw pendError;
          setReservasPendentes((pendentes || []) as Reserva[]);
        }
      } catch (err: any) {
        console.error('Erro ao carregar dados:', err.message);
        toast.error('Erro ao carregar os dados de agendamentos.');
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [authUid, userEmail]);

  const carregarReservasDoDia = async (laboratorioId: string, data: string) => {
    try {
      const { data: reservas, error } = await supabase
        .from('reserva_salas')
        .select('*')
        .eq('laboratorio_id', laboratorioId)
        .eq('data_reserva', data);

      if (error) throw error;
      setReservasDoDia((reservas as Reserva[]) || []);
    } catch (err: any) {
      console.error('Erro ao carregar reservas do dia:', err.message);
      toast.error('Erro ao carregar ocupação da sala.');
    }
  };

  const criarReserva = async (
    laboratorioId: string,
    dataReserva:   string,
    horarioInicio: string,
    horarioFim:    string
  ): Promise<boolean> => {
    try {
      const hoje = new Date().toISOString().split('T')[0];

      if (dataReserva < hoje) {
        toast.error('Não é possível solicitar para uma data passada.');
        return false;
      }

      // Verifica conflito apenas com reservas APROVADAS
      const { data: conflito } = await supabase
        .from('reserva_salas')
        .select('id')
        .eq('laboratorio_id', laboratorioId)
        .eq('data_reserva', dataReserva)
        .eq('status', 'aprovado')
        .or(`horario_inicio.lt.${horarioFim},horario_fim.gt.${horarioInicio}`);

      if (conflito && conflito.length > 0) {
        toast.error('Este horário já está ocupado por uma reserva aprovada!');
        return false;
      }

      const { error: insertError } = await supabase
        .from('reserva_salas')
        .insert([{
          professor_nome:  userNome,
          professor_email: userEmail,
          professor_setor: userSetor,
          laboratorio_id:  laboratorioId,
          data_reserva:    dataReserva,
          horario_inicio:  horarioInicio,
          horario_fim:     horarioFim,
          status:          'pendente',
        }]);

      if (insertError) throw insertError;

      toast.success('Solicitação enviada! Aguarde aprovação da coordenação.');

      const { data: atualizadas } = await supabase
        .from('reserva_salas')
        .select('*')
        .eq('professor_email', userEmail)
        .gte('data_reserva', hoje)
        .order('data_reserva', { ascending: true });

      setMinhasReservas((atualizadas || []) as Reserva[]);
      return true;
    } catch (err: any) {
      console.error('Erro ao criar reserva:', err.message);
      toast.error('Erro ao enviar solicitação.');
      return false;
    }
  };

  const aprovarReserva = async (reservaId: string, observacao?: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('reserva_salas')
        .update({ status: 'aprovado', observacao: observacao ?? null })
        .eq('id', reservaId);

      if (error) throw error;

      toast.success('Reserva aprovada com sucesso!');
      setReservasPendentes(prev => prev.filter(r => r.id !== reservaId));
      return true;
    } catch (err: any) {
      console.error('Erro ao aprovar reserva:', err.message);
      toast.error('Erro ao aprovar a reserva.');
      return false;
    }
  };

  const rejeitarReserva = async (reservaId: string, observacao?: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('reserva_salas')
        .update({ status: 'rejeitado', observacao: observacao ?? null })
        .eq('id', reservaId);

      if (error) throw error;

      toast.success('Reserva rejeitada.');
      setReservasPendentes(prev => prev.filter(r => r.id !== reservaId));
      return true;
    } catch (err: any) {
      console.error('Erro ao rejeitar reserva:', err.message);
      toast.error('Erro ao rejeitar a reserva.');
      return false;
    }
  };

  const cancelarReserva = async (reservaId: string) => {
    try {
      const { error } = await supabase
        .from('reserva_salas')
        .delete()
        .eq('id', reservaId);

      if (error) throw error;

      toast.success('Solicitação cancelada.');
      setMinhasReservas(prev => prev.filter(r => r.id !== reservaId));
    } catch (err: any) {
      console.error('Erro ao cancelar reserva:', err.message);
      toast.error('Erro ao cancelar a solicitação.');
    }
  };

  return {
    laboratorios,
    minhasReservas,
    reservasDoDia,
    reservasPendentes,
    isLoading,
    isAdmin,
    isCoordenador,
    userNome,
    userSetor,
    carregarReservasDoDia,
    criarReserva,
    aprovarReserva,
    rejeitarReserva,
    cancelarReserva,
  };
};

export default useReservas;