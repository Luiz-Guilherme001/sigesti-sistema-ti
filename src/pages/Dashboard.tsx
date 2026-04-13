import { Monitor, Wrench, Package, CheckCircle, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { chartData, manutencoes, pecas } from "@/data/mockData";

const stats = [
  { label: "Total de Computadores", value: "128", sub: "equipamentos", trend: "↑ 4% desde o mês passado", icon: Monitor, color: "text-primary" },
  { label: "Manutenções Pendentes", value: "8", sub: "em aberto", trend: "↑ 2 desde ontem", icon: Wrench, color: "text-warning" },
  { label: "Peças em Falta", value: "5", sub: "itens", trend: "↑ 1 desde ontem", icon: Package, color: "text-accent" },
  { label: "Manutenções Concluídas", value: "12", sub: "este mês", trend: "↑ 20% desde o mês passado", icon: CheckCircle, color: "text-success" },
];

const statusColors: Record<string, string> = {
  "Em andamento": "bg-info/10 text-info",
  "Concluída": "bg-success/10 text-success",
  "Pendente": "bg-warning/10 text-warning",
};

const stockStatusColors: Record<string, string> = {
  "Baixo": "bg-warning/10 text-warning",
  "Crítico": "bg-accent/10 text-accent",
  "Normal": "bg-success/10 text-success",
};

const Dashboard = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bem-vindo, João Silva! 👋</h1>
          <p className="text-muted-foreground text-sm">Aqui está um resumo geral do sistema hoje.</p>
        </div>
        <span className="text-sm text-muted-foreground">📅 23 de abril de 2024</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card flex items-start gap-4">
            <div className={`p-2.5 rounded-lg bg-secondary ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.sub}</p>
              <p className="text-xs text-success flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" /> {stat.trend}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts & Table Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Chart */}
        <div className="lg:col-span-3 stat-card">
          <h3 className="font-semibold text-foreground mb-4">Status das Manutenções (últimos 7 dias)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData.manutencoes7dias}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,88%)" />
              <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="concluidas" name="Concluídas" fill="hsl(142,60%,40%)" radius={[4,4,0,0]} />
              <Bar dataKey="emAndamento" name="Em andamento" fill="hsl(214,65%,50%)" radius={[4,4,0,0]} />
              <Bar dataKey="pendentes" name="Pendentes" fill="hsl(38,92%,50%)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Maintenance */}
        <div className="lg:col-span-2 stat-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Últimas Manutenções</h3>
            <button className="text-xs text-primary font-medium hover:underline">Ver todas →</button>
          </div>
          <div className="space-y-3">
            {manutencoes.slice(0, 5).map((m) => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{m.computador}</p>
                  <p className="text-xs text-muted-foreground">{m.problema}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[m.status]}`}>
                    {m.status}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">{m.data}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low Stock & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 stat-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Peças em Falta <span className="text-xs text-muted-foreground font-normal">(Estoque baixo)</span></h3>
            <button className="text-xs text-primary font-medium hover:underline">Ver todas</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="pb-2 font-medium">Peça</th>
                  <th className="pb-2 font-medium">Código</th>
                  <th className="pb-2 font-medium text-center">Estoque</th>
                  <th className="pb-2 font-medium text-center">Mínimo</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {pecas.filter(p => p.status !== "Normal").map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="py-2.5 font-medium text-foreground">{p.nome}</td>
                    <td className="py-2.5 text-muted-foreground">{p.codigo}</td>
                    <td className="py-2.5 text-center">{p.estoque}</td>
                    <td className="py-2.5 text-center">{p.minimo}</td>
                    <td className="py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stockStatusColors[p.status]}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-2 stat-card">
          <h3 className="font-semibold text-foreground mb-4">Atalhos Rápidos</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Monitor, label: "Novo Computador", desc: "Cadastrar equipamento", color: "text-primary" },
              { icon: Wrench, label: "Nova Manutenção", desc: "Abrir ordem de serviço", color: "text-warning" },
              { icon: Package, label: "Nova Peça", desc: "Cadastrar peça", color: "text-success" },
              { icon: CheckCircle, label: "Gerar Relatório", desc: "Relatórios do sistema", color: "text-info" },
            ].map((action) => (
              <button
                key={action.label}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary transition-colors text-left"
              >
                <div className={`p-2 rounded-lg bg-secondary ${action.color}`}>
                  <action.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
