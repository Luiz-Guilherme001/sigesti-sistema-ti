import { useEffect, useState, useMemo } from "react";
import { Search, Plus, Pencil, Trash2, ClipboardList, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Database } from "@/integrations/supabase/types";

type Chamado = Database['public']['Tables']['chamados']['Row'];

const statusLabels: Record<string, string> = {
  aberto: "Aberto",
  em_andamento: "Em andamento",
  resolvido: "Resolvido",
  fechado: "Fechado"
};

const statusColors: Record<string, string> = {
  aberto: "text-yellow-500 bg-yellow-500/10",
  em_andamento: "text-blue-500 bg-blue-500/10",
  resolvido: "text-green-500 bg-green-500/10",
  fechado: "text-gray-500 bg-gray-500/10",
};

const prioridadeLabels: Record<string, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta"
};

const prioridadeColors: Record<string, string> = {
  baixa: "text-gray-500 bg-gray-500/10",
  media: "text-yellow-500 bg-yellow-500/10",
  alta: "text-red-500 bg-red-500/10",
};

const tipoLabels: Record<string, string> = {
  manutencao: "Manutenção",
  suporte: "Suporte",
  instalacao: "Instalação",
  sistema: "Sistema"
};

const Chamados = () => {
  const navigate = useNavigate();
  const { isStaff } = useAuth();
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroSetor, setFiltroSetor] = useState<string>("todos");
  const [items, setItems] = useState<Chamado[]>([]);
  const [setores, setSetores] = useState<{ id: string; nome: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar setores
  useEffect(() => {
    supabase.from("setores").select("id, nome").order("nome").then(({ data }) => {
      setSetores(data ?? []);
    });
  }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("chamados")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      toast.error(error.message);
    } else {
      setItems((data ?? []) as Chamado[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string, titulo: string) => {
    if (!confirm(`Excluir o chamado "${titulo}"?`)) return;
    const { error } = await supabase.from("chamados").delete().eq("id", id);
    if (error) {
      toast.error("❌ " + error.message);
    } else {
      toast.success(`🗑️ Chamado "${titulo}" excluído com sucesso!`);
      load();
    }
  };

  const converterParaManutencao = async (chamado: Chamado) => {
    if (!chamado.tecnico_nome) {
      toast.error("❌ Atribua um técnico ao chamado antes de converter");
      return;
    }

    const { data: manutencao, error } = await supabase
      .from("manutencoes")
      .insert({
        computador: chamado.equipamento_nome,
        problema: chamado.titulo + " - " + chamado.descricao,
        tecnico: chamado.tecnico_nome,
        status: "Em andamento",
        prioridade: chamado.prioridade === "alta" ? "Alta" : 
                    chamado.prioridade === "media" ? "Média" : "Baixa",
        data: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      toast.error("❌ Erro ao criar manutenção: " + error.message);
      return;
    }

    await supabase
      .from("chamados")
      .update({ 
        status: "em_andamento", 
        updated_at: new Date().toISOString()
      })
      .eq("id", chamado.id);

    toast.success("✅ Chamado convertido em manutenção!");
    load();
  };

  const formatarData = (d: string | null) => {
    if (!d) return "—";
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return "—";
      return date.toLocaleString("pt-BR", {
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

  // ✅ NOVA FUNÇÃO: Formatar data de encerramento
  const formatarDataEncerramento = (chamado: Chamado) => {
    if (chamado.status === 'resolvido' && chamado.data_encerramento) {
      return formatarData(chamado.data_encerramento);
    }
    return "—";
  };

  const filtered = useMemo(() => {
  const q = busca.trim().toLowerCase();

  return items
    .filter((c) => {
      if (filtroSetor === "todos") return true;

      const setorSelecionado = setores.find(
        (s) => s.id === filtroSetor
      );

      return c.setor_nome === setorSelecionado?.nome;
    })
    .filter((c) =>
      filtroStatus === "todos"
        ? true
        : c.status === filtroStatus
    )
    .filter((c) =>
      !q ||
      c.titulo?.toLowerCase().includes(q) ||
      c.descricao?.toLowerCase().includes(q) ||
      (c.solicitante_nome ?? "").toLowerCase().includes(q) ||
      (c.setor_nome ?? "").toLowerCase().includes(q)
    );
}, [items, busca, filtroStatus, filtroSetor, setores]);

  const abertos = items.filter((i) => i.status === "aberto").length;
  const emAndamento = items.filter((i) => i.status === "em_andamento").length;
  const resolvidos = items.filter((i) => i.status === "resolvido").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" /> Chamados
          </h1>
          <p className="text-sm text-muted-foreground">Gerencie os chamados do setor de TI</p>
        </div>
        {isStaff && (
          <Button onClick={() => navigate("/chamados/novo")}>
            <Plus className="h-4 w-4 mr-2" /> Novo Chamado
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-yellow-500">{abertos}</p>
          <p className="text-xs text-muted-foreground">Abertos</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-blue-500">{emAndamento}</p>
          <p className="text-xs text-muted-foreground">Em andamento</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-green-500">{resolvidos}</p>
          <p className="text-xs text-muted-foreground">Resolvidos</p>
        </div>
      </div>

      <div className="stat-card">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, solicitante ou setor..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="aberto">Aberto</SelectItem>
              <SelectItem value="em_andamento">Em andamento</SelectItem>
              <SelectItem value="resolvido">Resolvido</SelectItem>
              <SelectItem value="fechado">Fechado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtroSetor} onValueChange={setFiltroSetor}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por setor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os setores</SelectItem>
              {setores.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="pb-3 font-medium">Título</th>
                <th className="pb-3 font-medium">Tipo</th>
                <th className="pb-3 font-medium">Descrição</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Prioridade</th>
                <th className="pb-3 font-medium">Solicitante</th>
                <th className="pb-3 font-medium">Setor</th>
                <th className="pb-3 font-medium">Técnico</th>
                <th className="pb-3 font-medium">Data Abertura</th>
                <th className="pb-3 font-medium">Data Encerramento</th>
                {isStaff && <th className="pb-3 font-medium text-right">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="py-6 text-center text-muted-foreground">Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="py-6 text-center text-muted-foreground">Nenhum chamado encontrado</td></tr>
              ) : (
                filtered.map((chamado) => (
                  <tr key={chamado.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 font-medium">{chamado.titulo}</td>
                    <td className="py-3">{tipoLabels[chamado.tipo || "manutencao"]}</td>
                    <td className="py-3 text-muted-foreground max-w-xs truncate">
                      {chamado.descricao || "—"}
                    </td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColors[chamado.status || "aberto"]}`}>
                        {statusLabels[chamado.status || "aberto"]}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${prioridadeColors[chamado.prioridade || "media"]}`}>
                        {prioridadeLabels[chamado.prioridade || "media"]}
                      </span>
                    </td>
                    <td className="py-3">{chamado.solicitante_nome || "—"}</td>
                    <td className="py-3">{chamado.setor_nome || "—"}</td>
                    <td className="py-3">{chamado.tecnico_nome || "—"}</td>
                    <td className="py-3 text-muted-foreground">{formatarData(chamado.created_at)}</td>
                    <td className="py-3 text-muted-foreground">{formatarDataEncerramento(chamado)}</td>
                    {isStaff && (
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => navigate(`/chamados/${chamado.id}`)} 
                            className="p-1 hover:text-blue-500" 
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => navigate(`/chamados/${chamado.id}/editar`)} 
                            className="p-1 hover:text-primary" 
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(chamado.id, chamado.titulo || "")} 
                            className="p-1 hover:text-red-500" 
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          {chamado.status !== 'resolvido' && chamado.status !== 'fechado' && (
                            <button 
                              onClick={() => converterParaManutencao(chamado)} 
                              className="p-1 hover:text-green-500"
                              title="Converter em manutenção"
                            >
                              <ClipboardList className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Chamados;