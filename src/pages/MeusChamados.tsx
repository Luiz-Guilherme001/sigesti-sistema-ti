import { useEffect, useState, useCallback } from "react";
import { ClipboardList, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

type Chamado = Database['public']['Tables']['chamados']['Row'];

const statusColor = (s: string | null) => {
  const colors: Record<string, string> = {
    aberto: "bg-yellow-500/10 text-yellow-500",
    em_andamento: "bg-blue-500/10 text-blue-500",
    resolvido: "bg-green-500/10 text-green-500",
    fechado: "bg-gray-500/10 text-gray-500",
  };
  return colors[s ?? ""] ?? "bg-gray-500/10 text-gray-500";
};

const statusLabel = (s: string | null) => {
  const labels: Record<string, string> = {
    aberto: "Aberto",
    em_andamento: "Em andamento",
    resolvido: "Resolvido",
    fechado: "Fechado",
  };
  return labels[s ?? ""] ?? s ?? "—";
};

const formatDate = (d: string | null) => {
  if (!d) return "—";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

const MeusChamados = () => {
  const { user } = useAuth();
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Chamado | null>(null);

  const load = useCallback(async () => {
    if (!user?.email) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("chamados")
      .select("*")
      .eq("solicitante_email", user.email)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message);
      console.error("Erro ao carregar chamados:", error);
    } else {
      setChamados((data ?? []) as Chamado[]);
    }

    setLoading(false);
  }, [user?.email]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!user?.email) return;

    const channel = supabase
      .channel("meus-chamados")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chamados",
          filter: `solicitante_email=eq.${user.email}`,
        },
        (payload) => {
          load();

          if (payload.eventType === "UPDATE") {
            const newStatus = (payload.new as Chamado).status;
            const oldStatus = (payload.old as Chamado).status;

            if (newStatus !== oldStatus) {
              if (newStatus === "em_andamento") {
                toast.info("📌 Seu chamado está em andamento!");
              } else if (newStatus === "resolvido") {
                toast.success("✅ Seu chamado foi resolvido!");
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.email, load]);

  const abertos = chamados.filter((c) => c.status === "aberto").length;
  const emAndamento = chamados.filter((c) => c.status === "em_andamento").length;
  const resolvidos = chamados.filter((c) => c.status === "resolvido").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-primary" /> Meus Chamados
        </h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe seus chamados abertos
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: chamados.length, color: "text-primary" },
          { label: "Abertos", value: abertos, color: "text-yellow-500" },
          { label: "Em andamento", value: emAndamento, color: "text-blue-500" },
          { label: "Resolvidos", value: resolvidos, color: "text-green-500" },
        ].map((c) => (
          <div key={c.label} className="stat-card text-center">
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="stat-card">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : chamados.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhum chamado encontrado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="pb-3">Título</th>
                  <th className="pb-3">Descrição</th>
                  <th className="pb-3">Equipamento</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Data Abertura</th>
                  <th className="pb-3">Data Encerramento</th>
                  <th className="pb-3 text-right">Ver</th>
                </tr>
              </thead>

              <tbody>
                {chamados.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-border hover:bg-muted/50"
                  >
                    <td className="py-3 font-medium">{c.titulo}</td>

                    <td className="py-3 text-muted-foreground max-w-xs truncate">
                    {c.descricao || "—"}
                    </td>

                    <td className="py-3 text-muted-foreground">
                      {c.equipamento_nome || "—"}
                    </td>

                    <td className="py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${statusColor(c.status)}`}
                      >
                        {statusLabel(c.status)}
                      </span>
                    </td>

                    <td className="py-3 text-muted-foreground">
                      {formatDate(c.created_at)}
                    </td>

                    <td className="py-3 text-muted-foreground">
                      {c.data_encerramento
                        ? formatDate(c.data_encerramento)
                        : "—"}
                    </td>

                    <td className="py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelected(c)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.titulo}</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge className={statusColor(selected.status)}>
                    {statusLabel(selected.status)}
                  </Badge>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Prioridade</p>
                  <p className="font-medium">{selected.prioridade}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Tipo</p>
                  <p className="font-medium">{selected.tipo}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Equipamento
                  </p>
                  <p className="font-medium">
                    {selected.equipamento_nome || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Data Abertura
                  </p>
                  <p className="font-medium">
                    {formatDate(selected.created_at)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Data Encerramento
                  </p>
                  <p className="font-medium">
                    {selected.data_encerramento
                      ? formatDate(selected.data_encerramento)
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-xs text-muted-foreground mb-1">
                  Descrição
                </p>
                <p className="whitespace-pre-wrap">
                  {selected.descricao}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MeusChamados;