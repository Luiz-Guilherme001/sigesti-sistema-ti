import { useEffect, useState } from "react";
import { Search, Plus, Monitor, Trash2, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Computador {
  id: string;
  nome: string;
  patrimonio: string | null;
  setor_id: string | null;
  status: string | null;
  numero_serie: string | null;
  data_aquisicao: string | null;
  ultima_manutencao?: string | null;
  created_at?: string | null;

  setores?: {
    id: string;
    nome: string;
  };
}

interface Setor {
  id: string;
  nome: string;
}

const statusColors: Record<string, string> = {
  Ativo: "bg-green-500/10 text-green-500",
  Manutenção: "bg-yellow-500/10 text-yellow-500",
  Inativo: "bg-gray-500/10 text-gray-500",
};

const emptyForm = {
  nome: "",
  patrimonio: "",
  setor_id: "",
  status: "Ativo",
  numero_serie: "",
  data_aquisicao: "",
};

const Computadores = () => {
  const { isStaff } = useAuth();

  const [busca, setBusca] = useState("");
  const [items, setItems] = useState<Computador[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState(emptyForm);

  const loadSetores = async () => {
    const { data } = await supabase
      .from("setores")
      .select("id, nome")
      .order("nome");

    setSetores((data as Setor[]) || []);
  };

  const load = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("computadores")
      .select("*, setores (id, nome)")
      .order("nome", { ascending: true });

    if (error) {
      toast.error(error.message);
      setItems([]);
      setLoading(false);
      return;
    }

    const computadores = await Promise.all(
      ((data as Computador[]) || []).map(async (comp) => {
        const { data: manut } = await supabase
          .from("manutencoes")
          .select("data")
          .eq("computador", comp.nome)
          .order("data", { ascending: false })
          .limit(1);

        return {
          ...comp,
          ultima_manutencao: manut?.[0]?.data || null,
        };
      })
    );

    const computadoresOrdenados = computadores.sort((a, b) =>
    a.nome.localeCompare(b.nome, undefined, { numeric: true, sensitivity: "base" })
    );

    setItems(computadoresOrdenados);
    setLoading(false);
  };

  useEffect(() => {
    load();
    loadSetores();
  }, []);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (c: Computador) => {
    setEditingId(c.id);
    setForm({
      nome: c.nome || "",
      patrimonio: c.patrimonio || "",
      setor_id: c.setor_id || "",
      status: c.status || "Ativo",
      numero_serie: c.numero_serie || "",
      data_aquisicao: c.data_aquisicao || "",
    });

    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nome) {
      toast.error("Informe o nome");
      return;
    }

    let error;

    if (editingId) {
      ({ error } = await supabase
        .from("computadores")
        .update({
          nome: form.nome,
          patrimonio: form.patrimonio || null,
          setor_id: form.setor_id || null,
          status: form.status,
          numero_serie: form.numero_serie || null,
          data_aquisicao: form.data_aquisicao || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingId));
    } else {
      ({ error } = await supabase
        .from("computadores")
        .insert({
          nome: form.nome,
          patrimonio: form.patrimonio || null,
          setor_id: form.setor_id || null,
          status: form.status,
          numero_serie: form.numero_serie || null,
          data_aquisicao: form.data_aquisicao || null,
          created_at: new Date().toISOString(),
        }));
    }

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(
      editingId
        ? "Computador atualizado!"
        : "Computador cadastrado!"
    );

    setOpen(false);
    setEditingId(null);
    setForm(emptyForm);

    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir computador?")) return;

    const { error } = await supabase
      .from("computadores")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Computador removido!");
    load();
  };

  const formatarData = (data: string | null | undefined) => {
    if (!data) return "—";

    return new Date(data).toLocaleDateString("pt-BR");
  };

  const filtered = items.filter((c) => {
  const termo = busca.toLowerCase();
  const setor = setores.find((s) => s.id === c.setor_id);
  
  return (
    c.nome?.toLowerCase().includes(termo) ||
    c.patrimonio?.toLowerCase().includes(termo) ||
    c.numero_serie?.toLowerCase().includes(termo) ||
    c.localizacao?.toLowerCase().includes(termo) ||
    c.status?.toLowerCase().includes(termo) ||
    setor?.nome?.toLowerCase().includes(termo)
  );
});

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Monitor className="h-6 w-6 text-primary" />
            Computadores
          </h1>

          <p className="text-sm text-muted-foreground">
            Gerencie os equipamentos
          </p>
        </div>

        {isStaff && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}>
                <Plus className="h-4 w-4 mr-2" />
                Novo
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingId
                    ? "Editar computador"
                    : "Novo computador"}
                </DialogTitle>
              </DialogHeader>

              <form
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div>
                  <Label>Nome</Label>

                  <Input
                    value={form.nome}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        nome: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Patrimônio</Label>

                  <Input
                    value={form.patrimonio}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        patrimonio: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Número de Série</Label>

                  <Input
                    value={form.numero_serie}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        numero_serie: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Localização</Label>

                  <Select
                    value={form.setor_id}
                    onValueChange={(v) =>
                      setForm({
                        ...form,
                        setor_id: v,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Setor" />
                    </SelectTrigger>

                    <SelectContent>
                      {setores.map((s) => (
                        <SelectItem
                          key={s.id}
                          value={s.id}
                        >
                          {s.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Status</Label>

                  <Select
                    value={form.status}
                    onValueChange={(v) =>
                      setForm({
                        ...form,
                        status: v,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="Ativo">
                        Ativo
                      </SelectItem>

                      <SelectItem value="Manutenção">
                        Manutenção
                      </SelectItem>

                      <SelectItem value="Inativo">
                        Inativo
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Data de Aquisição</Label>

                  <Input
                    type="date"
                    value={form.data_aquisicao}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        data_aquisicao: e.target.value,
                      })
                    }
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancelar
                  </Button>

                  <Button type="submit">
                    Salvar
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="stat-card">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

          <Input
            placeholder="Buscar..."
            value={busca}
            onChange={(e) =>
              setBusca(e.target.value)
            }
            className="pl-10"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="pb-3">Nome</th>
                <th className="pb-3">Patrimônio</th>
                <th className="pb-3">Nº Série</th>
                <th className="pb-3">Localização</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Aquisição</th>
                <th className="pb-3">Última Manut.</th>

                {isStaff && (
                  <th className="pb-3 text-right">
                    Ações
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-6 text-center"
                  >
                    Carregando...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-6 text-center"
                  >
                    Nenhum registro
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-border hover:bg-muted/50"
                  >
                    <td className="py-3 font-medium">
                      {c.nome}
                    </td>

                    <td className="py-3">
                      {c.patrimonio || "—"}
                    </td>

                    <td className="py-3">
                      {c.numero_serie || "—"}
                    </td>

                    <td className="py-3">
                      {
  setores.find((s) => s.id === c.setor_id)?.nome || "—"
}
                    </td>

                    <td className="py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          statusColors[
                            c.status || "Ativo"
                          ]
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>

                    <td className="py-3">
                      {formatarData(
                        c.data_aquisicao
                      )}
                    </td>

                    <td className="py-3">
                      {formatarData(
                        c.ultima_manutencao
                      )}
                    </td>

                    {isStaff && (
                      <td className="py-3 text-right">
                        <div className="inline-flex gap-1">
                          <button
                            onClick={() =>
                              openEdit(c)
                            }
                            className="p-1 hover:text-primary"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(c.id)
                            }
                            className="p-1 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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

export default Computadores;