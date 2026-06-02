import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import logoEetepa from "@/assets/logo-eetepa.jpg";

const Login = () => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Estados para o modal "Esqueceu a senha"
  const [emailReset, setEmailReset] = useState("");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

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

  // Função para enviar e-mail de recuperação de senha
  const handleResetPassword = async () => {
    if (!emailReset) {
      toast.error("Digite seu e-mail");
      return;
    }

    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(emailReset, {
      redirectTo: `${window.location.origin}/atualizar-senha`,
    });
    setResetLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
      setResetDialogOpen(false);
      setEmailReset("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      {/* Card do formulário - centralizado */}
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-xl p-8 md:p-10">
          {/* Logo/Título */}
          <div className="mb-8 text-center">
            <img src={logoEetepa} alt="Logo EETEPA" className="h-16 w-auto mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-primary">
              EETEPA <span className="text-accent">SIGESTI</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Sistema Integrado De Gestão De TI
            </p>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
            Faça login
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="pl-10"
                required
              />
            </div>

            {/* Link Esqueceu a senha */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => setResetDialogOpen(true)}
                className="text-sm text-primary hover:underline"
              >
                Esqueceu a senha?
              </button>
            </div>

            <Button type="submit" className="w-full text-base py-5" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          {/* Rodapé */}
          <div className="mt-8 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              EETEPA Vilhena Alves · Governo do Pará
            </p>
          </div>
        </div>
      </div>

      {/* Modal do Esqueceu a senha */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recuperar senha</DialogTitle>
            <DialogDescription>
              Digite seu e-mail para receber o link de redefinição de senha.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="email"
              placeholder="seu-email@escola.com"
              value={emailReset}
              onChange={(e) => setEmailReset(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleResetPassword} disabled={resetLoading}>
              {resetLoading ? "Enviando..." : "Enviar link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;