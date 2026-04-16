import { useEffect, useState } from "react";
import { Search, Plus, Package, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Peca {
  id: string;
  nome: string;
  codigo: string;
  estoque: number;
  minimo: number;
  status: string;
}

const statusColors: Record<string, string> = {
  Normal: "bg-success/10 text-success",
  Baixo: "bg-warning/10 text-warning",
  Crítico: "bg-accent/10 text-accent",
};

const computeStatus = (estoque: number, minimo: number) => {
  if (estoque === 0) return "Crítico";
  if (estoque < minimo) return "Baixo";
  return "Normal";
};

const Pecas = () => {
  const [busca, setBusca] = useState("");
  const [items, setItems] = useState<Peca[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", codigo: "", estoque: 0, minimo: 0 });
  const { isStaff } = useAuth();

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("pecas").select("*").order("nome");
    if (error) toast.error(error.message);
    setItems((data ?? []) as Peca[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const status = computeStatus(form.estoque, form.minimo);
    const { error } = await supabase.from("pecas").insert({ ...form, status });
    if (error) return toast.error(error.message);
    toast.success("Peça cadastrada");
    setForm({ nome: "", codigo: "", estoque: 0, minimo: 0 });
    setOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir?")) return;
    const { error } = await supabase.from("pecas").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const filtered = items.filter(
    (p) => p.nome.toLowerCase().includes(busca.toLowerCase()) || p.codigo.toLowerCase().includes(busca.toLowerCase())
  );
  const total = items.reduce((acc, p) => acc + p.estoque, 0);
  const baixo = items.filter((p) => p.status !== "Normal").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" /> Peças (Estoque)
          </h1>
          <p className="text-sm text-muted-foreground">Controle de componentes e peças</p>
        </div>
        {isStaff && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Nova Peça</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova peça</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-3">
                <div><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required /></div>
                <div><Label>Código</Label><Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} required /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Estoque</Label><Input type="number" min={0} value={form.estoque} onChange={(e) => setForm({ ...form, estoque: +e.target.value })} required /></div>
                  <div><Label>Mínimo</Label><Input type="number" min={0} value={form.minimo} onChange={(e) => setForm({ ...form, minimo: +e.target.value })} required /></div>
                </div>
                <DialogFooter><Button type="submit">Salvar</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card text-center"><p className="text-2xl font-bold text-primary">{total}</p><p className="text-xs text-muted-foreground">Total em estoque</p></div>
        <div className="stat-card text-center"><p className="text-2xl font-bold text-warning">{baixo}</p><p className="text-xs text-muted-foreground">Estoque baixo</p></div>
        <div className="stat-card text-center"><p className="text-2xl font-bold text-info">{items.length}</p><p className="text-xs text-muted-foreground">Itens cadastrados</p></div>
      </div>

      <div className="stat-card">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar peça..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="pb-3 font-medium">Peça</th>
                <th className="pb-3 font-medium">Código</th>
                <th className="pb-3 font-medium text-center">Estoque</th>
                <th className="pb-3 font-medium text-center">Mínimo</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">Nenhum registro</td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="py-3 font-medium text-foreground">{p.nome}</td>
                  <td className="py-3 text-muted-foreground">{p.codigo}</td>
                  <td className="py-3 text-center">{p.estoque}</td>
                  <td className="py-3 text-center">{p.minimo}</td>
                  <td className="py-3"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[p.status] ?? ""}`}>{p.status}</span></td>
                  <td className="py-3 text-right">
                    {isStaff && <button onClick={() => handleDelete(p.id)} className="text-muted-foreground hover:text-accent p-1"><Trash2 className="h-4 w-4" /></button>}
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

export default Pecas;
