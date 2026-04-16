import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import loginIllustration from "@/assets/login-illustration.jpg";

const Login = () => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate("/dashboard");
  };

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/dashboard`,
    });
    if (result.error) toast.error(result.error.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <div className="bg-card rounded-2xl shadow-xl overflow-hidden flex max-w-4xl w-full">
        <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary">
              EETEPA <span className="text-accent">Gest</span>TI
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Gestão inteligente de computadores e manutenção
            </p>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-6">Faça login</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} className="pl-10" required />
            </div>
            <Button type="submit" className="w-full text-base py-5" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">ou</span></div>
          </div>

          <Button type="button" variant="outline" className="w-full" onClick={handleGoogle}>
            Entrar com Google
          </Button>

          <p className="text-sm text-muted-foreground text-center mt-4">
            Não tem conta? <Link to="/cadastro" className="text-primary hover:underline">Cadastre-se</Link>
          </p>

          <div className="mt-auto pt-8">
            <p className="text-xs text-muted-foreground text-center">
              EETEPA Vilhena Alves · Governo do Pará
            </p>
          </div>
        </div>

        <div className="hidden md:flex flex-1 items-center justify-center bg-secondary/50 p-8">
          <img src={loginIllustration} alt="Ilustração de gestão de TI" width={800} height={800} className="w-full max-w-sm object-contain" />
        </div>
      </div>
    </div>
  );
};

export default Login;
