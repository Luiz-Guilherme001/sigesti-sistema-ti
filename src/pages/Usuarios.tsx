import { useEffect, useState } from "react";
import { Search, Users as UsersIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

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

const Usuarios = () => {
  const [busca, setBusca] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin");

  const load = async () => {
    setLoading(true);
    const { data: profiles, error } = await supabase.from("profiles").select("user_id, nome, email");
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
    const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (delErr) return toast.error(delErr.message);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
    if (error) return toast.error(error.message);
    toast.success("Papel atualizado");
    load();
  };

  const filtered = rows.filter(
    (u) => u.nome.toLowerCase().includes(busca.toLowerCase()) || u.email.toLowerCase().includes(busca.toLowerCase())
  );
  const admins = rows.filter((u) => u.role === "admin").length;
  const tecnicos = rows.filter((u) => u.role === "tecnico").length;
  const usuariosC = rows.filter((u) => u.role === "usuario").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <UsersIcon className="h-6 w-6 text-primary" /> Usuários
        </h1>
        <p className="text-sm text-muted-foreground">Controle de acesso ao sistema</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card text-center"><p className="text-2xl font-bold text-primary">{rows.length}</p><p className="text-xs text-muted-foreground">Total</p></div>
        <div className="stat-card text-center"><p className="text-2xl font-bold text-info">{admins}</p><p className="text-xs text-muted-foreground">Admins</p></div>
        <div className="stat-card text-center"><p className="text-2xl font-bold text-success">{tecnicos}</p><p className="text-xs text-muted-foreground">Técnicos</p></div>
        <div className="stat-card text-center"><p className="text-2xl font-bold text-muted-foreground">{usuariosC}</p><p className="text-xs text-muted-foreground">Usuários</p></div>
      </div>

      <div className="stat-card">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar usuário..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="pb-3 font-medium">Nome</th>
                <th className="pb-3 font-medium">E-mail</th>
                <th className="pb-3 font-medium">Papel</th>
                {isAdmin && <th className="pb-3 font-medium text-right">Alterar papel</th>}
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
                      <Select value={u.role} onValueChange={(v) => changeRole(u.user_id, v as Row["role"])}>
                        <SelectTrigger className="w-36 ml-auto h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="tecnico">Técnico</SelectItem>
                          <SelectItem value="usuario">Usuário</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Usuarios;
