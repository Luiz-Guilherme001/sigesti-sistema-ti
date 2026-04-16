import { useEffect, useState } from "react";
import { Search, Plus, Wrench, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Item {
  id: string;
  computador: string;
  problema: string;
  tecnico: string;
  data: string;
  status: string;
  prioridade: string;
}

const statusColors: Record<string, string> = {
  Pendente: "bg-warning/10 text-warning",
  "Em andamento": "bg-info/10 text-info",
  Concluída: "bg-success/10 text-success",
};
const prioridadeColors: Record<string, string> = {
  Alta: "bg-accent/10 text-accent",
  Média: "bg-warning/10 text-warning",
  Baixa: "bg-success/10 text-success",
};

const Manutencao = () => {
  const [busca, setBusca] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    computador: "", problema: "", tecnico: "", status: "Pendente", prioridade: "Média",
  });
  const { isStaff } = useAuth();

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("manutencoes").select("*").order("data", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data ?? []) as Item[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("manutencoes").insert(form);
    if (error) return toast.error(error.message);
    toast.success("Manutenção criada");
    setForm({ computador: "", problema: "", tecnico: "", status: "Pendente", prioridade: "Média" });
    setOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir?")) return;
    const { error } = await supabase.from("manutencoes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const filtered = items.filter(
    (m) => m.computador.toLowerCase().includes(busca.toLowerCase()) || m.problema.toLowerCase().includes(busca.toLowerCase())
  );

  const pendentes = items.filter((m) => m.status === "Pendente").length;
  const emAndamento = items.filter((m) => m.status === "Em andamento").length;
  const concluidas = items.filter((m) => m.status === "Concluída").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Wrench className="h-6 w-6 text-primary" /> Manutenção
          </h1>
          <p className="text-sm text-muted-foreground">Controle as ordens de serviço</p>
        </div>
        {isStaff && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Nova Manutenção</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova manutenção</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-3">
                <div><Label>Computador</Label><Input value={form.computador} onChange={(e) => setForm({ ...form, computador: e.target.value })} required /></div>
                <div><Label>Problema</Label><Input value={form.problema} onChange={(e) => setForm({ ...form, problema: e.target.value })} required /></div>
                <div><Label>Técnico</Label><Input value={form.tecnico} onChange={(e) => setForm({ ...form, tecnico: e.target.value })} required /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                        <SelectItem value="Em andamento">Em andamento</SelectItem>
                        <SelectItem value="Concluída">Concluída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Prioridade</Label>
                    <Select value={form.prioridade} onValueChange={(v) => setForm({ ...form, prioridade: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Alta">Alta</SelectItem>
                        <SelectItem value="Média">Média</SelectItem>
                        <SelectItem value="Baixa">Baixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter><Button type="submit">Salvar</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card text-center"><p className="text-2xl font-bold text-warning">{pendentes}</p><p className="text-xs text-muted-foreground">Pendentes</p></div>
        <div className="stat-card text-center"><p className="text-2xl font-bold text-info">{emAndamento}</p><p className="text-xs text-muted-foreground">Em andamento</p></div>
        <div className="stat-card text-center"><p className="text-2xl font-bold text-success">{concluidas}</p><p className="text-xs text-muted-foreground">Concluídas</p></div>
      </div>

      <div className="stat-card">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar manutenção..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="pb-3 font-medium">Computador</th>
                <th className="pb-3 font-medium">Problema</th>
                <th className="pb-3 font-medium">Técnico</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Prioridade</th>
                <th className="pb-3 font-medium">Data</th>
                <th className="pb-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">Nenhum registro</td></tr>
              ) : filtered.map((m) => (
                <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="py-3 font-medium text-foreground">{m.computador}</td>
                  <td className="py-3 text-muted-foreground">{m.problema}</td>
                  <td className="py-3 text-muted-foreground">{m.tecnico}</td>
                  <td className="py-3"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[m.status] ?? ""}`}>{m.status}</span></td>
                  <td className="py-3"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${prioridadeColors[m.prioridade] ?? ""}`}>{m.prioridade}</span></td>
                  <td className="py-3 text-muted-foreground">{new Date(m.data).toLocaleDateString("pt-BR")}</td>
                  <td className="py-3 text-right">
                    {isStaff && <button onClick={() => handleDelete(m.id)} className="text-muted-foreground hover:text-accent p-1"><Trash2 className="h-4 w-4" /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Manutencao;
