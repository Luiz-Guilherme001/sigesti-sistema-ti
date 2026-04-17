import { ReactNode, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Monitor, Wrench, Package, BarChart3,
  Users, Settings, HelpCircle, LogOut, Menu, Bell, Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/computadores", icon: Monitor, label: "Computadores" },
  { to: "/manutencao", icon: Wrench, label: "Manutenção" },
  { to: "/pecas", icon: Package, label: "Peças" },
  { to: "/relatorios", icon: BarChart3, label: "Relatórios" },
  { to: "/usuarios", icon: Users, label: "Usuários", adminOnly: true },
];

const AppLayout = ({ children }: { children: ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [nome, setNome] = useState("Usuário");
  const navigate = useNavigate();
  const { user, roles, signOut } = useAuth();

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("nome").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { if (data?.nome) setNome(data.nome); });
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const initials = nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const tipoLabel = roles.includes("admin") ? "Administrador" : roles.includes("tecnico") ? "Técnico" : "Usuário";

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300 md:relative md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-sidebar-border">
          <h1 className="text-xl font-bold">
            EETEPA <span className="text-accent">Gest</span>TI
          </h1>
          <p className="text-xs opacity-70 mt-1">Vilhena Alves</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <p className="px-5 text-[10px] font-semibold uppercase tracking-wider opacity-50 mb-2">
            Sistema
          </p>
          {navItems.filter((i) => !i.adminOnly || roles.includes("admin")).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-sidebar-accent font-semibold"
                    : "hover:bg-sidebar-accent/50 opacity-80"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border space-y-1">
          <button className="flex items-center gap-3 px-2 py-2 text-sm opacity-70 hover:opacity-100 w-full">
            <Settings className="h-4 w-4" /> Configurações
          </button>
          <button className="flex items-center gap-3 px-2 py-2 text-sm opacity-70 hover:opacity-100 w-full">
            <HelpCircle className="h-4 w-4" /> Ajuda
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-2 py-2 text-sm opacity-70 hover:opacity-100 text-accent w-full"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/30 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-4 md:px-6 py-3 flex items-center gap-4">
          <button
            className="md:hidden text-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <h2 className="text-lg font-bold text-primary hidden md:block">
            EETEPA <span className="text-accent">Gest</span>TI
          </h2>

          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar no sistema..." className="pl-10 h-9" />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <button className="relative text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent text-accent-foreground text-[10px] flex items-center justify-center font-bold">
                2
              </span>
            </button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                {initials || "U"}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium leading-none">{nome}</p>
                <p className="text-xs text-muted-foreground">{tipoLabel}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
