import { useState } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Monitor, Wrench, Package, BarChart3,
  Settings, HelpCircle, LogOut, Ticket, ChevronDown, List,
  Plus, ClipboardList, PlusCircle, Menu, X, CalendarDays, Building2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoEetepa from "@/assets/logo-eetepa.jpg";




const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { rolesLoading, isAdmin, isUser } = useAuth();
  const [chamadosOpen, setChamadosOpen] = useState(location.pathname.startsWith("/chamados"));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logout realizado com sucesso!");
      navigate("/");
    } catch {
      toast.error("Erro ao fazer logout");
    }
  };

  const staffMenuItems = [
    { path: "/dashboard",     icon: LayoutDashboard, label: "Dashboard",     show: true },
    { path: "/computadores",  icon: Monitor,         label: "Computadores",  show: true },
    { path: "/manutencao",    icon: Wrench,          label: "Manutenção",    show: true },
    { type: "submenu",        icon: Ticket,          label: "Chamados",      show: true },
    { path: "/pecas",         icon: Package,         label: "Peças",         show: true },
    { path: "/relatorios",    icon: BarChart3,       label: "Relatórios",    show: true },
    { path: "/agendamento",   icon: CalendarDays,    label: "Agendamento",   show: true }, 
    { path: "/configuracoes", icon: Settings,        label: "Configurações", show: isAdmin },
    { path: "/ajuda",         icon: HelpCircle,      label: "Ajuda",         show: true },
  ];

  const userMenuItems = [
    { path: "/dashboard",     icon: LayoutDashboard, label: "Dashboard",      show: true },
    { path: "/meus-chamados", icon: ClipboardList,   label: "Meus Chamados", show: true },
    { path: "/novo-chamado",  icon: PlusCircle,      label: "Abrir Chamado", show: true },
    { path: "/computadores",  icon: Monitor,         label: "Computadores",  show: true },
    { path: "/setores",       icon: Building2,       label: "Setores",       show: true },
    { path: "/agendamento",   icon: CalendarDays,    label: "Agendamento",   show: true },
  ];

  const menuItems = isUser ? userMenuItems : staffMenuItems;

  if (rolesLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const SidebarContent = () => (
    <>
      <div className="p-4 border-b border-border">
        <img src={logoEetepa} alt="Logo EETEPA" className="h-10 w-auto mb-2 rounded" />
        <h1 className="text-xl font-bold text-primary">
          EETEPA <span className="text-accent">SIGESTI</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Sistema Integrado de Gestão de TI</p>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item, index) => {
          if (item.type === "submenu" && item.show) {
            return (
              <div key={index} className="space-y-1">
                <button
                  onClick={() => setChamadosOpen(!chamadosOpen)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200",
                    location.pathname.startsWith("/chamados")
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Ticket className="h-5 w-5" />
                    <span className="text-sm font-medium">Chamados</span>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", chamadosOpen && "rotate-180")} />
                </button>
                {chamadosOpen && (
                  <div className="ml-6 space-y-1">
                    <Link
                      to="/chamados"
                      onClick={() => setSidebarOpen(false)}
                      className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all", location.pathname === "/chamados" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground")}
                    >
                      <List className="h-4 w-4" /><span>Listar Chamados</span>
                    </Link>
                    <Link
                      to="/chamados/novo"
                      onClick={() => setSidebarOpen(false)}
                      className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all", location.pathname === "/chamados/novo" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground")}
                    >
                      <Plus className="h-4 w-4" /><span>Novo Chamado</span>
                    </Link>
                  </div>
                )}
              </div>
            );
          }

          if (item.show && !item.type) {
            return (
              <Link
                key={item.path ?? index}
                to={item.path!}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          }
          return null;
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-red-500 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-sm font-medium">Sair do sistema</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background">

      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-64 border-r border-border bg-card flex-col">
        <SidebarContent />
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar mobile (drawer) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 md:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-end p-2 border-b border-border">
          <button onClick={() => setSidebarOpen(false)} className="p-2 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <SidebarContent />
      </aside>

 {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Topbar mobile */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <button onClick={() => setSidebarOpen(true)} className="text-muted-foreground hover:text-foreground">
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2">
            <img src={logoEetepa} alt="Logo" className="h-7 w-auto rounded" />
            <span className="font-bold text-primary text-sm">EETEPA <span className="text-accent">SIGESTI</span></span>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 bg-muted/30">
          <Outlet />
        </main>
      </div>

      


    </div>
  );     
};

export default AppLayout;