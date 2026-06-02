import { useEffect, useState } from "react";
import { Search, Plus, Building2, Trash2, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Setor {
  id: string;
  nome: string;
  descricao: string | null;
  imagem_url: string | null;
  created_at: string | null;
}

const Setores = () => {
  const [busca, setBusca] = useState("");
  const [items, setItems] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", descricao: "" });
  const [imagemAmpliada, setImagemAmpliada] = useState<{ url: string; nome: string } | null>(null);
  const { isStaff } = useAuth();

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("setores").select("*").order("nome");
    if (error) toast.error(error.message);
    else setItems((data ?? []) as Setor[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) { toast.error("Informe o nome do setor"); return; }

    let error;
    if (editingId) {
      ({ error } = await supabase.from("setores").update({ nome: form.nome, descricao: form.descricao }).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("setores").insert({ nome: form.nome, descricao: form.descricao }));
    }

    if (error) { toast.error(error.message); return; }
    toast.success(editingId ? "Setor atualizado" : "Setor criado");
    setForm({ nome: "", descricao: "" });
    setEditingId(null);
    setOpen(false);
    load();
  };

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Excluir o setor "${nome}"?`)) return;
    const { error } = await supabase.from("setores").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Setor excluído"); load(); }
  };

  const openEdit = (setor: Setor) => {
    setEditingId(setor.id);
    setForm({ nome: setor.nome, descricao: setor.descricao || "" });
    setOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    setForm({ nome: "", descricao: "" });
    setOpen(true);
  };

  const filtered = items.filter((item) =>
    item.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" /> Setores
          </h1>
          <p className="text-sm text-muted-foreground">Gerencie os setores da instituição</p>
        </div>
        {isStaff && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Novo Setor</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Setor" : "Novo Setor"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome *</Label>
                  <Input id="nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Laboratório 01" required />
                </div>
                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Input id="descricao" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: 20 máquinas" />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button type="submit">Salvar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="stat-card">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar setor..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum setor cadastrado.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((setor) => (
              <div key={setor.id} className="border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                {setor.imagem_url ? (
                  <img
                    src={setor.imagem_url}
                    alt={setor.nome}
                    className="w-full h-36 object-cover cursor-zoom-in hover:opacity-90 transition-opacity"
                    onClick={() => setImagemAmpliada({ url: setor.imagem_url!, nome: setor.nome })}
                  />
                ) : (
                  <div className="w-full h-36 bg-muted flex items-center justify-center">
                    <Building2 className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                )}
                <div className="p-4 flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">{setor.nome}</h3>
                    {setor.descricao && <p className="text-sm text-muted-foreground mt-1">{setor.descricao}</p>}
                  </div>
                  {isStaff && (
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(setor)} className="text-muted-foreground hover:text-primary p-1" title="Editar">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(setor.id, setor.nome)} className="text-muted-foreground hover:text-red-500 p-1" title="Excluir">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de imagem ampliada */}
      {imagemAmpliada && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setImagemAmpliada(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setImagemAmpliada(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="h-8 w-8" />
            </button>
            <img
              src={imagemAmpliada.url}
              alt={imagemAmpliada.nome}
              className="w-full rounded-xl object-contain max-h-[80vh]"
            />
            <p className="text-white text-center mt-3 font-semibold text-lg">{imagemAmpliada.nome}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Setores;