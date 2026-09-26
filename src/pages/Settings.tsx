import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Settings as SettingsIcon, ShieldCheck, Users, UserCog, User,
  TrendingUp, Database, LogOut, KeyRound,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Mail,
  Building2, Plus, Pencil, Trash2, Search, RefreshCw, UserPlus,
  ImagePlus, X,
  Microscope, BookOpen, FlaskConical, MonitorSmartphone, Presentation,
  Wrench, GraduationCap, Coffee, Music2, Landmark, Home, Layers,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const PAGE_SIZE = 10;
const APP_VERSION = "v2.1.0";
const DB_INFO = "Supabase (PostgreSQL 15)";
const formatDate = (d?: string | null) => d ? new Date(d).toLocaleString("pt-BR") : "—";

// Mapa de ícones disponíveis para setor
const SETOR_ICONS: { label: string; value: string; icon: React.ReactNode }[] = [
  { label: "Laboratório",     value: "FlaskConical",      icon: <FlaskConical      className="h-5 w-5" /> },
  { label: "Informática",     value: "MonitorSmartphone", icon: <MonitorSmartphone className="h-5 w-5" /> },
  { label: "Biblioteca",      value: "BookOpen",          icon: <BookOpen          className="h-5 w-5" /> },
  { label: "Auditório",       value: "Presentation",      icon: <Presentation      className="h-5 w-5" /> },
  { label: "Manutenção",      value: "Wrench",            icon: <Wrench            className="h-5 w-5" /> },
  { label: "Ensino",          value: "GraduationCap",     icon: <GraduationCap     className="h-5 w-5" /> },
  { label: "Sala Professores",value: "Coffee",            icon: <Coffee            className="h-5 w-5" /> },
  { label: "Multimídia",      value: "Music2",            icon: <Music2            className="h-5 w-5" /> },
  { label: "Direção",         value: "Landmark",          icon: <Landmark          className="h-5 w-5" /> },
  { label: "Secretaria",      value: "Home",              icon: <Home              className="h-5 w-5" /> },
  { label: "Ciências",        value: "Microscope",        icon: <Microscope        className="h-5 w-5" /> },
  { label: "Geral",           value: "Layers",            icon: <Layers            className="h-5 w-5" /> },
];

const getIconComponent = (value: string | null | undefined) => {
  const found = SETOR_ICONS.find((i) => i.value === value);
  return found ? found.icon : <Building2 className="h-5 w-5" />;
};

interface UserRow {
  user_id: string;
  nome: string;
  email: string;
  role: "admin" | "tecnico" | "usuario";
  role_agendamento?: "admin" | "diretor" | "coordenador" | "professor" | "aluno" | null;
  setor_nome?: string | null;
  setor_id?: string | null;
}

interface Setor {
  id: string;
  nome: string;
  descricao: string;
  imagem_url?: string | null;
  icone?: string | null;
}

const genPassword = () => {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let p = "";
  for (let i = 0; i < 12; i++) p += chars[Math.floor(Math.random() * chars.length)];
  return p + "@1";
};

