import React, { useState } from 'react';
import { useReservas } from '@/hooks/useReservas';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Calendar, Layout, Trash, Sunrise, Sun, Moon } from 'lucide-react';
import { toast } from 'sonner';

const TURNOS = [
  {
    label: 'Manhã',
    icon: Sunrise,
    cor: 'text-amber-500',
    slots: [
      { inicio: '07:30', fim: '08:20' },
      { inicio: '08:20', fim: '09:10' },
      { inicio: '09:10', fim: '10:00' },
      { inicio: '10:20', fim: '11:10' },
      { inicio: '11:10', fim: '12:00' },
      { inicio: '12:00', fim: '12:50' },
    ],
  },
  {
    label: 'Tarde',
    icon: Sun,
    cor: 'text-orange-500',
    slots: [
      { inicio: '13:30', fim: '14:20' },
      { inicio: '14:20', fim: '15:10' },
      { inicio: '15:10', fim: '16:00' },
      { inicio: '16:20', fim: '17:10' },
      { inicio: '17:10', fim: '18:00' },
      { inicio: '18:00', fim: '18:50' },
    ],
  },
  {
    label: 'Noite',
    icon: Moon,
    cor: 'text-indigo-500',
    slots: [
      { inicio: '18:50', fim: '19:30' },
      { inicio: '19:30', fim: '20:10' },
      { inicio: '20:10', fim: '20:50' },
      { inicio: '20:50', fim: '21:30' },
      { inicio: '21:30', fim: '22:10' },
    ],
  },
];

const normalizar = (h: string) => h.substring(0, 5);

