import { useEffect, useState } from "react";
import { BarChart3, Monitor, Wrench, Package, FileText, Printer, Download } from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from "recharts";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ReportType = "geral" | "usuarios" | "computadores" | "chamados";

// ── Exportação ────────────────────────────────────────────────────────────────
const exportToCSV = (data: Record<string, string>[], headers: string[], keys: string[], filename: string) => {
  const rows = [headers.join(",")];
  for (const row of data) {
    rows.push(keys.map((k) => `"${(row[k] ?? "").replace(/"/g, '""')}"`).join(","));
  }
  const blob = new Blob(["\uFEFF" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, `${filename}.csv`);
};

const exportToXLSX = (data: Record<string, string>[], sheetName: string, filename: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

const exportToPDF = (title: string, headers: string[], rows: string[][], filename: string) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setFontSize(16);
  doc.text(title, 14, 15);
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 25);
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 35,
    theme: "striped",
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
  });
  doc.save(`${filename}.pdf`);
};

const fmtDate = (d: Date) => d.toLocaleDateString("pt-BR");
const fmtTime = (d: Date) => d.toLocaleTimeString("pt-BR");
const fmtDT = (s: string) => { const d = new Date(s); return `${fmtDate(d)} ${fmtTime(d)}`; };
const safe = (v: unknown) => String(v ?? "—");

