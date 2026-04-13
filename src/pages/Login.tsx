import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import loginIllustration from "@/assets/login-illustration.jpg";

const Login = () => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <div className="bg-card rounded-2xl shadow-xl overflow-hidden flex max-w-4xl w-full">
        {/* Left - Form */}
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
              <Input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
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
              />
            </div>
            <Button type="submit" className="w-full text-base py-5">
              Entrar
            </Button>
          </form>

          <button className="text-primary text-sm mt-4 hover:underline">
            Esqueci minha senha
          </button>

          <div className="mt-auto pt-8">
            <p className="text-xs text-muted-foreground text-center">
              EETEPA Vilhena Alves · Governo do Pará
            </p>
          </div>
        </div>

        {/* Right - Illustration */}
        <div className="hidden md:flex flex-1 items-center justify-center bg-secondary/50 p-8">
          <img
            src={loginIllustration}
            alt="Ilustração de gestão de TI"
            width={800}
            height={800}
            className="w-full max-w-sm object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
