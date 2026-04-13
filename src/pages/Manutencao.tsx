import { useState } from "react";
import { Search, Plus, Wrench, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { manutencoes } from "@/data/mockData";

const statusColors: Record<string, string> = {
  "Pendente": "bg-warning/10 text-warning",
  "Em andamento": "bg-info/10 text-info",
  "Concluída": "bg-success/10 text-success",
};

const prioridadeColors: Record<string, string> = {
  Alta: "bg-accent/10 text-accent",
  Média: "bg-warning/10 text-warning",
  Baixa: "bg-success/10 text-success",
};

const Manutencao = () => {
  const [busca, setBusca] = useState("");
  const filtered = manutencoes.filter(
    (m) =>
      m.computador.toLowerCase().includes(busca.toLowerCase()) ||
      m.problema.toLowerCase().includes(busca.toLowerCase())
  );

  const pendentes = manutencoes.filter((m) => m.status === "Pendente").length;
  const emAndamento = manutencoes.filter((m) => m.status === "Em andamento").length;
  const concluidas = manutencoes.filter((m) => m.status === "Concluída").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Wrench className="h-6 w-6 text-primary" /> Manutenção
          </h1>
          <p className="text-sm text-muted-foreground">Controle as ordens de serviço</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" /> Nova Manutenção</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-warning">{pendentes}</p>
          <p className="text-xs text-muted-foreground">Pendentes</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-info">{emAndamento}</p>
          <p className="text-xs text-muted-foreground">Em andamento</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-success">{concluidas}</p>
          <p className="text-xs text-muted-foreground">Concluídas</p>
        </div>
      </div>

      <div className="stat-card">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar manutenção..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="pb-3 font-medium">Computador</th>
                <th className="pb-3 font-medium">Problema</th>
                <th className="pb-3 font-medium">Técnico</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Prioridade</th>
                <th className="pb-3 font-medium">Data</th>
                <th className="pb-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="py-3 font-medium text-foreground">{m.computador}</td>
                  <td className="py-3 text-muted-foreground">{m.problema}</td>
                  <td className="py-3 text-muted-foreground">{m.tecnico}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[m.status]}`}>{m.status}</span>
                  </td>
                  <td className="py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${prioridadeColors[m.prioridade]}`}>{m.prioridade}</span>
                  </td>
                  <td className="py-3 text-muted-foreground">{m.data}</td>
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

export default Manutencao;
