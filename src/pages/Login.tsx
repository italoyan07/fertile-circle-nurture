import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logoFertile from "@/assets/logo-fertile.png";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-8 animate-fade-in">
        <div className="flex flex-col items-center">
          <img src={logoFertile} alt="Programa FÉRTILE" className="mb-6 h-16 object-contain" />
          <h1 className="font-display text-2xl font-semibold text-foreground">Bem-vinda</h1>
          <p className="mt-1 text-sm text-muted-foreground font-body">
            Acesse sua conta do Programa FÉRTILE
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">
              E-mail
            </Label>
            <Input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="font-body"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">
              Senha
            </Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="font-body"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            size="lg"
          >
            Entrar
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground font-body">
          Ao entrar, você concorda com nossa{" "}
          <a href="#" className="text-primary underline">Política de Privacidade</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
