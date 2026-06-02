import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Chamado {
  id: string;
  titulo: string;
  descricao: string;
  tipo: string;
  status: string;
  prioridade: string;
  tecnico_nome: string;
  solicitante_nome: string;
  equipamento_nome: string;
  created_at: string;
}

const ChamadoVisualizar = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chamado, setChamado] = useState<Chamado | null>(null);
  const [loading, setLoading] = useState(true);

  const formatarData = (d: string) => {
  if (!d) return "—";
  // Se não tiver timezone info, trata como America/Belem
  const date = d.includes("+") || d.endsWith("Z") 
    ? new Date(d) 
    : new Date(d + "-03:00");
  return date.toLocaleString("pt-BR", {
    timeZone: "America/Belem",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      aberto: "Aberto",
      em_andamento: "Em andamento",
      resolvido: "Resolvido",
      fechado: "Fechado",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      aberto: "text-yellow-500",
      em_andamento: "text-blue-500",
      resolvido: "text-green-500",
      fechado: "text-gray-500",
    };
    return colors[status] || "text-gray-500";
  };

  const getPrioridadeLabel = (prioridade: string) => {
    const labels: Record<string, string> = {
      baixa: "Baixa",
      media: "Média",
      alta: "Alta",
    };
    return labels[prioridade] || prioridade;
  };

  const getPrioridadeColor = (prioridade: string) => {
    const colors: Record<string, string> = {
      baixa: "text-gray-500",
      media: "text-yellow-500",
      alta: "text-red-500",
    };
    return colors[prioridade] || "text-gray-500";
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      manutencao: "Manutenção",
      suporte: "Suporte",
      instalacao: "Instalação",
      sistema: "Sistema",
    };
    return labels[tipo] || tipo;
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("chamados")
        .select("*")
        .eq("id", id!)
        .single();

      if (error) {
        toast.error("Chamado não encontrado");
        navigate("/chamados");
      } else {
        setChamado(data);
      }
      setLoading(false);
    };
    load();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!chamado) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Chamado não encontrado</p>
        <button onClick={() => navigate("/chamados")} className="text-primary mt-4">
          Voltar para lista
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/chamados")} className="text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Detalhes do Chamado</h1>
          <p className="text-sm text-muted-foreground">Visualize as informações do chamado</p>
        </div>
      </div>

      <div className="stat-card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Título</p>
            <p className="font-medium">{chamado.titulo}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tipo</p>
            <p className="font-medium">{getTipoLabel(chamado.tipo)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <p className={`font-medium ${getStatusColor(chamado.status)}`}>
              {getStatusLabel(chamado.status)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Prioridade</p>
            <p className={`font-medium ${getPrioridadeColor(chamado.prioridade)}`}>
              {getPrioridadeLabel(chamado.prioridade)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Solicitante</p>
            <p className="font-medium">{chamado.solicitante_nome}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Técnico Responsável</p>
            <p className="font-medium">{chamado.tecnico_nome || "Não atribuído"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Equipamento</p>
            <p className="font-medium">{chamado.equipamento_nome || "Não informado"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Data de Abertura</p>
            <p className="font-medium">{formatarData(chamado.created_at)}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">Descrição</p>
          <p className="text-sm mt-1 whitespace-pre-wrap">{chamado.descricao}</p>
        </div>
      </div>
    </div>
  );
};

export default ChamadoVisualizar;