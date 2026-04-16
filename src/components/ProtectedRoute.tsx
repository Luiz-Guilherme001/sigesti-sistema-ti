import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-muted-foreground text-sm">Carregando...</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  return children;
};

export default ProtectedRoute;
