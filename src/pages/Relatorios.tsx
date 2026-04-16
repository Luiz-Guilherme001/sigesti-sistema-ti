import { useEffect, useState } from "react";
import { BarChart3, Monitor, Wrench, Package } from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

const Relatorios = () => {
  const [counts, setCounts] = useState({ comp: 0, manut: 0, pecas: 0 });
  const [pizza, setPizza] = useState<{ name: string; value: number; fill: string }[]>([]);
  const [linha, setLinha] = useState<{ mes: string; total: number }[]>([]);

  useEffect(() => {
    (async () => {
      const [{ count: comp }, { count: pecasC }, { data: m }] = await Promise.all([
        supabase.from("computadores").select("*", { count: "exact", head: true }),
        supabase.from("pecas").select("*", { count: "exact", head: true }),
        supabase.from("manutencoes").select("status, data"),
      ]);
      const manuts = m ?? [];
      setCounts({ comp: comp ?? 0, manut: manuts.length, pecas: pecasC ?? 0 });

      const concl = manuts.filter((x) => x.status === "Concluída").length;
      const em = manuts.filter((x) => x.status === "Em andamento").length;
      const pend = manuts.filter((x) => x.status === "Pendente").length;
      setPizza([
        { name: "Concluídas", value: concl, fill: "hsl(142,60%,40%)" },
        { name: "Em andamento", value: em, fill: "hsl(214,65%,50%)" },
        { name: "Pendentes", value: pend, fill: "hsl(38,92%,50%)" },
      ]);

      const monthMap: Record<string, number> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthMap[d.toISOString().slice(0, 7)] = 0;
      }
      manuts.forEach((x) => {
        const k = x.data.slice(0, 7);
        if (k in monthMap) monthMap[k]++;
      });
      setLinha(Object.entries(monthMap).map(([k, v]) => ({
        mes: new Date(k + "-01").toLocaleDateString("pt-BR", { month: "short" }),
        total: v,
      })));
    })();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" /> Relatórios
        </h1>
        <p className="text-sm text-muted-foreground">Análise dos dados do sistema</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-secondary text-primary"><Monitor className="h-5 w-5" /></div>
          <div><p className="text-xs text-muted-foreground">Computadores</p><p className="text-2xl font-bold text-foreground">{counts.comp}</p></div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-secondary text-warning"><Wrench className="h-5 w-5" /></div>
          <div><p className="text-xs text-muted-foreground">Manutenções</p><p className="text-2xl font-bold text-foreground">{counts.manut}</p></div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-secondary text-success"><Package className="h-5 w-5" /></div>
          <div><p className="text-xs text-muted-foreground">Peças</p><p className="text-2xl font-bold text-foreground">{counts.pecas}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="stat-card">
          <h3 className="font-semibold text-foreground mb-4">Status das Manutenções</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pizza} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value"
                label={({ name, value }) => `${name} ${value}`}>
                {pizza.map((entry, index) => (<Cell key={index} fill={entry.fill} />))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="stat-card">
          <h3 className="font-semibold text-foreground mb-4">Manutenções por Mês</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={linha}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,88%)" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
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
