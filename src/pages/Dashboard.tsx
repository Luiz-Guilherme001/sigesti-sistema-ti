import { useEffect, useState } from "react";
import { Monitor, Wrench, Package, CheckCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const statusColors: Record<string, string> = {
  "Em andamento": "bg-info/10 text-info",
  Concluída: "bg-success/10 text-success",
  Pendente: "bg-warning/10 text-warning",
};
const stockStatusColors: Record<string, string> = {
  Baixo: "bg-warning/10 text-warning",
  Crítico: "bg-accent/10 text-accent",
  Normal: "bg-success/10 text-success",
};

interface Manut { id: string; computador: string; problema: string; data: string; status: string; }
interface Peca { id: string; nome: string; codigo: string; estoque: number; minimo: number; status: string; }

const Dashboard = () => {
  const { user } = useAuth();
  const [nome, setNome] = useState("");
  const [totals, setTotals] = useState({ comp: 0, pend: 0, falta: 0, conc: 0 });
  const [recentes, setRecentes] = useState<Manut[]>([]);
  const [pecasBaixas, setPecasBaixas] = useState<Peca[]>([]);
  const [chart, setChart] = useState<{ dia: string; concluidas: number; emAndamento: number; pendentes: number }[]>([]);

  useEffect(() => {
    if (user) supabase.from("profiles").select("nome").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setNome(data?.nome ?? ""));
  }, [user]);

  useEffect(() => {
    (async () => {
      const [{ count: comp }, { data: manut }, { data: pecas }] = await Promise.all([
        supabase.from("computadores").select("*", { count: "exact", head: true }),
        supabase.from("manutencoes").select("id, computador, problema, data, status").order("data", { ascending: false }),
        supabase.from("pecas").select("*"),
      ]);
      const m = (manut ?? []) as Manut[];
      setRecentes(m.slice(0, 5));
      const p = (pecas ?? []) as Peca[];
      setPecasBaixas(p.filter((x) => x.status !== "Normal"));
      setTotals({
        comp: comp ?? 0,
        pend: m.filter((x) => x.status === "Pendente").length,
        falta: p.filter((x) => x.status !== "Normal").length,
        conc: m.filter((x) => x.status === "Concluída").length,
      });
      // Last 7 days chart
      const days: Record<string, { concluidas: number; emAndamento: number; pendentes: number }> = {};
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today); d.setDate(d.getDate() - i);
        const k = d.toISOString().slice(0, 10);
        days[k] = { concluidas: 0, emAndamento: 0, pendentes: 0 };
      }
      m.forEach((x) => {
        const k = x.data.slice(0, 10);
        if (!days[k]) return;
        if (x.status === "Concluída") days[k].concluidas++;
        else if (x.status === "Em andamento") days[k].emAndamento++;
        else if (x.status === "Pendente") days[k].pendentes++;
      });
      setChart(Object.entries(days).map(([k, v]) => ({
        dia: new Date(k).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        ...v,
      })));
    })();
  }, []);

  const stats = [
    { label: "Computadores", value: totals.comp, icon: Monitor, color: "text-primary" },
    { label: "Pendentes", value: totals.pend, icon: Wrench, color: "text-warning" },
    { label: "Peças em falta", value: totals.falta, icon: Package, color: "text-accent" },
    { label: "Concluídas", value: totals.conc, icon: CheckCircle, color: "text-success" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bem-vindo{nome ? `, ${nome}` : ""}! 👋</h1>
          <p className="text-muted-foreground text-sm">Resumo geral do sistema</p>
        </div>
        <span className="text-sm text-muted-foreground">📅 {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card flex items-start gap-4">
            <div className={`p-2.5 rounded-lg bg-secondary ${stat.color}`}><stat.icon className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 stat-card">
          <h3 className="font-semibold text-foreground mb-4">Manutenções (últimos 7 dias)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,88%)" />
              <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="concluidas" name="Concluídas" fill="hsl(142,60%,40%)" radius={[4,4,0,0]} />
              <Bar dataKey="emAndamento" name="Em andamento" fill="hsl(214,65%,50%)" radius={[4,4,0,0]} />
              <Bar dataKey="pendentes" name="Pendentes" fill="hsl(38,92%,50%)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 stat-card">
          <h3 className="font-semibold text-foreground mb-4">Últimas Manutenções</h3>
          <div className="space-y-3">
            {recentes.length === 0 && <p className="text-sm text-muted-foreground">Sem registros</p>}
            {recentes.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{m.computador}</p>
                  <p className="text-xs text-muted-foreground">{m.problema}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[m.status] ?? ""}`}>{m.status}</span>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(m.data).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="stat-card">
        <h3 className="font-semibold text-foreground mb-4">Peças em falta</h3>
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
              {pecasBaixas.length === 0 && (
                <tr><td colSpan={5} className="py-3 text-muted-foreground">Tudo em ordem ✅</td></tr>
              )}
              {pecasBaixas.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="py-2.5 font-medium text-foreground">{p.nome}</td>
                  <td className="py-2.5 text-muted-foreground">{p.codigo}</td>
                  <td className="py-2.5 text-center">{p.estoque}</td>
                  <td className="py-2.5 text-center">{p.minimo}</td>
                  <td className="py-2.5"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stockStatusColors[p.status] ?? ""}`}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
