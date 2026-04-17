import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

type Role = "admin" | "tecnico" | "usuario";

const RoleRoute = ({ children, allow }: { children: JSX.Element; allow: Role[] }) => {
  const { user, roles, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-muted-foreground text-sm">Carregando...</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  if (!roles.some((r) => allow.includes(r))) return <Navigate to="/dashboard" replace />;
  return children;
};

export default RoleRoute;
