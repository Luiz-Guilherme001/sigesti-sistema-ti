import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleRoute from "@/components/RoleRoute";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Dashboard from "./pages/Dashboard";
import Computadores from "./pages/Computadores";
import Manutencao from "./pages/Manutencao";
import Pecas from "./pages/Pecas";
import Relatorios from "./pages/Relatorios";
import Usuarios from "./pages/Usuarios";
import Help from "./pages/Help";
import Settings from "./pages/Settings";
import AppLayout from "./components/AppLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const protect = (el: JSX.Element) => (
  <ProtectedRoute><AppLayout>{el}</AppLayout></ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/dashboard" element={protect(<Dashboard />)} />
            <Route path="/computadores" element={protect(<Computadores />)} />
            <Route path="/manutencao" element={protect(<Manutencao />)} />
            <Route path="/pecas" element={protect(<Pecas />)} />
            <Route path="/relatorios" element={protect(<Relatorios />)} />
            <Route path="/usuarios" element={<ProtectedRoute><RoleRoute allow={["admin"]}><AppLayout><Usuarios /></AppLayout></RoleRoute></ProtectedRoute>} />
            <Route path="/ajuda" element={protect(<Help />)} />
            <Route path="/configuracoes" element={protect(<Settings />)} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
