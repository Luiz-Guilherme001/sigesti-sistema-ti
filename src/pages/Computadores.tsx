import { useEffect, useState } from "react";
import { Search, Plus, Monitor, Trash2 } from "lucide-react";
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

interface Computador {
  id: string;
  nome: string;
  patrimonio: string;
  localizacao: string;
  status: string;
  ultima_manutencao: string | null;
}

const statusColors: Record<string, string> = {
  Ativo: "bg-success/10 text-success",
  Manutenção: "bg-warning/10 text-warning",
  Inativo: "bg-muted text-muted-foreground",
};

const Computadores = () => {
  const [busca, setBusca] = useState("");
  const [items, setItems] = useState<Computador[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", patrimonio: "", localizacao: "", status: "Ativo" });
  const { isStaff } = useAuth();

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("computadores").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data ?? []) as Computador[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("computadores").insert(form);
    if (error) return toast.error(error.message);
    toast.success("Computador cadastrado");
    setForm({ nome: "", patrimonio: "", localizacao: "", status: "Ativo" });
    setOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este computador?")) return;
    const { error } = await supabase.from("computadores").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removido");
    load();
  };

  const filtered = items.filter(
    (c) => c.nome.toLowerCase().includes(busca.toLowerCase()) || c.localizacao.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Monitor className="h-6 w-6 text-primary" /> Computadores
          </h1>
          <p className="text-sm text-muted-foreground">Gerencie os equipamentos da instituição</p>
        </div>
        {isStaff && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Novo Computador</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo computador</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-3">
                <div><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required /></div>
                <div><Label>Patrimônio</Label><Input value={form.patrimonio} onChange={(e) => setForm({ ...form, patrimonio: e.target.value })} required /></div>
                <div><Label>Localização</Label><Input value={form.localizacao} onChange={(e) => setForm({ ...form, localizacao: e.target.value })} required /></div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Manutenção">Manutenção</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter><Button type="submit">Salvar</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="stat-card">
        <div className="relative flex-1 mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou localização..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="pb-3 font-medium">Nome</th>
                <th className="pb-3 font-medium">Patrimônio</th>
                <th className="pb-3 font-medium">Localização</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Última Manutenção</th>
                <th className="pb-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">Nenhum registro</td></tr>
              ) : filtered.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="py-3 font-medium text-foreground">{c.nome}</td>
                  <td className="py-3 text-muted-foreground">{c.patrimonio}</td>
                  <td className="py-3 text-muted-foreground">{c.localizacao}</td>
                  <td className="py-3"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[c.status] ?? ""}`}>{c.status}</span></td>
                  <td className="py-3 text-muted-foreground">{c.ultima_manutencao ? new Date(c.ultima_manutencao).toLocaleDateString("pt-BR") : "—"}</td>
                  <td className="py-3 text-right">
                    {isStaff && (
                      <button onClick={() => handleDelete(c.id)} className="text-muted-foreground hover:text-accent p-1"><Trash2 className="h-4 w-4" /></button>
                    )}
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

export default Computadores;
