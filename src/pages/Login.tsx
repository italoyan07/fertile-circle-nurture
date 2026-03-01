import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoFertile from "@/assets/logo-fertile.png";
import { ArrowLeft, AlertCircle, CheckCircle2, Mail, HelpCircle, MessageCircle } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isActivating, setIsActivating] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activationError, setActivationError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setActivationError(false);

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

    if (isActivating) {
      // Check if email has a provisioned profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", email)
        .maybeSingle();

      // Try to activate via edge function
      try {
        const { data, error } = await supabase.functions.invoke("activate-account", {
          body: { email, password },
        });

        if (error || data?.error) {
          setActivationError(true);
          setLoading(false);
          return;
        }

        toast.success("Conta ativada com sucesso! Faça login. 🌸");
        setIsActivating(false);
        setPassword("");
      } catch {
        setActivationError(true);
      }
      setLoading(false);
      return;
    }

    // Login
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error("E-mail ou senha incorretos.");
    else navigate("/");
    setLoading(false);
  };

  const title = isForgotPassword
    ? "Redefinir Senha"
    : isActivating
    ? "Ativar Conta"
    : "Bem-vinda";

  const subtitle = isForgotPassword
    ? "Informe seu e-mail para receber o link de redefinição"
    : isActivating
    ? "Defina sua senha para acessar o Programa FÉRTILE"
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
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">E-mail</Label>
            <Input type="email" placeholder="seu@email.com" value={email} onChange={(e) => { setEmail(e.target.value); setActivationError(false); }} required className="font-body" />
          </div>
          {!isForgotPassword && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">
                {isActivating ? "Defina sua senha" : "Senha"}
              </Label>
              <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="font-body" />
            </div>
          )}

          {/* Activation error guidance card */}
          {activationError && isActivating && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3 animate-fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                <p className="text-sm font-semibold text-foreground font-body">
                  E-mail não encontrado
                </p>
              </div>
              <p className="text-xs text-muted-foreground font-body">
                Não encontramos uma compra vinculada a este e-mail. Siga os passos abaixo:
              </p>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-foreground/80 font-body">
                    <strong>1.</strong> Verifique se usou o mesmo e-mail da compra
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-foreground/80 font-body">
                    <strong>2.</strong> Confira se não há erros de digitação
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <HelpCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-foreground/80 font-body">
                    <strong>3.</strong> Verifique a confirmação da Kiwify no seu e-mail
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <MessageCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-foreground/80 font-body">
                    <strong>4.</strong> Entre em contato pelo WhatsApp para suporte
                  </p>
                </div>
              </div>
            </div>
          )}

          {!isActivating && !isForgotPassword && (
            <button type="button" onClick={() => setIsForgotPassword(true)} className="block w-full text-right text-xs text-primary font-body hover:underline">
              Esqueceu sua senha?
            </button>
          )}

          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" size="lg" disabled={loading}>
            {loading ? "Aguarde..." : isForgotPassword ? "Enviar link de redefinição" : isActivating ? "Ativar Conta" : "Entrar"}
          </Button>
        </form>

        {isForgotPassword ? (
          <button onClick={() => setIsForgotPassword(false)} className="flex w-full items-center justify-center gap-2 text-sm text-primary font-body hover:underline">
            <ArrowLeft className="h-4 w-4" />Voltar ao login
          </button>
        ) : isActivating ? (
          <button onClick={() => { setIsActivating(false); setActivationError(false); }} className="flex w-full items-center justify-center gap-2 text-sm text-primary font-body hover:underline">
            <ArrowLeft className="h-4 w-4" />Voltar ao login
          </button>
        ) : (
          <button onClick={() => setIsActivating(true)} className="w-full text-center text-sm text-primary font-body hover:underline">
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
