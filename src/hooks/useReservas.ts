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
}

export interface Laboratorio {
  id:               string;
  nome_laboratorio: string;
}

export const useReservas = (authUid: string, userEmail: string) => {
  const [minhasReservas, setMinhasReservas] = useState<Reserva[]>([]);
  const [laboratorios, setLaboratorios]     = useState<Laboratorio[]>([]);
  const [reservasDoDia, setReservasDoDia]   = useState<Reserva[]>([]);
  const [isLoading, setIsLoading]           = useState(true);
  const [userNome, setUserNome]             = useState<string>('');
  const [userSetor, setUserSetor]           = useState<string | null>(null);

  useEffect(() => {
    if (!authUid) return;

    const init = async () => {
      try {
        const hoje = new Date().toISOString().split('T')[0];

        // Busca nome e setor do usuário logado via profiles + setores
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('nome, setores(nome)')
          .eq('user_id', authUid)
          .maybeSingle();

        if (profileError) throw profileError;

        const nome  = profileData?.nome ?? userEmail;
        const setor = (profileData?.setores as any)?.nome ?? null;

        setUserNome(nome);
        setUserSetor(setor);

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
        setMinhasReservas(reservaRes.data || []);
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
        toast.error('Não é possível reservar para uma data passada.');
        return false;
      }

      const { data: temConflito, error: conflictError } = await supabase.rpc(
        'verificar_conflito_reserva',
        {
          p_laboratorio_id: laboratorioId,
          p_data:           dataReserva,
          p_inicio:         horarioInicio,
          p_fim:            horarioFim,
        }
      );

      if (conflictError) throw conflictError;

      if (temConflito) {
        toast.error('Esta sala já está ocupada neste horário!');
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
        }]);

      if (insertError) throw insertError;

      toast.success('Sala reservada com sucesso!');

      const { data: atualizadas } = await supabase
        .from('reserva_salas')
        .select('*')
        .eq('professor_email', userEmail)
        .gte('data_reserva', hoje)
        .order('data_reserva', { ascending: true });

      setMinhasReservas(atualizadas || []);
      return true;
    } catch (err: any) {
      console.error('Erro ao criar reserva:', err.message);
      toast.error('Erro ao criar a reserva.');
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

      toast.success('Reserva cancelada.');
      setMinhasReservas((prev) => prev.filter((r) => r.id !== reservaId));
    } catch (err: any) {
      console.error('Erro ao cancelar reserva:', err.message);
      toast.error('Erro ao cancelar a reserva.');
    }
  };

  return {
    laboratorios,
    minhasReservas,
    reservasDoDia,
    isLoading,
    userNome,
    userSetor,
    carregarReservasDoDia,
    criarReserva,
    cancelarReserva,
  };
};

export default useReservas;