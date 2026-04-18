import { useEffect, useState } from "react";
import { Search, Users as UsersIcon, UserPlus, ShieldCheck, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Row {
  user_id: string;
  nome: string;
  email: string;
  role: "admin" | "tecnico" | "usuario";
}

const tipoColors: Record<string, string> = {
  admin: "bg-primary/10 text-primary",
  tecnico: "bg-info/10 text-info",
  usuario: "bg-muted text-muted-foreground",
};
const tipoLabel: Record<string, string> = {
  admin: "Administrador", tecnico: "Técnico", usuario: "Usuário",
};

const genPassword = () => {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let p = "";
  for (let i = 0; i < 12; i++) p += chars[Math.floor(Math.random() * chars.length)];
  return p + "@1";
};

const Usuarios = () => {
  const [busca, setBusca] = useState("");
  const [filtroRole, setFiltroRole] = useState<"todos" | Row["role"]>("todos");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin");

  // Create modal
  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novaSenha, setNovaSenha] = useState(genPassword());
  const [novoPapel, setNovoPapel] = useState<Row["role"]>("usuario");

  // Promote confirmation
  const [promoteTarget, setPromoteTarget] = useState<Row | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: profiles, error } = await supabase
      .from("profiles").select("user_id, nome, email");
    if (error) { toast.error(error.message); setLoading(false); return; }
    const { data: rolesData } = await supabase.from("user_roles").select("user_id, role");
    const roleMap = new Map<string, Row["role"]>();
    rolesData?.forEach((r: any) => {
      const cur = roleMap.get(r.user_id);
      const rank = { admin: 3, tecnico: 2, usuario: 1 } as const;
      if (!cur || rank[r.role as keyof typeof rank] > rank[cur]) roleMap.set(r.user_id, r.role);
    });
    setRows((profiles ?? []).map((p: any) => ({
      user_id: p.user_id, nome: p.nome, email: p.email, role: roleMap.get(p.user_id) ?? "usuario",
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const changeRole = async (userId: string, newRole: Row["role"]) => {
    const target = rows.find((r) => r.user_id === userId);
    const adminCount = rows.filter((r) => r.role === "admin").length;
    if (target?.role === "admin" && newRole !== "admin" && adminCount <= 1) {
      toast.error("Não é possível rebaixar o último administrador. Promova outro usuário a admin antes.");
      return;
    }
    const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (delErr) return toast.error(delErr.message);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
    if (error) return toast.error(error.message);
    toast.success("Papel atualizado");
    load();
  };

  const confirmPromote = async () => {
    if (!promoteTarget) return;
    const t = promoteTarget;
    setPromoteTarget(null);
    await changeRole(t.user_id, "admin");
    toast.success(`✅ ${t.nome} agora é administrador`);
  };

  const handleCreate = async () => {
    if (!novoNome.trim()) return toast.error("Informe o nome");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(novoEmail)) return toast.error("E-mail inválido");
    if (novaSenha.length < 6) return toast.error("Senha deve ter ao menos 6 caracteres");
    setCreating(true);
    const { data, error } = await supabase.functions.invoke("admin-create-user", {
      body: { nome: novoNome.trim(), email: novoEmail.trim().toLowerCase(), password: novaSenha, role: novoPapel },
    });
    setCreating(false);
    if (error || (data as any)?.error) {
      return toast.error((data as any)?.error ?? error?.message ?? "Falha ao criar usuário");
    }
    toast.success(`Usuário criado. Senha temporária: ${novaSenha}`, { duration: 12000 });
    setOpenCreate(false);
    setNovoNome(""); setNovoEmail(""); setNovaSenha(genPassword()); setNovoPapel("usuario");
    load();
  };

  const filtered = rows
    .filter((u) => filtroRole === "todos" || u.role === filtroRole)
    .filter((u) => u.nome.toLowerCase().includes(busca.toLowerCase()) ||
                   u.email.toLowerCase().includes(busca.toLowerCase()));
  const admins = rows.filter((u) => u.role === "admin").length;
  const tecnicos = rows.filter((u) => u.role === "tecnico").length;
  const usuariosC = rows.filter((u) => u.role === "usuario").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <UsersIcon className="h-6 w-6 text-primary" /> Usuários
          </h1>
          <p className="text-sm text-muted-foreground">Controle de acesso ao sistema</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setNovaSenha(genPassword()); setOpenCreate(true); }}>
            <UserPlus className="h-4 w-4" /> Novo usuário
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card text-center"><p className="text-2xl font-bold text-primary">{rows.length}</p><p className="text-xs text-muted-foreground">Total</p></div>
        <div className="stat-card text-center"><p className="text-2xl font-bold text-info">{admins}</p><p className="text-xs text-muted-foreground">Admins</p></div>
        <div className="stat-card text-center"><p className="text-2xl font-bold text-success">{tecnicos}</p><p className="text-xs text-muted-foreground">Técnicos</p></div>
        <div className="stat-card text-center"><p className="text-2xl font-bold text-muted-foreground">{usuariosC}</p><p className="text-xs text-muted-foreground">Usuários</p></div>
      </div>

      <div className="stat-card">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou email..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
          </div>
          <Select value={filtroRole} onValueChange={(v) => setFiltroRole(v as any)}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os papéis</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="tecnico">Técnico</SelectItem>
              <SelectItem value="usuario">Usuário</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="pb-3 font-medium">Nome</th>
                <th className="pb-3 font-medium">E-mail</th>
                <th className="pb-3 font-medium">Papel</th>
                {isAdmin && <th className="pb-3 font-medium text-right">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">Nenhum usuário</td></tr>
              ) : filtered.map((u) => (
                <tr key={u.user_id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                        {u.nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                      <span className="font-medium text-foreground">{u.nome}</span>
                    </div>
                  </td>
                  <td className="py-3 text-muted-foreground">{u.email}</td>
                  <td className="py-3"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${tipoColors[u.role]}`}>{tipoLabel[u.role]}</span></td>
                  {isAdmin && (
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {u.role !== "admin" && (
                          <Button size="sm" variant="outline" onClick={() => setPromoteTarget(u)}>
                            <ShieldCheck className="h-4 w-4" /> Promover a admin
                          </Button>
                        )}
                        <Select value={u.role} onValueChange={(v) => changeRole(u.user_id, v as Row["role"])}>
                          <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="tecnico">Técnico</SelectItem>
                            <SelectItem value="usuario">Usuário</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create user modal */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar novo usuário</DialogTitle>
            <DialogDescription>
              O usuário receberá um e-mail para confirmar a conta antes de poder entrar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="nu-nome">Nome completo</Label>
              <Input id="nu-nome" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="nu-email">E-mail profissional</Label>
              <Input id="nu-email" type="email" value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="nu-senha">Senha temporária</Label>
              <div className="flex gap-2">
                <Input id="nu-senha" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} />
                <Button type="button" variant="outline" size="icon" onClick={() => setNovaSenha(genPassword())} title="Gerar nova">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Anote e envie para o usuário com segurança.</p>
            </div>
            <div>
              <Label>Papel inicial</Label>
              <Select value={novoPapel} onValueChange={(v) => setNovoPapel(v as Row["role"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="usuario">Usuário</SelectItem>
                  <SelectItem value="tecnico">Técnico</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreate(false)} disabled={creating}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Criando..." : "Criar usuário"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Promote confirmation */}
      <AlertDialog open={!!promoteTarget} onOpenChange={(o) => !o && setPromoteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promover a Administrador</AlertDialogTitle>
            <AlertDialogDescription>
              Você está promovendo <strong>{promoteTarget?.nome}</strong> ({promoteTarget?.email}) para Administrador.
              Este usuário terá acesso total ao sistema. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPromote}>Promover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Usuarios;
