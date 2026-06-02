import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Tecnico { id: string; nome: string; }
interface Equipamento { id: string; nome: string; patrimonio: string; }

const ChamadoForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, userProfile, userSetor } = useAuth();
  const [loading, setLoading] = useState(false);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [loadingDados, setLoadingDados] = useState(true);
  const [localUserSetor, setLocalUserSetor] = useState<{ id: string; nome: string } | null>(null);

  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    tipo: "manutencao",
    prioridade: "media",
    tecnico_id: "",
    equipamento_id: "",
  });

  useEffect(() => {
    const buscarSetorDoUsuario = async () => {
      if (!user?.id) return;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("setor_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Erro ao buscar perfil:", profileError);
        return;
      }

      if (profile?.setor_id) {
        const { data: setor, error: setorError } = await supabase
          .from("setores")
          .select("id, nome")
          .eq("id", profile.setor_id)
          .maybeSingle();

        if (!setorError && setor) {
          setLocalUserSetor(setor);
        } else {
          setLocalUserSetor(null);
        }
      } else {
        setLocalUserSetor(null);
      }
    };

    buscarSetorDoUsuario();
  }, [user?.id]);

  useEffect(() => {
    const carregarDados = async () => {
      setLoadingDados(true);

      const { data: perfisData, error } = await supabase
  .from("profiles")
  .select("user_id, nome")
  .eq("role", "tecnico")
  .not("nome", "is", null)
  .order("nome");

if (error) {
  toast.error("Erro ao buscar técnicos: " + error.message);
  setTecnicos([]);
} else {
  setTecnicos(
    (perfisData ?? []).map((p) => ({
      id: p.user_id ?? "",
      nome: p.nome ?? "",
    }))
  );
}

      const { data: equipamentosData } = await supabase
        .from("computadores")
        .select("id, nome, patrimonio")
        .order("nome");

      if (equipamentosData) {
        setEquipamentos(equipamentosData.map((e) => ({
          id: e.id ?? "",
          nome: e.nome ?? "",
          patrimonio: e.patrimonio ?? "",
        })));
      }

      if (id) {
        const { data: chamadoData } = await supabase
          .from("chamados")
          .select("*")
          .eq("id", id)
          .single();

        if (chamadoData) {
          setForm({
            titulo: chamadoData.titulo ?? "",
            descricao: chamadoData.descricao ?? "",
            tipo: chamadoData.tipo ?? "manutencao",
            prioridade: chamadoData.prioridade ?? "media",
            tecnico_id: chamadoData.tecnico_id ?? "",
            equipamento_id: chamadoData.equipamento_id ?? "",
          });
        }
      }

      setLoadingDados(false);
    };

    carregarDados();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    
    e.preventDefault();
   
    if (!form.titulo.trim()) { toast.error("❌ Informe o título"); return; }
    if (!form.descricao.trim()) { toast.error("❌ Informe a descrição"); return; }
    setLoading(true);
// 2. Busca o usuário atual diretamente do Supabase
  const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
  if (userError || !currentUser) {
    toast.error("Sessão expirada. Faça login novamente.");
    setLoading(false);
    return;
  }
  const userId = currentUser.id;
  

    const tecnicoSelecionado = tecnicos.find((t) => t.id === form.tecnico_id);
    const equipamentoSelecionado = equipamentos.find((e) => e.id === form.equipamento_id);

    const setorId = localUserSetor?.id ?? userSetor?.id ?? null;
    const setorNome = localUserSetor?.nome ?? userSetor?.nome ?? null;

    const chamadoData = {
      
      titulo: form.titulo,
      descricao: form.descricao,
      tipo: form.tipo,
      prioridade: form.prioridade,
      status: "aberto",
      tecnico_id: form.tecnico_id || null,
      tecnico_nome: tecnicoSelecionado?.nome ?? null,
      equipamento_id: form.equipamento_id || null,
      equipamento_nome: equipamentoSelecionado?.nome ?? null,
      solicitante_id: currentUser.id,
      solicitante_nome: userProfile?.nome ?? user?.email?.split("@")[0] ?? "Usuário",
      solicitante_email: user?.email ?? null,
      setor_id: setorId || null,
      setor_nome: setorNome || null,
      data_encerramento: null,
      };
    let result;

    if (id) {
      const { solicitante_id, solicitante_nome, solicitante_email, setor_id, setor_nome, status, data_encerramento, ...updateData } = chamadoData;
      result = await supabase
        .from("chamados")
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
    } else {
      result = await supabase.from("chamados").insert(chamadoData);
    }

    if (result.error) {
      toast.error("❌ " + result.error.message);
    } else {
      toast.success(id ? "✅ Chamado atualizado com sucesso!" : "✅ Chamado criado com sucesso!");
      navigate("/chamados");
    }

    setLoading(false);
  };

  if (loadingDados) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
          <h1 className="text-2xl font-bold">{id ? "Editar Chamado" : "Novo Chamado"}</h1>
          <p className="text-sm text-muted-foreground">Preencha os campos abaixo</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
        <div>
          <Label>Título *</Label>
          <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ex: Computador não liga" required />
        </div>

        <div>
          <Label>Descrição *</Label>
          <Textarea rows={4} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descreva detalhadamente o problema..." required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Tipo</Label>
            <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manutencao">Manutenção</SelectItem>
                <SelectItem value="suporte">Suporte</SelectItem>
                <SelectItem value="instalacao">Instalação</SelectItem>
                <SelectItem value="sistema">Sistema</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Prioridade</Label>
            <Select value={form.prioridade} onValueChange={(v) => setForm({ ...form, prioridade: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Técnico Responsável</Label>
            <Select value={form.tecnico_id} onValueChange={(v) => setForm({ ...form, tecnico_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione um técnico" /></SelectTrigger>
              <SelectContent>
                {tecnicos.map((tec) => (
                  <SelectItem key={tec.id} value={tec.id}>{tec.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Equipamento</Label>
            <Select value={form.equipamento_id} onValueChange={(v) => setForm({ ...form, equipamento_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione um equipamento" /></SelectTrigger>
              <SelectContent>
                {equipamentos.map((eq) => (
                  <SelectItem key={eq.id} value={eq.id}>
                    {eq.nome} {eq.patrimonio && `(${eq.patrimonio})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={() => navigate("/chamados")}>Cancelar</Button>
          <Button type="button" onClick={handleSubmit} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Salvando..." : "Salvar Chamado"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChamadoForm;