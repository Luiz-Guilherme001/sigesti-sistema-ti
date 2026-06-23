import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Wrench,
  Trash2,
  Pencil,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Database } from "@/integrations/supabase/types";

type Manutencao =
  Database["public"]["Tables"]["manutencoes"]["Row"];

type Computador =
  Database["public"]["Tables"]["computadores"]["Row"];

const statusColors: Record<string, string> = {
  Pendente:
    "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",

  "Em andamento":
    "bg-blue-500/10 text-blue-500 border-blue-500/20",

  Concluída:
    "bg-green-500/10 text-green-500 border-green-500/20",
};

const prioridadeColors: Record<string, string> = {
  Alta: "bg-red-500/10 text-red-500",
  Média: "bg-yellow-500/10 text-yellow-500",
  Baixa: "bg-green-500/10 text-green-500",
};

const Manutencao = () => {
  const [busca, setBusca] = useState("");

  const [items, setItems] = useState<Manutencao[]>([]);

  const [computadores, setComputadores] = useState<Computador[]>([]);

  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [tecnicos, setTecnicos] = useState<
    { id: string; nome: string }[]
  >([]);

  const { isStaff } = useAuth();

  const getLocalDateTime = () => {
    const now = new Date();

    const year = now.getFullYear();

    const month = String(
      now.getMonth() + 1
    ).padStart(2, "0");

    const day = String(now.getDate()).padStart(2, "0");

    const hours = String(now.getHours()).padStart(
      2,
      "0"
    );

    const minutes = String(
      now.getMinutes()
    ).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const emptyForm = {
    computador: "",
    problema: "",
    tecnico: "",
    data: getLocalDateTime(),
    status: "Pendente",
    prioridade: "Média",
  };

  const [form, setForm] = useState(emptyForm);

  const loadTecnicos = async () => {
    const { data: rolesData, error } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "tecnico");

    if (error) {
      toast.error("Erro ao buscar técnicos");
      return;
    }

    const userIds = (rolesData || []).map((r) => r.user_id);

    if (userIds.length === 0) {
      setTecnicos([]);
      return;
    }

    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, nome")
      .in("user_id", userIds);

    if (profilesError) {
      toast.error("Erro ao buscar técnicos");
      return;
    }

    const tecnicosFormatados = (profilesData || []).map((p) => ({
      id: p.user_id ?? "",
      nome: p.nome || "Sem nome",
    }));

    setTecnicos(tecnicosFormatados);
  };

  const openNew = () => {
    setEditingId(null);

    setForm({
      computador: "",
      problema: "",
      tecnico: "",
      data: getLocalDateTime(),
      status: "Pendente",
      prioridade: "Média",
    });

    setOpen(true);
  };

  const openEdit = (m: Manutencao) => {
    setEditingId(m.id);

    let formattedDate = getLocalDateTime();

    if (m.data) {
      const date = new Date(m.data);

      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();

        const month = String(
          date.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
          date.getDate()
        ).padStart(2, "0");

        const hours = String(
          date.getHours()
        ).padStart(2, "0");

        const minutes = String(
          date.getMinutes()
        ).padStart(2, "0");

        formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
      }
    }

    setForm({
      computador: m.computador || "",
      problema: m.problema || "",
      tecnico: m.tecnico || "",
      data: formattedDate,
      status: m.status || "Pendente",
      prioridade: m.prioridade || "Média",
    });

    setOpen(true);
  };

  const load = async () => {
    setLoading(true);

    const { data: manuts, error } =
      await supabase
        .from("manutencoes")
        .select("*")
        .order("id", {
          ascending: false,
        });

    if (error) {
      toast.error(error.message);
      setItems([]);
    } else {
      setItems(manuts as Manutencao[]);
    }

    const { data: comps } = await supabase
      .from("computadores")
      .select("id, nome, patrimonio")
      .order("nome");

    if (comps) {
      const uniqueMap = new Map<
        string,
        Computador
      >();

      comps.forEach((comp: Computador) => {
        if (comp.nome && !uniqueMap.has(comp.nome)) {
          uniqueMap.set(comp.nome, comp);
        }
      });

      setComputadores(
        Array.from(uniqueMap.values())
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
    loadTecnicos();
  }, []);

  const handleDelete = async (
    id: string,
    computador: string
  ) => {
    if (
      !confirm(
        `Excluir manutenção do computador "${computador}"?`
      )
    )
      return;

    const { error } = await supabase
      .from("manutencoes")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(
        `🗑️ Manutenção do computador ${computador} excluída`
      );

      load();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.computador) {
      toast.error("❌ Selecione um computador");
      return;
    }

    if (!form.tecnico) {
      toast.error("❌ Selecione um técnico");
      return;
    }

    let submitError;

    if (editingId) {
      ({ error: submitError } = await supabase
        .from("manutencoes")
        .update({
          computador: form.computador,
          problema: form.problema,
          tecnico: form.tecnico,
          data: form.data,
          status: form.status,
          prioridade: form.prioridade,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingId));
    } else {
      ({ error: submitError } = await supabase
        .from("manutencoes")
        .insert({
          computador: form.computador,
          problema: form.problema,
          tecnico: form.tecnico,
          data: form.data,
          status: form.status,
          prioridade: form.prioridade,
          created_at: new Date().toISOString(),
        }));
    }

    if (submitError) {
      toast.error("❌ " + submitError.message);
      return;
    }

    if (form.status === "Concluída" && form.computador) {
      await supabase
        .from("chamados")
        .update({
          status: "resolvido",
          data_encerramento: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("equipamento_nome", form.computador)
        .in("status", ["aberto", "em_andamento"]);
    }

    toast.success(
      editingId
        ? "✅ Manutenção atualizada com sucesso!"
        : "✅ Manutenção criada com sucesso!"
    );

    setForm(emptyForm);
    setEditingId(null);
    setOpen(false);
    load();
  };

  const formatarDataHora = (
    dataStr: string | null
  ) => {
    if (!dataStr) return "—";

    try {
      const date = new Date(dataStr);

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

  const renderStatusBadge = (
    status: string | null
  ) => {
    const statusValue = status || "Pendente";

    const colors =
      statusColors[statusValue] ||
      "bg-gray-500/10 text-gray-500";

    return (
      <span
        className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${colors}`}
      >
        {statusValue === "Pendente" && (
          <AlertCircle className="h-3 w-3" />
        )}

        {statusValue === "Em andamento" && (
          <Clock className="h-3 w-3" />
        )}

        {statusValue === "Concluída" && (
          <CheckCircle className="h-3 w-3" />
        )}

        {statusValue}
      </span>
    );
  };

  const filtered = items.filter(
    (m) =>
      m.computador
        ?.toLowerCase()
        .includes(busca.toLowerCase()) ||
      m.problema
        ?.toLowerCase()
        .includes(busca.toLowerCase())
  );

  const pendentes = items.filter(
    (m) => m.status === "Pendente"
  ).length;

  const emAndamento = items.filter(
    (m) => m.status === "Em andamento"
  ).length;

  const concluidas = items.filter(
    (m) => m.status === "Concluída"
  ).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Wrench className="h-6 w-6 text-primary" />
            Manutenção
          </h1>

          <p className="text-sm text-muted-foreground">
            Controle as ordens de serviço
          </p>
        </div>

        {isStaff && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Manutenção
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingId
                    ? "Editar manutenção"
                    : "Nova manutenção"}
                </DialogTitle>
              </DialogHeader>

              <form
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div>
                  <Label>Computador *</Label>

                  <Select
                    value={form.computador}
                    onValueChange={(v) =>
                      setForm({
                        ...form,
                        computador: v,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um computador" />
                    </SelectTrigger>

                    <SelectContent>
                      {computadores.map((c) => (
                        <SelectItem
                          key={c.id}
                          value={c.nome || ""}
                        >
                          {c.nome}{" "}
                          {c.patrimonio &&
                            `(${c.patrimonio})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Problema *</Label>

                  <Input
                    value={form.problema}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        problema: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <Label>
                    Técnico responsável *
                  </Label>

                  <Select
                    value={form.tecnico}
                    onValueChange={(v) =>
                      setForm({
                        ...form,
                        tecnico: v,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um técnico" />
                    </SelectTrigger>

                    <SelectContent>
                      {tecnicos.map((t) => (
                        <SelectItem
                          key={t.id}
                          value={t.nome}
                        >
                          {t.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>
                    Data e hora da manutenção *
                  </Label>

                  <Input
                    type="datetime-local"
                    value={form.data}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        data: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                        <SelectItem value="Pendente">
                          Pendente
                        </SelectItem>

                        <SelectItem value="Em andamento">
                          Em andamento
                        </SelectItem>

                        <SelectItem value="Concluída">
                          Concluída
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Prioridade</Label>

                    <Select
                      value={form.prioridade}
                      onValueChange={(v) =>
                        setForm({
                          ...form,
                          prioridade: v,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="Alta">
                          Alta
                        </SelectItem>

                        <SelectItem value="Média">
                          Média
                        </SelectItem>

                        <SelectItem value="Baixa">
                          Baixa
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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

      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-yellow-500">
            {pendentes}
          </p>

          <p className="text-xs text-muted-foreground">
            Pendentes
          </p>
        </div>

        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-blue-500">
            {emAndamento}
          </p>

          <p className="text-xs text-muted-foreground">
            Em andamento
          </p>
        </div>

        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-green-500">
            {concluidas}
          </p>

          <p className="text-xs text-muted-foreground">
            Concluídas
          </p>
        </div>
      </div>

      <div className="stat-card">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

          <Input
            placeholder="Buscar por computador ou problema..."
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
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="pb-3 font-medium">
                  Computador
                </th>

                <th className="pb-3 font-medium">
                  Problema
                </th>

                <th className="pb-3 font-medium">
                  Técnico
                </th>

                <th className="pb-3 font-medium">
                  Status
                </th>

                <th className="pb-3 font-medium">
                  Prioridade
                </th>

                <th className="pb-3 font-medium">
                  Data Encerramento
                </th>

                {isStaff && (
                  <th className="pb-3 font-medium text-right">
                    Ações
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-6 text-center text-muted-foreground"
                  >
                    Carregando...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-6 text-center text-muted-foreground"
                  >
                    Nenhuma manutenção registrada
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-border last:border-0 hover:bg-muted/50"
                  >
                    <td className="py-3 font-medium text-foreground">
                      {m.computador}
                    </td>

                    <td className="py-3 text-muted-foreground">
                      {m.problema}
                    </td>

                    <td className="py-3 text-muted-foreground">
                      {m.tecnico}
                    </td>

                    <td className="py-3">
                      {renderStatusBadge(m.status)}
                    </td>

                    <td className="py-3">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full ${
                          prioridadeColors[
                            m.prioridade || "Média"
                          ]
                        }`}
                      >
                        {m.prioridade}
                      </span>
                    </td>

                    <td className="py-3 text-muted-foreground">
                      {m.status === "Concluída"
                        ? formatarDataHora(m.updated_at)
                        : "—"}
                    </td>

                    {isStaff && (
                      <td className="py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openEdit(m)}
                            className="text-muted-foreground hover:text-primary p-1"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(
                                m.id,
                                m.computador || ""
                              )
                            }
                            className="text-muted-foreground hover:text-red-500 p-1"
                            title="Excluir"
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

export default Manutencao;