export const AgendamentoSalas: React.FC = () => {
  const { user } = useAuth();
  const userEmail = user?.email ?? '';

  const {
    laboratorios,
    minhasReservas,
    reservasDoDia,
    isLoading,
    carregarReservasDoDia,
    criarReserva,
    cancelarReserva,
  } = useReservas(user?.id ?? '', userEmail);

  const [labSelecionado, setLabSelecionado]   = useState<string | null>(null);
  const [dataSelecionada, setDataSelecionada] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const handleSelecionarLab = async (labId: string) => {
    setLabSelecionado(labId);
    await carregarReservasDoDia(labId, dataSelecionada);
  };

  const handleDataChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const novaData = e.target.value;
    setDataSelecionada(novaData);
    if (labSelecionado) {
      await carregarReservasDoDia(labSelecionado, novaData);
    }
  };

  const slotOcupado = (inicio: string, fim: string) =>
    reservasDoDia.some(
      (r) =>
        normalizar(r.horario_inicio) < fim &&
        normalizar(r.horario_fim)    > inicio
    );

  const quemReservou = (inicio: string, fim: string) => {
    const reserva = reservasDoDia.find(
      (r) =>
        normalizar(r.horario_inicio) < fim &&
        normalizar(r.horario_fim)    > inicio
    );
    if (!reserva) return null;
    return reserva.professor_setor
      ? `${reserva.professor_nome} · ${reserva.professor_setor}`
      : reserva.professor_nome;
  };

  const handleReservar = async (inicio: string, fim: string) => {
    if (!labSelecionado) {
      toast.error('Selecione um laboratório primeiro.');
      return;
    }
    const sucesso = await criarReserva(labSelecionado, dataSelecionada, inicio, fim);
    if (sucesso) {
      await carregarReservasDoDia(labSelecionado, dataSelecionada);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 text-muted-foreground text-sm">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2" />
        Carregando painel de reservas...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto bg-background min-h-screen text-foreground">

      {/* Cabeçalho */}
      <div className="flex flex-col space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-primary">EETEPA SIGESTI</h1>
        <p className="text-xs text-muted-foreground">
          Sistema Integrado de Gestão de TI · Agendamento de Salas e Laboratórios
        </p>
      </div>

      {/* 1. Filtros */}
      <Card className="rounded-2xl shadow-md border border-border bg-card">
        <CardHeader className="flex flex-row items-center gap-2 p-5 pb-3">
          <Calendar className="w-5 h-5 text-primary" />
          <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            Filtros de Agendamento
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5">
          <div className="md:col-span-1">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Selecione a data
            </label>
            <input
              type="date"
              value={dataSelecionada}
              min={new Date().toISOString().split('T')[0]}
              onChange={handleDataChange}
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Selecione o local
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {laboratorios.map((lab) => (
                <button
                  key={lab.id}
                  onClick={() => handleSelecionarLab(lab.id)}
                  className={`rounded-xl border px-3 py-2.5 text-xs font-semibold tracking-wide transition-all duration-200 active:scale-[0.98] ${
                    labSelecionado === lab.id
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-muted/30 border-border text-foreground hover:bg-muted/50'
                  }`}
                >
                  {lab.nome_laboratorio}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Grade de Horários por Turno */}
      {labSelecionado ? (
        <div className="space-y-4">
          {TURNOS.map((turno) => {
            const TurnoIcon = turno.icon;
            return (
              <Card key={turno.label} className="rounded-2xl shadow-md border border-border bg-card">
                <CardHeader className="flex flex-row items-center gap-2 p-5 pb-3">
                  <TurnoIcon className={`w-5 h-5 ${turno.cor}`} />
                  <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                    Turno da {turno.label} — {dataSelecionada}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    {turno.slots.map((slot) => {
                      const ocupado = slotOcupado(slot.inicio, slot.fim);
                      const info    = quemReservou(slot.inicio, slot.fim);
                      return (
                        <button
                          key={slot.inicio}
                          disabled={ocupado}
                          onClick={() => handleReservar(slot.inicio, slot.fim)}
                          className={`group relative rounded-xl border p-3 text-center transition-all duration-200 active:scale-[0.97] ${
                            ocupado
                              ? 'bg-destructive/5 text-destructive border-destructive/20 cursor-not-allowed opacity-70'
                              : 'bg-muted/30 border-border text-foreground hover:bg-primary/10 hover:border-primary/50 cursor-pointer shadow-sm'
                          }`}
                        >
                          <div className="text-xs font-bold">{slot.inicio}</div>
                          <div className="text-[10px] text-muted-foreground">{slot.fim}</div>
                          {ocupado ? (
                            <div className="mt-1 space-y-0.5">
                              <span className="inline-block px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-destructive/10 text-destructive">
                                Ocupado
                              </span>
                              {info && (
                                <div className="text-[9px] text-destructive/70 truncate max-w-full">
                                  {info}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
                              Reservar
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col justify-center items-center h-48 border-2 border-dashed border-border rounded-2xl bg-muted/10 text-muted-foreground p-6 text-center">
          <Layout className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-xs font-medium">
            Selecione um laboratório acima para visualizar os horários disponíveis.
          </p>
        </div>
      )}

      {/* 3. Minhas Reservas */}
      <Card className="rounded-2xl shadow-md border border-border bg-card">
        <CardHeader className="flex flex-row items-center gap-2 p-5 pb-3">
          <Trash className="w-5 h-5 text-primary" />
          <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            Minhas Reservas Ativas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          {minhasReservas.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              Você não possui reservas de salas agendadas no momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {minhasReservas.map((reserva) => {
                const lab = laboratorios.find((l) => l.id === reserva.laboratorio_id);
                return (
                  <div
                    key={reserva.id}
                    className="flex items-center justify-between rounded-2xl border border-border bg-muted/20 px-4 py-3 shadow-sm hover:bg-muted/30 transition-all"
                  >
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-xs font-semibold text-foreground">
                        {lab?.nome_laboratorio ?? reserva.laboratorio_id}
                      </span>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <span>{reserva.data_reserva}</span>
                        <span>·</span>
                        <span>
                          {normalizar(reserva.horario_inicio)} – {normalizar(reserva.horario_fim)}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {reserva.professor_nome}
                        {reserva.professor_setor && (
                          <span className="ml-1 text-muted-foreground/70">· {reserva.professor_setor}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-sm"
                      onClick={() => cancelarReserva(reserva.id)}
                      title="Cancelar Reserva"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AgendamentoSalas;