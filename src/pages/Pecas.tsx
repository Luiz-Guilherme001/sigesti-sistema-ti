import { useState } from "react";
import { Search, Plus, Package, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pecas } from "@/data/mockData";

const statusColors: Record<string, string> = {
  Normal: "bg-success/10 text-success",
  Baixo: "bg-warning/10 text-warning",
  Crítico: "bg-accent/10 text-accent",
};

const Pecas = () => {
  const [busca, setBusca] = useState("");
  const filtered = pecas.filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.codigo.toLowerCase().includes(busca.toLowerCase())
  );

  const total = pecas.reduce((acc, p) => acc + p.estoque, 0);
  const baixo = pecas.filter((p) => p.status === "Baixo" || p.status === "Crítico").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" /> Peças (Estoque)
          </h1>
          <p className="text-sm text-muted-foreground">Controle de componentes e peças</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" /> Nova Peça</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-primary">{total}</p>
          <p className="text-xs text-muted-foreground">Total em estoque</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-warning">{baixo}</p>
          <p className="text-xs text-muted-foreground">Estoque baixo</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-info">23</p>
          <p className="text-xs text-muted-foreground">Em uso</p>
        </div>
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
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="py-3 font-medium text-foreground">{p.nome}</td>
                  <td className="py-3 text-muted-foreground">{p.codigo}</td>
                  <td className="py-3 text-center">{p.estoque}</td>
                  <td className="py-3 text-center">{p.minimo}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[p.status]}`}>{p.status}</span>
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

export default Pecas;
