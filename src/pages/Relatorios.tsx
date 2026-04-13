import { BarChart3, Monitor, Wrench, DollarSign } from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid
} from "recharts";
import { chartData } from "@/data/mockData";

const Relatorios = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" /> Relatórios
        </h1>
        <p className="text-sm text-muted-foreground">Análise detalhada dos dados do sistema</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-secondary text-primary"><Monitor className="h-5 w-5" /></div>
          <div>
            <p className="text-xs text-muted-foreground">Computadores</p>
            <p className="text-2xl font-bold text-foreground">128</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-secondary text-warning"><Wrench className="h-5 w-5" /></div>
          <div>
            <p className="text-xs text-muted-foreground">Manutenções</p>
            <p className="text-2xl font-bold text-foreground">24</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-secondary text-success"><DollarSign className="h-5 w-5" /></div>
          <div>
            <p className="text-xs text-muted-foreground">Custo</p>
            <p className="text-2xl font-bold text-foreground">R$ 8.750</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="stat-card">
          <h3 className="font-semibold text-foreground mb-4">Status das Manutenções</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={chartData.statusPizza}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
                label={({ name, value }) => `${name} ${value}%`}
              >
                {chartData.statusPizza.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="stat-card">
          <h3 className="font-semibold text-foreground mb-4">Manutenções por Mês</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData.manutencoesMensal}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,88%)" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="hsl(214,65%,32%)" strokeWidth={2} dot={{ fill: "hsl(214,65%,32%)", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Relatorios;