const Settings = () => {
  const { user, signOut, roles } = useAuth();
  const isAdmin = roles.includes("admin");

  // Perfil
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [lastSignIn, setLastSignIn] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdSending, setPwdSending] = useState(false);

  // Stats
  const [stats, setStats] = useState({ total: 0, admins: 0, tecnicos: 0, novos7d: 0 });

  // Usuários
  const [userRows, setUserRows] = useState<UserRow[]>([]);
  const [userLoading, setUserLoading] = useState(true);
  const [buscaUser, setBuscaUser] = useState("");
  const [filtroRole, setFiltroRole] = useState<"todos" | "admin" | "tecnico" | "usuario">("todos");
  const [filtroSetor, setFiltroSetor] = useState<string>("todos");
  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novaSenha, setNovaSenha] = useState(genPassword());
  const [novoPapel, setNovoPapel] = useState<"admin" | "tecnico" | "usuario">("tecnico");
  const [formSetorId, setFormSetorId] = useState<string>("");
  const [setoresList, setSetoresList] = useState<{ id: string; nome: string }[]>([]);
  const [promoteTarget, setPromoteTarget] = useState<UserRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [saving, setSaving] = useState(false);

  // Setores
  const [setores, setSetores] = useState<Setor[]>([]);
  const [setorLoading, setSetorLoading] = useState(true);
  const [buscaSetor, setBuscaSetor] = useState("");
  const [setorOpen, setSetorOpen] = useState(false);
  const [editingSetorId, setEditingSetorId] = useState<string | null>(null);
  const [setorForm, setSetorForm] = useState({ nome: "", descricao: "", icone: "" });

  // Upload de imagem do setor
  const [uploadingSetor, setUploadingSetor] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);

  // Form para edição
  const [form, setForm] = useState({
    nome: "",
    email: "",
    role: "usuario" as "admin" | "tecnico" | "usuario",
  });

  // ── Init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    setEmail(user.email ?? "");
    setLastSignIn(user.last_sign_in_at ?? null);
    setCreatedAt(user.created_at ?? null);
    supabase.from("profiles").select("nome").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { if (data?.nome) setNome(data.nome); });
    loadStats();
    loadUsers();
    loadSetores();
  }, [user]);

  const recarregarSetoresList = async () => {
    const { data } = await supabase.from("setores").select("id, nome").order("nome");
    setSetoresList(data ?? []);
  };

  useEffect(() => {
    recarregarSetoresList();
  }, []);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const loadStats = async () => {
    const [{ count: total }, { data: rolesData }] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("user_roles").select("role"),
    ]);
    const admins = rolesData?.filter((r: { role: string }) => r.role === "admin").length ?? 0;
    const tecnicos = rolesData?.filter((r: { role: string }) => r.role === "tecnico").length ?? 0;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: novos7d } = await supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo);
    setStats({ total: total ?? 0, admins, tecnicos, novos7d: novos7d ?? 0 });
  };

  // ── Perfil ─────────────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { data: existing } = await supabase.from("profiles").select("id").eq("user_id", user.id).maybeSingle();
    let error;
    if (existing) {
      ({ error } = await supabase.from("profiles").update({ nome }).eq("user_id", user.id));
    } else {
      ({ error } = await supabase.from("profiles").insert({ user_id: user.id, email: user.email, nome }));
    }
    setSavingProfile(false);
    if (error) { toast.error("Erro: " + error.message); } else { toast.success("Perfil atualizado"); }
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    setPwdSending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/atualizar-senha`,
    });
    setPwdSending(false);
    if (error) { toast.error("Erro ao enviar email"); } else { toast.success("Email de redefinição enviado"); setPwdOpen(false); }
  };

  // ── Usuários ───────────────────────────────────────────────────────────────
  const loadUsers = async () => {
    setUserLoading(true);
    const { data: profiles, error } = await supabase.from("profiles").select("user_id, nome, email, setor_id, role_agendamento").order("nome", { ascending: true });
    if (error) { toast.error(error.message); setUserLoading(false); return; }
    const { data: setoresData } = await supabase.from("setores").select("id, nome");
    const setorMap = new Map<string, string>();
    (setoresData ?? []).forEach((s) => setorMap.set(s.id, s.nome));
    const { data: rolesData } = await supabase.from("user_roles").select("user_id, role");
    const roleMap = new Map<string, "admin" | "tecnico" | "usuario">();
    const rank: Record<string, number> = { admin: 3, tecnico: 2, usuario: 1 };
    (rolesData ?? []).forEach((r) => {
      const userId = r.user_id ?? "";
      const cur = roleMap.get(userId);
      const roleValue = r.role ?? "";
      if (!cur || (rank[roleValue] ?? 0) > (rank[cur] ?? 0)) roleMap.set(userId, roleValue as "admin" | "tecnico" | "usuario");
    });
    setUserRows((profiles ?? []).map((p) => ({
      user_id: p.user_id, nome: p.nome, email: p.email,
      role: roleMap.get(p.user_id) ?? "tecnico",
      role_agendamento: p.role_agendamento ?? null,
      setor_nome: p.setor_id ? setorMap.get(p.setor_id) ?? null : null,
      setor_id: p.setor_id,
    })));
    setUserLoading(false);
  };

  const changeRole = async (userId: string, newRole: "admin" | "tecnico" | "usuario") => {
    const target = userRows.find((r) => r.user_id === userId);
    const adminCount = userRows.filter((r) => r.role === "admin").length;
    if (target?.role === "admin" && newRole !== "admin" && adminCount <= 1) { toast.error("Não é possível rebaixar o último administrador."); return; }
    const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (delErr) { toast.error(delErr.message); return; }
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
    if (error) { toast.error(error.message); return; }
    toast.success("Papel atualizado");
    loadUsers();
  };

  const changeRoleAgendamento = async (
    userId: string,
    novoRole: "diretor" | "coordenador" | "professor" | "aluno" | ""
  ) => {
    const { error } = await supabase
      .from("profiles")
      .update({ role_agendamento: novoRole || null })
      .eq("user_id", userId);
    if (error) { toast.error(error.message); return; }
    toast.success("Papel de agendamento atualizado");
    loadUsers();
  };

  const confirmPromote = async () => {
    if (!promoteTarget) return;
    const t = promoteTarget;
    setPromoteTarget(null);
    await changeRole(t.user_id, "admin");
    toast.success(`✅ ${t.nome} agora é administrador`);
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    const adminCount = userRows.filter((r) => r.role === "admin").length;
    if (deleteTarget.role === "admin" && adminCount <= 1) { toast.error("❌ Não é possível excluir o único administrador"); setDeleteTarget(null); return; }
    if (deleteTarget.email === user?.email) { toast.error("❌ Você não pode excluir sua própria conta"); setDeleteTarget(null); return; }
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("delete-user", { body: { user_id: deleteTarget.user_id } });
      if (error) throw error;
      toast.success(`🗑️ ${deleteTarget.nome} foi excluído`);
      loadUsers();
    } catch (err) {
      toast.error((err as Error).message ?? "Erro ao excluir");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleCreateUser = async () => {
    if (!novoNome.trim()) return toast.error("Informe o nome");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(novoEmail)) return toast.error("E-mail inválido");
    if (novaSenha.length < 6) return toast.error("Senha deve ter ao menos 6 caracteres");
    setCreating(true);
    try {
      const { error } = await supabase.functions.invoke("create-user", {
        body: { nome: novoNome.trim(), email: novoEmail.trim().toLowerCase(), password: novaSenha, role: novoPapel, setor_id: formSetorId || null },
      });
      if (error) {
        try { const errText = await error.context.text(); toast.error(errText); } catch { /* noop */ }
        throw error;
      }
      toast.success(`Usuário criado. Senha: ${novaSenha}`, { duration: 12000 });
      setOpenCreate(false); setNovoNome(""); setNovoEmail(""); setNovaSenha(genPassword()); setNovoPapel("tecnico"); setFormSetorId("");
      setTimeout(() => loadUsers(), 1000);
    } catch (err) {
      toast.error((err as Error).message ?? "Falha ao criar usuário");
    } finally {
      setCreating(false);
    }
  };

  const openCreateModal = () => { setFormSetorId(""); setOpenCreate(true); };

  const openEditUser = (u: UserRow) => {
    setEditingUser(u);
    setForm({ nome: u.nome, email: u.email, role: u.role });
    setFormSetorId(u.setor_id || "");
    setOpenEdit(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ nome: form.nome, setor_id: formSetorId || null }).eq("user_id", editingUser.user_id);
    if (error) { toast.error(error.message); } else { toast.success("Usuário atualizado com sucesso!"); loadUsers(); setOpenEdit(false); setEditingUser(null); }
    setSaving(false);
  };

  const filteredUsers = userRows
    .filter((u) => filtroRole === "todos" || u.role === filtroRole)
    .filter((u) => filtroSetor === "todos" || u.setor_id === filtroSetor)
    .filter((u) => u.nome.toLowerCase().includes(buscaUser.toLowerCase()) || u.email.toLowerCase().includes(buscaUser.toLowerCase()));

  // ── Setores ────────────────────────────────────────────────────────────────
  const loadSetores = async () => {
    setSetorLoading(true);
    const { data, error } = await supabase.from("setores").select("*").order("nome");
    if (error) { toast.error(error.message); } else { setSetores((data ?? []) as Setor[]); }
    setSetorLoading(false);
  };

  const handleSetorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setorForm.nome.trim()) { toast.error("Informe o nome do setor"); return; }
    let error;
    if (editingSetorId) {
      ({ error } = await supabase.from("setores").update({ nome: setorForm.nome, descricao: setorForm.descricao, icone: setorForm.icone || null }).eq("id", editingSetorId));
    } else {
      ({ error } = await supabase.from("setores").insert({ nome: setorForm.nome, descricao: setorForm.descricao, icone: setorForm.icone || null }));
    }
    if (error) { toast.error(error.message); return; }
    toast.success(editingSetorId ? "Setor atualizado" : "Setor criado");
    setSetorForm({ nome: "", descricao: "", icone: "" });
    setEditingSetorId(null);
    setSetorOpen(false);
    loadSetores();
    await recarregarSetoresList();
  };

  const handleSetorDelete = async (id: string, nome: string) => {
    if (!confirm(`Excluir o setor "${nome}"?`)) return;
    const { error } = await supabase.from("setores").delete().eq("id", id);
    if (error) { toast.error(error.message); } else { toast.success("Setor excluído"); loadSetores(); await recarregarSetoresList(); }
  };

  // ── Upload imagem setor ────────────────────────────────────────────────────
  const handleImageUpload = async (setorId: string, file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Selecione uma imagem válida."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Imagem deve ter no máximo 5MB."); return; }

    setUploadingSetor(setorId);
    setUploadProgress(true);

    try {
      const ext = file.name.split(".").pop();
      const path = `setor-${setorId}.${ext}`;

      // Remove imagem antiga se existir
      await supabase.storage.from("setores-imagens").remove([path]);

      const { error: uploadError } = await supabase.storage
        .from("setores-imagens")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("setores-imagens").getPublicUrl(path);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("setores")
        .update({ imagem_url: publicUrl })
        .eq("id", setorId);

      if (updateError) throw updateError;

      toast.success("Imagem atualizada com sucesso!");
      loadSetores();
    } catch (err) {
      toast.error((err as Error).message ?? "Erro ao fazer upload");
    } finally {
      setUploadingSetor(null);
      setUploadProgress(false);
    }
  };

  const handleRemoveImage = async (setorId: string) => {
    if (!confirm("Remover a imagem deste setor?")) return;
    const { error } = await supabase.from("setores").update({ imagem_url: null }).eq("id", setorId);
    if (error) { toast.error(error.message); } else { toast.success("Imagem removida."); loadSetores(); }
  };

  const filteredSetores = setores.filter((s) => s.nome.toLowerCase().includes(buscaSetor.toLowerCase()));

  const initials = useMemo(() =>
    (nome || email || "A").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase(), [nome, email]);

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
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="setores">Setores</TabsTrigger>
          <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
          <TabsTrigger value="seguranca">Ajuda</TabsTrigger>
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
                <div className="h-20 w-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">{initials}</div>
                <Badge variant="destructive">ADMIN</Badge>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome completo</Label>
                  <div className="flex gap-2">
                    <Input value={nome} onChange={(e) => setNome(e.target.value)} />
                    <Button onClick={handleSaveProfile} disabled={savingProfile}>Salvar</Button>
                  </div>
                </div>
                <div className="space-y-2"><Label>Email</Label><Input value={email} readOnly disabled /></div>
                <div className="space-y-2"><Label>Membro desde</Label><Input value={formatDate(createdAt)} readOnly disabled /></div>
                <div className="space-y-2"><Label>Último login</Label><Input value={formatDate(lastSignIn)} readOnly disabled /></div>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button variant="outline" onClick={() => setPwdOpen(true)}><KeyRound className="h-4 w-4" /> Alterar Senha</Button>
                <Button variant="destructive" onClick={() => signOut()}><LogOut className="h-4 w-4" /> Sair do Sistema</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* USUÁRIOS */}
        <TabsContent value="usuarios">
          <Card className="rounded-2xl shadow-md">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Usuários</CardTitle>
                  <CardDescription>Controle de acesso ao sistema</CardDescription>
                </div>
                {isAdmin && <Button onClick={openCreateModal}><UserPlus className="h-4 w-4 mr-2" /> Novo usuário</Button>}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-muted rounded-lg"><p className="text-2xl font-bold text-primary">{userRows.length}</p><p className="text-xs text-muted-foreground">Total</p></div>
                <div className="text-center p-3 bg-muted rounded-lg"><p className="text-2xl font-bold text-destructive">{userRows.filter((u) => u.role === "admin").length}</p><p className="text-xs text-muted-foreground">Admins</p></div>
                <div className="text-center p-3 bg-muted rounded-lg"><p className="text-2xl font-bold text-primary">{userRows.filter((u) => u.role === "tecnico").length}</p><p className="text-xs text-muted-foreground">Técnicos</p></div>
                <div className="text-center p-3 bg-muted rounded-lg"><p className="text-2xl font-bold text-primary">{userRows.filter((u) => u.role === "usuario").length}</p><p className="text-xs text-muted-foreground">Usuários</p></div>
              </div>
              <div className="flex gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar usuário..." value={buscaUser} onChange={(e) => setBuscaUser(e.target.value)} className="pl-10" />
                </div>
                <Select value={filtroRole} onValueChange={(v) => setFiltroRole(v as "todos" | "admin" | "tecnico" | "usuario")}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="tecnico">Técnico</SelectItem>
                    <SelectItem value="usuario">Usuário</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filtroSetor} onValueChange={setFiltroSetor}>
                  <SelectTrigger className="w-48"><SelectValue placeholder="Filtrar por setor" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os setores</SelectItem>
                    {setoresList.map((s) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead><TableHead>E-mail</TableHead><TableHead>Setor</TableHead><TableHead>Papel</TableHead><TableHead>Agendamento</TableHead>
                      {isAdmin && <TableHead className="text-right">Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userLoading ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum usuário</TableCell></TableRow>
                    ) : filteredUsers.map((u) => (
                      <TableRow key={u.user_id}>
                        <TableCell className="font-medium">{u.nome}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.setor_nome || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={u.role === "admin" ? "destructive" : "secondary"}>
                            {u.role === "admin" ? "Administrador" : u.role === "tecnico" ? "Técnico" : "Usuário"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                                                    {isAdmin ? (
                            <Select
                              value={u.role_agendamento ?? "nenhum"}
                              onValueChange={(v) => changeRoleAgendamento(u.user_id, v === "nenhum" ? "" : v as "diretor" | "coordenador" | "professor" | "aluno")}
                            >
                              <SelectTrigger className="w-36 h-8"><SelectValue placeholder="Nenhum" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="nenhum">Nenhum</SelectItem>
                                <SelectItem value="diretor">Diretor</SelectItem>
                                <SelectItem value="coordenador">Coordenador</SelectItem>
                                <SelectItem value="professor">Professor</SelectItem>
                                <SelectItem value="aluno">Aluno</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {u.role_agendamento ? u.role_agendamento.charAt(0).toUpperCase() + u.role_agendamento.slice(1) : "—"}
                            </span>
                          )}
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => openEditUser(u)} className="text-muted-foreground hover:text-primary p-1" title="Editar"><Pencil className="h-4 w-4" /></button>
                              {u.role !== "admin" && <Button size="sm" variant="outline" onClick={() => setPromoteTarget(u)}><ShieldCheck className="h-4 w-4" /> Promover</Button>}
                              <Select value={u.role} onValueChange={(v) => changeRole(u.user_id, v as "admin" | "tecnico" | "usuario")}>
                                <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Administrador</SelectItem>
                                  <SelectItem value="tecnico">Técnico</SelectItem>
                                  <SelectItem value="usuario">Usuário</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(u)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SETORES */}
        <TabsContent value="setores">
          <Card className="rounded-2xl shadow-md">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> Setores</CardTitle>
                  <CardDescription>Laboratórios, Secretaria, Biblioteca, etc.</CardDescription>
                </div>
                <Button onClick={() => { setEditingSetorId(null); setSetorForm({ nome: "", descricao: "", icone: "" }); setSetorOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" /> Novo Setor
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar setor..." value={buscaSetor} onChange={(e) => setBuscaSetor(e.target.value)} className="pl-10" />
              </div>
              {setorLoading ? (
                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
              ) : filteredSetores.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum setor cadastrado.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSetores.map((setor) => (
                    <div key={setor.id} className="border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                      {/* Imagem do setor */}
                      <div className="relative h-36 bg-muted flex items-center justify-center group">
                        {setor.imagem_url ? (
                          <>
                            <img src={setor.imagem_url} alt={setor.nome} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <label className="cursor-pointer bg-white/90 text-black rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1 hover:bg-white transition-colors">
                                <ImagePlus className="h-3.5 w-3.5" />
                                Trocar
                                <input type="file" accept="image/*" className="hidden"
                                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(setor.id, f); e.target.value = ""; }}
                                />
                              </label>
                              <button onClick={() => handleRemoveImage(setor.id)} className="bg-red-500/90 text-white rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1 hover:bg-red-500 transition-colors">
                                <X className="h-3.5 w-3.5" /> Remover
                              </button>
                            </div>
                            {uploadingSetor === setor.id && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <div className="text-muted-foreground/40">
                              {getIconComponent(setor.icone)}
                            </div>
                            {uploadingSetor === setor.id ? (
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                            ) : (
                              <label className="cursor-pointer flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                                <ImagePlus className="h-4 w-4" />
                                Adicionar imagem
                                <input type="file" accept="image/*" className="hidden"
                                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(setor.id, f); e.target.value = ""; }}
                                />
                              </label>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Info do setor */}
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <span className="text-primary">{getIconComponent(setor.icone)}</span>
                            <div>
                              <h3 className="font-semibold">{setor.nome}</h3>
                              {setor.descricao && <p className="text-xs text-muted-foreground mt-0.5">{setor.descricao}</p>}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => { setEditingSetorId(setor.id); setSetorForm({ nome: setor.nome, descricao: setor.descricao || "", icone: setor.icone || "" }); setSetorOpen(true); }} className="p-1 text-muted-foreground hover:text-primary">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleSetorDelete(setor.id, setor.nome)} className="p-1 text-muted-foreground hover:text-red-500">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ESTATÍSTICAS */}
        <TabsContent value="estatisticas">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard icon={<Users className="h-5 w-5" />} label="Total de usuários" value={stats.total} />
            <StatCard icon={<UserCog className="h-5 w-5 text-destructive" />} label="Administradores" value={stats.admins} />
            <StatCard icon={<UserCog className="h-5 w-5 text-primary" />} label="Técnicos" value={stats.tecnicos} />
            <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Novos (7 dias)" value={stats.novos7d} />
            <StatCard icon={<Database className="h-5 w-5" />} label="Versão" value={APP_VERSION} />
            <Card className="rounded-2xl shadow-md md:col-span-2 lg:col-span-3">
              <CardContent className="p-4 flex items-center gap-3">
                <Database className="h-5 w-5" />
                <div><div className="text-sm text-muted-foreground">Banco de dados</div><div className="font-medium">{DB_INFO}</div></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AJUDA */}
        <TabsContent value="seguranca">
          <Card className="rounded-2xl shadow-md">
            <CardHeader><CardTitle>Ajuda e Suporte</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <Accordion type="single" collapsible>
                <AccordionItem value="q1">
                  <AccordionTrigger>Como promover um usuário a admin?</AccordionTrigger>
                  <AccordionContent>Acesse a aba Usuários, clique em Promover na linha do usuário desejado.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="q2">
                  <AccordionTrigger>O que fazer se eu for o único admin?</AccordionTrigger>
                  <AccordionContent>Promova outro usuário a admin antes de sair. O sistema impede a remoção do único administrador.</AccordionContent>
                </AccordionItem>
              </Accordion>
              <div className="text-sm border-t pt-4 flex items-center gap-2"><Mail className="h-4 w-4" /> suporte@empresa.com</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Alterar Senha */}
      <Dialog open={pwdOpen} onOpenChange={setPwdOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Alterar Senha</DialogTitle><DialogDescription>Enviaremos um link para {email}.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwdOpen(false)}>Cancelar</Button>
            <Button onClick={handleResetPassword} disabled={pwdSending}>{pwdSending ? "Enviando..." : "Enviar link"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Criar Usuário */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Criar novo usuário</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome completo</Label><Input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} /></div>
            <div><Label>E-mail</Label><Input type="email" value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)} /></div>
            <div>
              <Label>Senha temporária</Label>
              <div className="flex gap-2">
                <Input value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} />
                <Button type="button" variant="outline" size="icon" onClick={() => setNovaSenha(genPassword())}><RefreshCw className="h-4 w-4" /></Button>
              </div>
            </div>
            <div>
              <Label>Papel</Label>
              <Select value={novoPapel} onValueChange={(v) => setNovoPapel(v as "admin" | "tecnico" | "usuario")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tecnico">Técnico</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="usuario">Usuário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Setor</Label>
              <Select value={formSetorId} onValueChange={setFormSetorId}>
                <SelectTrigger><SelectValue placeholder="Selecione um setor" /></SelectTrigger>
                <SelectContent>{setoresList.map((s) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreate(false)} disabled={creating}>Cancelar</Button>
            <Button onClick={handleCreateUser} disabled={creating}>{creating ? "Criando..." : "Criar usuário"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Usuário */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Usuário</DialogTitle><DialogDescription>Altere as informações do usuário</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={form.email} disabled readOnly className="bg-muted" /></div>
            <div>
              <Label>Papel</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as UserRow["role"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="tecnico">Técnico</SelectItem>
                  <SelectItem value="usuario">Usuário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Setor</Label>
              <Select value={formSetorId} onValueChange={setFormSetorId}>
                <SelectTrigger><SelectValue placeholder="Selecione um setor" /></SelectTrigger>
                <SelectContent>{setoresList.map((s) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEdit(false)}>Cancelar</Button>
            <Button onClick={handleUpdateUser} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Setor */}
      <Dialog open={setorOpen} onOpenChange={setSetorOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingSetorId ? "Editar Setor" : "Novo Setor"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSetorSubmit} className="space-y-4">
            <div><Label>Nome *</Label><Input value={setorForm.nome} onChange={(e) => setSetorForm({ ...setorForm, nome: e.target.value })} placeholder="Ex: Laboratório 01" required /></div>
            <div><Label>Descrição</Label><Input value={setorForm.descricao} onChange={(e) => setSetorForm({ ...setorForm, descricao: e.target.value })} placeholder="Ex: 20 máquinas" /></div>
            <div>
              <Label>Ícone</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {SETOR_ICONS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setSetorForm({ ...setorForm, icone: item.value })}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all ${
                      setorForm.icone === item.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.icon}
                    <span className="text-[10px] leading-tight text-center">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSetorOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!promoteTarget} onOpenChange={(o) => !o && setPromoteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Promover a Administrador</AlertDialogTitle><AlertDialogDescription>Promover <strong>{promoteTarget?.nome}</strong> a admin?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={confirmPromote}>Promover</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && !deleting && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Excluir usuário</AlertDialogTitle>
            <AlertDialogDescription>Excluir <strong>{deleteTarget?.nome}</strong>? <br /><span className="text-red-500 font-semibold">⚠️ Ação irreversível!</span></AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700" disabled={deleting}>{deleting ? "Excluindo..." : "Excluir permanentemente"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) => (
  <Card className="rounded-2xl shadow-md hover:shadow-lg transition-shadow">
    <CardContent className="p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">{icon}</div>
      <div><div className="text-sm text-muted-foreground">{label}</div><div className="text-2xl font-bold">{value}</div></div>
    </CardContent>
  </Card>
);

export default Settings;