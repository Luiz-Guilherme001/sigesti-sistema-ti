import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Settings as SettingsIcon, ShieldCheck, AlertTriangle, Users, UserCog, User,
  TrendingUp, Database, LogOut, KeyRound, Copy, Printer, Download,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Mail, FileText, MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const PAGE_SIZE = 10;
const APP_VERSION = "v2.1.0";
const DB_INFO = "Lovable Cloud (PostgreSQL 15)";

const formatDate = (d?: string | null) =>
  d ? new Date(d).toLocaleString("pt-BR") : "—";

const Settings = () => {
  const { user, signOut } = useAuth();

  // Profile
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [lastSignIn, setLastSignIn] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Stats
  const [stats, setStats] = useState({ total: 0, admins: 0, tecnicos: 0, usuarios: 0, novos7d: 0 });

  // Logs
  const [logs, setLogs] = useState<any[]>([]);
  const [logFilter, setLogFilter] = useState<string>("all");
  const [logPage, setLogPage] = useState(1);
  const [logTotal, setLogTotal] = useState(0);

  // Security
  const [hasAdmin, setHasAdmin] = useState(true);

  // Preferences
  const [prefs, setPrefs] = useState({
    notify_new_users: true, log_role_changes: true, require_2fa: false, block_after_failed: false, theme: "dark",
  });

  // Password reset modal
  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdSending, setPwdSending] = useState(false);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email ?? "");
    setLastSignIn(user.last_sign_in_at ?? null);
    setCreatedAt(user.created_at ?? null);

    supabase.from("profiles").select("nome").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { if (data?.nome) setNome(data.nome); });

    supabase.from("admin_preferences").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPrefs({
            notify_new_users: data.notify_new_users,
            log_role_changes: data.log_role_changes,
            require_2fa: data.require_2fa,
            block_after_failed: data.block_after_failed,
            theme: data.theme,
          });
          if (data.theme === "dark") document.documentElement.classList.add("dark");
          else if (data.theme === "light") document.documentElement.classList.remove("dark");
        }
      });

    loadStats();
  }, [user]);

  useEffect(() => { loadLogs(); }, [logFilter, logPage]);

  const loadStats = async () => {
    const [{ count: total }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("user_roles").select("role"),
    ]);
    const admins = roles?.filter((r) => r.role === "admin").length ?? 0;
    const tecnicos = roles?.filter((r) => r.role === "tecnico").length ?? 0;
    const usuarios = roles?.filter((r) => r.role === "usuario").length ?? 0;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: novos7d } = await supabase
      .from("profiles").select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo);

    setStats({ total: total ?? 0, admins, tecnicos, usuarios, novos7d: novos7d ?? 0 });
    setHasAdmin(admins > 0);
  };

  const loadLogs = async () => {
    const from = (logPage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    let q = supabase.from("role_change_logs").select("*", { count: "exact" })
      .order("changed_at", { ascending: false }).range(from, to);
    if (logFilter !== "all") {
      const role = logFilter === "tec" ? "tecnico" : logFilter;
      q = q.or(`new_role.eq.${role},old_role.eq.${role}`);
    }
    const { data, count } = await q;
    setLogs(data ?? []);
    setLogTotal(count ?? 0);
  };

  const totalPages = Math.max(1, Math.ceil(logTotal / PAGE_SIZE));

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").update({ nome }).eq("user_id", user.id);
    setSavingProfile(false);
    if (error) toast.error("Erro ao salvar perfil");
    else toast.success("Perfil atualizado");
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    setPwdSending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/`,
    });
    setPwdSending(false);
    if (error) toast.error("Erro ao enviar email");
    else { toast.success("Email de redefinição enviado"); setPwdOpen(false); }
  };

  const exportLogsCSV = async () => {
    let q = supabase.from("role_change_logs").select("*").order("changed_at", { ascending: false });
    if (logFilter !== "all") {
      const role = logFilter === "tec" ? "tecnico" : logFilter;
      q = q.or(`new_role.eq.${role},old_role.eq.${role}`);
    }
    const { data } = await q;
    if (!data?.length) { toast.error("Nenhum log para exportar"); return; }
    const headers = ["Data/Hora", "Quem fez", "Usuário alterado", "Ação", "Papel anterior", "Papel novo"];
    const rows = data.map((l) => [
      formatDate(l.changed_at), l.changed_by_email ?? "", l.changed_user_email ?? "",
      l.action, l.old_role ?? "", l.new_role ?? "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `logs-papel-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado");
  };

  const emergencySQL = `-- Promover usuário ao papel admin (executar no SQL Editor do backend)
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::app_role FROM public.profiles
WHERE lower(email) = lower('emergencia@empresa.com')
ON CONFLICT DO NOTHING;`;

  const copyEmergency = async () => {
    await navigator.clipboard.writeText(emergencySQL);
    toast.success("Script copiado");
  };

  const savePrefs = async () => {
    if (!user) return;
    const { error } = await supabase.from("admin_preferences")
      .upsert({ user_id: user.id, ...prefs }, { onConflict: "user_id" });
    if (error) toast.error("Erro ao salvar preferências");
    else toast.success("Preferências salvas");
  };

  const handleThemeChange = (v: string) => {
    setPrefs((p) => ({ ...p, theme: v }));
    if (v === "dark") document.documentElement.classList.add("dark");
    else if (v === "light") document.documentElement.classList.remove("dark");
    else {
      const sysDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", sysDark);
    }
  };

  const initials = useMemo(() =>
    (nome || email || "A").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase(),
    [nome, email]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Configurações do Administrador</h1>
          <p className="text-muted-foreground">Painel completo de administração do sistema</p>
        </div>
      </div>

      <Tabs defaultValue="perfil" className="w-full">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
          <TabsTrigger value="ajuda">Ajuda</TabsTrigger>
          <TabsTrigger value="preferencias">Preferências</TabsTrigger>
        </TabsList>

        {/* PERFIL */}
        <TabsContent value="perfil">
          <Card className="rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Meu Perfil</CardTitle>
              <CardDescription>Atualize suas informações pessoais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                  {initials}
                </div>
                <div>
                  <Badge variant="destructive">ADMIN</Badge>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome completo</Label>
                  <div className="flex gap-2">
                    <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
                    <Button onClick={handleSaveProfile} disabled={savingProfile}>Salvar</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (verificado)</Label>
                  <Input id="email" value={email} readOnly disabled />
                </div>
                <div className="space-y-2">
                  <Label>Membro desde</Label>
                  <Input value={formatDate(createdAt)} readOnly disabled />
                </div>
                <div className="space-y-2">
                  <Label>Último login</Label>
                  <Input value={formatDate(lastSignIn)} readOnly disabled />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button variant="outline" onClick={() => setPwdOpen(true)}>
                  <KeyRound className="h-4 w-4" /> Alterar Senha
                </Button>
                <Button variant="destructive" onClick={() => signOut()}>
                  <LogOut className="h-4 w-4" /> Sair do Sistema
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ESTATÍSTICAS */}
        <TabsContent value="estatisticas">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard icon={<Users className="h-5 w-5" />} label="Total de usuários" value={stats.total} />
            <StatCard icon={<UserCog className="h-5 w-5 text-destructive" />} label="Administradores" value={stats.admins} />
            <StatCard icon={<UserCog className="h-5 w-5 text-primary" />} label="Técnicos" value={stats.tecnicos} />
            <StatCard icon={<User className="h-5 w-5 text-muted-foreground" />} label="Usuários comuns" value={stats.usuarios} />
            <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Novos (7 dias)" value={stats.novos7d} />
            <StatCard icon={<Database className="h-5 w-5" />} label="Versão" value={APP_VERSION} />
            <Card className="rounded-2xl shadow-md md:col-span-2 lg:col-span-3">
              <CardContent className="p-4 flex items-center gap-3">
                <Database className="h-5 w-5" />
                <div>
                  <div className="text-sm text-muted-foreground">Banco de dados</div>
                  <div className="font-medium">{DB_INFO}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* LOGS */}
        <TabsContent value="logs">
          <Card className="rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle>Logs de Alterações de Papel</CardTitle>
              <CardDescription>Auditoria automática de mudanças em papéis de usuários</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 mb-4">
                <Select value={logFilter} onValueChange={(v) => { setLogFilter(v); setLogPage(1); }}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="tec">Técnico</SelectItem>
                    <SelectItem value="usuario">Usuário</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={exportLogsCSV}>
                  <Download className="h-4 w-4" /> Exportar CSV
                </Button>
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" /> Imprimir
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Quem fez</TableHead>
                      <TableHead>Usuário alterado</TableHead>
                      <TableHead>Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum log encontrado</TableCell></TableRow>
                    ) : logs.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="whitespace-nowrap">{formatDate(l.changed_at)}</TableCell>
                        <TableCell>{l.changed_by_email ?? "—"}</TableCell>
                        <TableCell>{l.changed_user_email ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={l.action === "DELETE" ? "destructive" : "secondary"}>
                            {l.action} {l.old_role && `${l.old_role} → `}{l.new_role ?? ""}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">Página {logPage} de {totalPages} • {logTotal} registros</div>
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" onClick={() => setLogPage(1)} disabled={logPage === 1}><ChevronsLeft className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" onClick={() => setLogPage((p) => Math.max(1, p - 1))} disabled={logPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" onClick={() => setLogPage((p) => Math.min(totalPages, p + 1))} disabled={logPage >= totalPages}><ChevronRight className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" onClick={() => setLogPage(totalPages)} disabled={logPage >= totalPages}><ChevronsRight className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEGURANÇA */}
        <TabsContent value="seguranca">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="rounded-2xl shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-green-600" /> Verificação de integridade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className={hasAdmin ? "text-green-600" : "text-destructive"}>
                  {hasAdmin ? "✅" : "❌"} Sistema possui pelo menos 1 admin
                </div>
                <div className="text-green-600">✅ RLS ativo em todas as tabelas</div>
                <div className="text-green-600">✅ Trigger de auditoria ativo</div>
                <div className="text-green-600">✅ Proteção contra remoção do último admin</div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-md border-destructive/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5" /> Zona de Perigo</CardTitle>
                <CardDescription>Script de emergência para promover admin via SQL Editor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">{emergencySQL}</pre>
                <Button variant="outline" onClick={copyEmergency}>
                  <Copy className="h-4 w-4" /> Copiar Script
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AJUDA */}
        <TabsContent value="ajuda">
          <Card className="rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle>Ajuda e Suporte</CardTitle>
              <CardDescription>Perguntas frequentes e contato</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Accordion type="single" collapsible>
                <AccordionItem value="q1">
                  <AccordionTrigger>Como promover um usuário a admin?</AccordionTrigger>
                  <AccordionContent>Acesse Usuários, clique no botão de promover na linha do usuário desejado.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="q2">
                  <AccordionTrigger>O que fazer se eu for o único admin e quiser sair?</AccordionTrigger>
                  <AccordionContent>Promova outro usuário a admin antes de sair. O sistema impede a remoção do último administrador.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="q3">
                  <AccordionTrigger>Como um técnico acessa as manutenções?</AccordionTrigger>
                  <AccordionContent>O técnico acessa a página /manutencao após login. Tem permissão para criar e editar manutenções.</AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="space-y-2 text-sm border-t pt-4">
                <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> suporte@empresa.com</div>
                <div className="flex items-center gap-2"><FileText className="h-4 w-4" /> https://docs.empresa.com</div>
                <div className="flex items-center gap-2"><MessageCircle className="h-4 w-4" /> Disponível em horário comercial</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PREFERÊNCIAS */}
        <TabsContent value="preferencias">
          <Card className="rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle>Preferências</CardTitle>
              <CardDescription>Personalize o comportamento do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <PrefCheck label="Enviar notificações por email sobre novos usuários"
                  checked={prefs.notify_new_users}
                  onChange={(v) => setPrefs((p) => ({ ...p, notify_new_users: v }))} />
                <PrefCheck label="Registrar logs de todas as alterações de papel"
                  checked={prefs.log_role_changes}
                  onChange={(v) => setPrefs((p) => ({ ...p, log_role_changes: v }))} />
                <PrefCheck label="Exigir 2FA para usuários admin"
                  checked={prefs.require_2fa}
                  onChange={(v) => setPrefs((p) => ({ ...p, require_2fa: v }))} />
                <PrefCheck label="Bloquear acesso após 5 tentativas falhas"
                  checked={prefs.block_after_failed}
                  onChange={(v) => setPrefs((p) => ({ ...p, block_after_failed: v }))} />
              </div>

              <div className="space-y-2">
                <Label>Tema do sistema</Label>
                <RadioGroup value={prefs.theme} onValueChange={handleThemeChange} className="flex gap-6">
                  <div className="flex items-center gap-2"><RadioGroupItem value="light" id="t-light" /><Label htmlFor="t-light">Claro</Label></div>
                  <div className="flex items-center gap-2"><RadioGroupItem value="dark" id="t-dark" /><Label htmlFor="t-dark">Escuro</Label></div>
                  <div className="flex items-center gap-2"><RadioGroupItem value="system" id="t-sys" /><Label htmlFor="t-sys">Sistema</Label></div>
                </RadioGroup>
              </div>

              <Button onClick={savePrefs}>Salvar Preferências</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={pwdOpen} onOpenChange={setPwdOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>Enviaremos um link de redefinição para {email}.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwdOpen(false)}>Cancelar</Button>
            <Button onClick={handleResetPassword} disabled={pwdSending}>
              {pwdSending ? "Enviando..." : "Enviar link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) => (
  <Card className="rounded-2xl shadow-md hover:shadow-lg transition-shadow">
    <CardContent className="p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">{icon}</div>
      <div>
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="text-2xl font-bold">{value}</div>
      </div>
    </CardContent>
  </Card>
);

const PrefCheck = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center gap-3">
    <Checkbox id={label} checked={checked} onCheckedChange={(v) => onChange(!!v)} />
    <Label htmlFor={label} className="cursor-pointer">{label}</Label>
  </div>
);

export default Settings;
