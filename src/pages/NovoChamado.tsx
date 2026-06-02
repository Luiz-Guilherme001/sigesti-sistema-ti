import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle } from "lucide-react";
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

interface Equipamento { id: string; nome: string; patrimonio: string; }

const NovoChamado = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [localUserSetor, setLocalUserSetor] = useState<{ id: string; nome: string } | null>(null);
  const [form, setForm] = useState({
    titulo: "", descricao: "", tipo: "manutencao",
    prioridade: "media", equipamento_id: "", equipamento_nome: "",
  });

  // Buscar o setor do usuário diretamente do banco
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
    supabase.from("computadores").select("id, nome, patrimonio").order("nome")
      .then(({ data }) => {
        setEquipamentos((data ?? []).map((e) => ({
          id: e.id ?? "", nome: e.nome ?? "", patrimonio: e.patrimonio ?? "",
        })));
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim()) { toast.error("Informe o título"); return; }
    if (!form.descricao.trim()) { toast.error("Informe a descrição"); return; }
    if (!form.equipamento_id) { toast.error("Selecione um equipamento"); return; }

    setLoading(true);
    
    const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) {
    toast.error("Sessão expirada. Faça login novamente.");
    setLoading(false);
    return;
  }
    
    const { error } = await supabase.from("chamados").insert({
      titulo: form.titulo,
      descricao: form.descricao,
      tipo: form.tipo,
      prioridade: form.prioridade,
      status: "aberto",
      equipamento_id: form.equipamento_id,
      equipamento_nome: form.equipamento_nome,
      solicitante_id: currentUser.id,
      solicitante_nome: userProfile?.nome ?? user?.email?.split("@")[0] ?? "Usuário",
      solicitante_email: user?.email,
      setor_id: localUserSetor?.id ?? null,
      setor_nome: localUserSetor?.nome ?? null,
    });

    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("✅ Chamado aberto com sucesso!");
    navigate("/meus-chamados");
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <PlusCircle className="h-6 w-6 text-primary" /> Abrir Chamado
        </h1>
        <p className="text-sm text-muted-foreground">Registre um novo chamado de suporte</p>
      </div>

      <form onSubmit={handleSubmit} className="stat-card space-y-4">
        <div>
          <Label>Título *</Label>
          <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ex: Computador não liga" required />
        </div>

        <div>
          <Label>Descrição *</Label>
          <Textarea rows={4} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descreva o problema detalhadamente..." required />
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

        <div>
          <Label>Equipamento *</Label>
          <Select value={form.equipamento_id} onValueChange={(v) => {
            const eq = equipamentos.find((e) => e.id === v);
            setForm({ ...form, equipamento_id: v, equipamento_nome: eq?.nome ?? "" });
          }}>
            <SelectTrigger><SelectValue placeholder="Selecione o equipamento com problema" /></SelectTrigger>
            <SelectContent>
              {equipamentos.map((eq) => (
                <SelectItem key={eq.id} value={eq.id}>
                  {eq.nome} {eq.patrimonio && `(${eq.patrimonio})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate("/meus-chamados")}>Cancelar</Button>
          <Button type="submit" disabled={loading}>{loading ? "Enviando..." : "Abrir Chamado"}</Button>
        </div>
      </form>
    </div>
  );
};

export default NovoChamado;