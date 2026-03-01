import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoFertile from "@/assets/logo-fertile.png";
import { ArrowLeft } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isForgotPassword) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setLoading(false);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("E-mail de redefinição enviado! Verifique sua caixa de entrada. 📩");
        setIsForgotPassword(false);
      }
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error("E-mail ou senha incorretos.");
    else navigate("/");
    setLoading(false);
  };

  const title = isForgotPassword ? "Redefinir Senha" : "Bem-vinda";
  const subtitle = isForgotPassword
    ? "Informe seu e-mail para receber o link de redefinição"
    : "Acesse sua conta do Programa FÉRTILE";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-8 animate-fade-in">
        <div className="flex flex-col items-center">
          <img src={logoFertile} alt="Programa FÉRTILE" className="mb-6 h-16 object-contain" />
          <h1 className="font-display text-2xl font-semibold text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground font-body text-center">{subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && !isForgotPassword && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">Nome</Label>
              <Input type="text" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} required className="font-body" />
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">E-mail</Label>
            <Input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="font-body" />
          </div>
          {!isForgotPassword && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">Senha</Label>
              <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="font-body" />
            </div>
          )}

          {!isSignUp && !isForgotPassword && (
            <button type="button" onClick={() => setIsForgotPassword(true)} className="block w-full text-right text-xs text-primary font-body hover:underline">
              Esqueceu sua senha?
            </button>
          )}

          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" size="lg" disabled={loading}>
            {loading ? "Aguarde..." : isForgotPassword ? "Enviar link de redefinição" : isSignUp ? "Criar Conta" : "Entrar"}
          </Button>
        </form>

        {isForgotPassword ? (
          <button onClick={() => setIsForgotPassword(false)} className="flex w-full items-center justify-center gap-2 text-sm text-primary font-body hover:underline">
            <ArrowLeft className="h-4 w-4" />Voltar ao login
          </button>
        ) : (
          <button onClick={() => navigate("/register")} className="w-full text-center text-sm text-primary font-body hover:underline">
            Comprou o programa? Ativar conta
          </button>
        )}

        <p className="text-center text-xs text-muted-foreground font-body">
          Ao entrar, você concorda com nossa{" "}
          <a href="#" className="text-primary underline">Política de Privacidade</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