const Relatorios = () => {
  const [tipo, setTipo] = useState<ReportType>("geral");
  const [tipoSel, setTipoSel] = useState<ReportType>("geral");
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);

  const [counts, setCounts] = useState({ comp: 0, manut: 0, pecas: 0 });
  const [pizza, setPizza] = useState<{ name: string; value: number; fill: string }[]>([]);
  const [linha, setLinha] = useState<{ mes: string; total: number }[]>([]);

  const [usuarios, setUsuarios] = useState<Record<string, string>[]>([]);
  const [computadores, setComputadores] = useState<Record<string, string>[]>([]);
  const [chamados, setChamados] = useState<Record<string, string>[]>([]);

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
      const em    = manuts.filter((x) => x.status === "Em andamento").length;
      const pend  = manuts.filter((x) => x.status === "Pendente").length;
      setPizza([
        { name: "Concluídas",    value: concl, fill: "hsl(142,60%,40%)" },
        { name: "Em andamento",  value: em,    fill: "hsl(214,65%,50%)" },
        { name: "Pendentes",     value: pend,  fill: "hsl(38,92%,50%)"  },
      ]);

      const monthMap: Record<string, number> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthMap[d.toISOString().slice(0, 7)] = 0;
      }
      manuts.forEach((x) => {
        const k = (x.data ?? "").slice(0, 7);
        if (k in monthMap) monthMap[k]++;
      });
      setLinha(Object.entries(monthMap).map(([k, v]) => ({
        mes: new Date(k + "-01").toLocaleDateString("pt-BR", { month: "short" }),
        total: v,
      })));
    })();
  }, []);

  const gerar = async () => {
    setTipo(tipoSel);
    setGeneratedAt(new Date());

    if (tipoSel === "usuarios") {
      const [
        { data: profiles },
        { data: roles },
        { data: setores },
        { data: authUsers },
      ] = await Promise.all([
        supabase.from("profiles").select("id, nome, email, user_id, setor_id"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("setores").select("id, nome"),
        supabase.rpc("get_user_created_at"),
      ]);

      const roleMap = new Map<string, string>();
      (roles ?? []).forEach((r) => {
        const cur  = roleMap.get(r.user_id ?? "");
        const rank = (x: string) => (x === "admin" ? 3 : x === "tecnico" ? 2 : 1);
        if (!cur || rank(r.role ?? "") > rank(cur)) roleMap.set(r.user_id ?? "", r.role ?? "");
      });

      const setorMap = new Map<string, string>();
      (setores ?? []).forEach((s) => setorMap.set(s.id, s.nome));

      const authMap = new Map<string, string>();
      (authUsers ?? []).forEach((u) => {
        if (u.created_at) authMap.set(u.user_id, u.created_at);
      });

      setUsuarios((profiles ?? []).map((p) => ({
        Nome:     safe(p.nome),
        Email:    safe(p.email),
        Perfil:   safe(roleMap.get(p.user_id ?? "") ?? "usuario"),
        Setor:    safe(setorMap.get(p.setor_id ?? "") || "—"),
        Cadastro: authMap.get(p.user_id ?? "") ? fmtDT(authMap.get(p.user_id ?? "")!) : "—",
      })));
    }

    if (tipoSel === "computadores") {
      const [{ data: comps }, { data: manuts }, { data: setores }] = await Promise.all([
        supabase.from("computadores").select("*").order("nome"),
        supabase.from("manutencoes").select("computador, data").order("data", { ascending: false }),
        supabase.from("setores").select("id, nome"),
      ]);

      // Mapa setor_id → nome do setor
      const setorMap = new Map<string, string>();
      (setores ?? []).forEach((s) => setorMap.set(s.id, s.nome));

      // Mapa nome do computador → data da última manutenção
      const manutMap = new Map<string, string>();
      (manuts ?? []).forEach((m) => {
        if (m.computador && !manutMap.has(m.computador)) {
          manutMap.set(m.computador, m.data);
        }
      });

      setComputadores((comps ?? []).map((c) => ({
        Patrimônio:      c.patrimonio     ?? "—",
        Nome:            c.nome           ?? "—",
        Localização:     setorMap.get(c.setor_id ?? "") ?? "—",
        "Nº Série":      c.numero_serie   ?? "—",
        Status:          c.status         ?? "—",
        "Dt. Aquisição": c.data_aquisicao ? fmtDate(new Date(c.data_aquisicao)) : "—",
        "Última Manut.": manutMap.get(c.nome ?? "")
          ? fmtDate(new Date(manutMap.get(c.nome ?? "")!))
          : "—",
      })));
    }

    if (tipoSel === "chamados") {
      const { data } = await supabase.from("chamados").select("*").order("created_at", { ascending: false });
      setChamados((data ?? []).map((c) => ({
        Solicitante:         safe(c.solicitante_nome),
        Título:              safe(c.titulo),
        Tipo:                safe(c.tipo),
        Status:              safe(c.status),
        Prioridade:          safe(c.prioridade),
        Setor:               safe(c.setor_nome),
        Equipamento:         safe(c.equipamento_nome),
        "Data Abertura":     c.created_at ? fmtDT(c.created_at) : "—",
        "Data Encerramento": c.data_encerramento ? fmtDT(c.data_encerramento) : "—",
      })));
    }
  };

  const getExportData = () => {
    if (tipo === "usuarios")     return { data: usuarios,     nome: "relatorio_usuarios" };
    if (tipo === "computadores") return { data: computadores, nome: "relatorio_computadores" };
    if (tipo === "chamados")     return { data: chamados,     nome: "relatorio_chamados" };
    return { data: [], nome: "relatorio" };
  };

  const handleExportCSV = () => {
    const { data, nome } = getExportData();
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    exportToCSV(data, headers, headers, nome);
  };

  const handleExportXLSX = () => {
    const { data, nome } = getExportData();
    if (!data.length) return;
    exportToXLSX(data, "Relatório", nome);
  };

  const handleExportPDF = () => {
    const { data, nome } = getExportData();
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const rows    = data.map((row) => headers.map((h) => row[h] ?? ""));
    const titles: Record<string, string> = {
      usuarios:     "Relatório de Usuários",
      computadores: "Relatório de Equipamentos",
      chamados:     "Relatório de Chamados",
    };
    exportToPDF(titles[tipo] ?? "Relatório", headers, rows, nome);
  };

  const hasData = tipo !== "geral" && generatedAt !== null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="print:hidden">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" /> Relatórios
        </h1>
        <p className="text-sm text-muted-foreground">Análise dos dados do sistema</p>
      </div>

      <div className="stat-card flex flex-wrap items-end gap-3 print:hidden">
        <div className="flex-1 min-w-[200px]">
          <Label>Tipo de Relatório</Label>
          <Select value={tipoSel} onValueChange={(v) => setTipoSel(v as ReportType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="geral">Geral (Dashboard)</SelectItem>
              <SelectItem value="usuarios">Usuários</SelectItem>
              <SelectItem value="computadores">Equipamentos</SelectItem>
              <SelectItem value="chamados">Chamados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={gerar} className="gap-2">
          <FileText className="h-4 w-4" /> Gerar
        </Button>

        {hasData && (
          <>
            <Button variant="outline" onClick={() => window.print()} className="gap-2">
              <Printer className="h-4 w-4" /> Imprimir
            </Button>
            <Button variant="outline" onClick={handleExportCSV} className="gap-2">
              <Download className="h-4 w-4" /> CSV
            </Button>
            <Button variant="outline" onClick={handleExportXLSX} className="gap-2">
              <Download className="h-4 w-4" /> XLSX
            </Button>
            <Button variant="outline" onClick={handleExportPDF} className="gap-2">
              <Download className="h-4 w-4" /> PDF
            </Button>
          </>
        )}
      </div>

      {/* GERAL */}
      {tipo === "geral" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="stat-card flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-secondary text-primary"><Monitor className="h-5 w-5" /></div>
              <div><p className="text-xs text-muted-foreground">Computadores</p><p className="text-2xl font-bold">{counts.comp}</p></div>
            </div>
            <div className="stat-card flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-secondary text-warning"><Wrench className="h-5 w-5" /></div>
              <div><p className="text-xs text-muted-foreground">Manutenções</p><p className="text-2xl font-bold">{counts.manut}</p></div>
            </div>
            <div className="stat-card flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-secondary text-success"><Package className="h-5 w-5" /></div>
              <div><p className="text-xs text-muted-foreground">Peças</p><p className="text-2xl font-bold">{counts.pecas}</p></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="stat-card">
              <h3 className="font-semibold mb-4">Status das Manutenções</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pizza} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value"
                    label={({ name, value }) => `${name} ${value}`}>
                    {pizza.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="stat-card">
              <h3 className="font-semibold mb-4">Manutenções por Mês</h3>
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
        </>
      )}

      {/* USUÁRIOS */}
      {tipo === "usuarios" && generatedAt && (
        <div className="bg-card border rounded-lg p-6 print:border-0 print:p-0">
          <div className="text-center mb-4"><h2 className="text-xl font-bold">Relatório de Usuários</h2></div>
          <div className="flex justify-between text-sm mb-3">
            <span><strong>Total:</strong> {usuarios.length}</span>
            <span><strong>Gerado em:</strong> {fmtDate(generatedAt)} {fmtTime(generatedAt)}</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Cadastro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((u, i) => (
                <TableRow key={i}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{u["Nome"]}</TableCell>
                  <TableCell>{u["Email"]}</TableCell>
                  <TableCell className="capitalize">{u["Perfil"]}</TableCell>
                  <TableCell>{u["Setor"]}</TableCell>
                  <TableCell>{u["Cadastro"]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* COMPUTADORES */}
      {tipo === "computadores" && generatedAt && (
        <div className="bg-card border rounded-lg p-6 print:border-0 print:p-0">
          <div className="text-center mb-4"><h2 className="text-xl font-bold">Relatório de Equipamentos</h2></div>
          <div className="flex justify-between text-sm mb-3">
            <span><strong>Total:</strong> {computadores.length}</span>
            <span><strong>Gerado em:</strong> {fmtDate(generatedAt)} {fmtTime(generatedAt)}</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patrimônio</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Nº Série</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dt. Aquisição</TableHead>
                <TableHead>Última Manut.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {computadores.map((c, i) => (
                <TableRow key={i}>
                  <TableCell>{c["Patrimônio"]}</TableCell>
                  <TableCell>{c["Nome"]}</TableCell>
                  <TableCell>{c["Localização"]}</TableCell>
                  <TableCell>{c["Nº Série"]}</TableCell>
                  <TableCell>{c["Status"]}</TableCell>
                  <TableCell>{c["Dt. Aquisição"]}</TableCell>
                  <TableCell>{c["Última Manut."]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* CHAMADOS */}
      {tipo === "chamados" && generatedAt && (
        <div className="bg-card border rounded-lg p-6 print:border-0 print:p-0">
          <div className="text-center mb-4"><h2 className="text-xl font-bold">Relatório de Chamados</h2></div>
          <div className="flex justify-between text-sm mb-3">
            <span><strong>Total:</strong> {chamados.length}</span>
            <span><strong>Gerado em:</strong> {fmtDate(generatedAt)} {fmtTime(generatedAt)}</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Solicitante</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Equipamento</TableHead>
                <TableHead>Data Abertura</TableHead>
                <TableHead>Data Encerramento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chamados.map((c, i) => (
                <TableRow key={i}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{c["Solicitante"]}</TableCell>
                  <TableCell>{c["Título"]}</TableCell>
                  <TableCell>{c["Tipo"]}</TableCell>
                  <TableCell>{c["Status"]}</TableCell>
                  <TableCell>{c["Prioridade"]}</TableCell>
                  <TableCell>{c["Setor"]}</TableCell>
                  <TableCell>{c["Equipamento"]}</TableCell>
                  <TableCell>{c["Data Abertura"]}</TableCell>
                  <TableCell>{c["Data Encerramento"]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default Relatorios;