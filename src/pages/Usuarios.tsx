import { useState } from "react";
import { Search, Plus, Users as UsersIcon, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usuarios } from "@/data/mockData";

const tipoColors: Record<string, string> = {
  Administrador: "bg-primary/10 text-primary",
  Técnico: "bg-info/10 text-info",
  Usuário: "bg-muted text-muted-foreground",
};

const Usuarios = () => {
  const [busca, setBusca] = useState("");
  const filtered = usuarios.filter(
    (u) =>
      u.nome.toLowerCase().includes(busca.toLowerCase()) ||
      u.email.toLowerCase().includes(busca.toLowerCase())
  );

  const admins = usuarios.filter((u) => u.tipo === "Administrador").length;
  const tecnicos = usuarios.filter((u) => u.tipo === "Técnico").length;
  const inativos = usuarios.filter((u) => u.status === "Inativo").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <UsersIcon className="h-6 w-6 text-primary" /> Usuários
          </h1>
          <p className="text-sm text-muted-foreground">Controle de acesso ao sistema</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" /> Novo Usuário</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-primary">{usuarios.length}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-info">{admins}</p>
          <p className="text-xs text-muted-foreground">Admins</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-success">{tecnicos}</p>
          <p className="text-xs text-muted-foreground">Técnicos</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-muted-foreground">{inativos}</p>
          <p className="text-xs text-muted-foreground">Inativos</p>
        </div>
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
                <th className="pb-3 font-medium">Tipo</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                        {u.nome.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <span className="font-medium text-foreground">{u.nome}</span>
                    </div>
                  </td>
                  <td className="py-3 text-muted-foreground">{u.email}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${tipoColors[u.tipo]}`}>{u.tipo}</span>
                  </td>
                  <td className="py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${u.status === "Ativo" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button className="text-muted-foreground hover:text-primary p-1"><Edit className="h-4 w-4" /></button>
                    <button className="text-muted-foreground hover:text-accent p-1 ml-1"><Trash2 className="h-4 w-4" /></button>
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

export default Usuarios;
