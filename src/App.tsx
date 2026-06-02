import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleRoute from "@/components/RoleRoute";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Chamados from "@/pages/Chamados";
import ChamadoForm from "@/pages/ChamadosForm";
import ChamadoVisualizar from "@/pages/ChamadoVisualizar";
import Manutencao from "@/pages/Manutencao";
import Computadores from "@/pages/Computadores";
import Pecas from "@/pages/Pecas";
import Relatorios from "@/pages/Relatorios";
import Settings from "@/pages/Settings";
import Help from "@/pages/Help";
import MeusChamados from "@/pages/MeusChamados";
import NovoChamado from "@/pages/NovoChamado";
import NotFound from "@/pages/NotFound";
import ConfirmarEmail from "@/pages/ConfirmarEmail";
import AtualizarSenha from "@/pages/AtualizarSenha";
import AgendamentoSalas from "@/pages/AgendamentoSalas";
import Setores from "@/pages/Setores";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/confirm" element={<ConfirmarEmail />} />
          <Route path="/atualizar-senha" element={<AtualizarSenha />} />
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard"    element={<Dashboard />} />
            <Route path="/computadores" element={<Computadores />} />
            <Route path="/ajuda"        element={<Help />} />
            <Route path="/setores"      element={<Setores />} />

            {/* Usuário comum */}
            <Route path="/meus-chamados" element={<MeusChamados />} />
            <Route path="/novo-chamado"  element={<NovoChamado />} />
            <Route path="/agendamento"   element={<AgendamentoSalas />} /> 
            

            {/* Staff (admin + tecnico) */}
            <Route path="/manutencao" element={<RoleRoute allow={["admin","tecnico"]}><Manutencao /></RoleRoute>} />
            <Route path="/pecas"      element={<RoleRoute allow={["admin","tecnico"]}><Pecas /></RoleRoute>} />
            <Route path="/relatorios" element={<RoleRoute allow={["admin","tecnico"]}><Relatorios /></RoleRoute>} />
            <Route path="/chamados"         element={<RoleRoute allow={["admin","tecnico"]}><Chamados /></RoleRoute>} />
            <Route path="/chamados/novo"    element={<RoleRoute allow={["admin","tecnico"]}><ChamadoForm /></RoleRoute>} />
            <Route path="/chamados/:id"     element={<RoleRoute allow={["admin","tecnico"]}><ChamadoVisualizar /></RoleRoute>} />
            <Route path="/chamados/:id/editar" element={<RoleRoute allow={["admin","tecnico"]}><ChamadoForm /></RoleRoute>} />

            {/* Admin only */}
            <Route path="/configuracoes" element={<RoleRoute allow={["admin"]}><Settings /></RoleRoute>} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;