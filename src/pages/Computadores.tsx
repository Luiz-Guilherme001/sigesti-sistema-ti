import { useState } from "react";
import { Search, Plus, Monitor, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { computadores } from "@/data/mockData";

const statusColors: Record<string, string> = {
  Ativo: "bg-success/10 text-success",
  Manutenção: "bg-warning/10 text-warning",
  Inativo: "bg-muted text-muted-foreground",
};

const Computadores = () => {
  const [busca, setBusca] = useState("");
  const filtered = computadores.filter(
    (c) =>
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      c.localizacao.toLowerCase().includes(busca.toLowerCase())
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
        <Button><Plus className="h-4 w-4 mr-2" /> Novo Computador</Button>
      </div>

      <div className="stat-card">
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou localização..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
          </div>
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
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="py-3 font-medium text-foreground">{c.nome}</td>
                  <td className="py-3 text-muted-foreground">{c.patrimonio}</td>
                  <td className="py-3 text-muted-foreground">{c.localizacao}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[c.status]}`}>{c.status}</span>
                  </td>
                  <td className="py-3 text-muted-foreground">{c.ultimaManutencao}</td>
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

export default Computadores;
