import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoFertile from "@/assets/logo-fertile.png";
import { ArrowLeft, ShoppingBag, Mail, Lock, CheckCircle, HelpCircle, AlertCircle } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [noPurchase, setNoPurchase] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNoPurchase(false);

    try {
      const { data, error } = await supabase.functions.invoke("activate-account", {
        body: { email: email.toLowerCase().trim(), password },
      });

      if (error) {
        // Edge function returned an error
        const body = data || {};
        if (body.error === "no_purchase") {
          setNoPurchase(true);
        } else {
          toast.error(body.message || "Erro ao ativar conta.");
        }
        setLoading(false);
        return;
      }

      // Account activated — now sign in
      toast.success("Conta ativada com sucesso! 🌸");

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (signInError) {
        toast.error("Conta ativada, mas houve erro ao entrar. Tente fazer login.");
        navigate("/login");
      } else {
        navigate("/");
      }
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-8 animate-fade-in">
        <div className="flex flex-col items-center">
          <img src={logoFertile} alt="Programa FÉRTILE" className="mb-6 h-16 object-contain" />
          <h1 className="font-display text-2xl font-semibold text-foreground">Ativar Conta</h1>
          <p className="mt-1 text-sm text-muted-foreground font-body text-center">
            Use o e-mail da sua compra para ativar seu acesso
          </p>
        </div>

        {noPurchase ? (
          <div className="space-y-5 animate-fade-in">
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5 text-center">
              <div className="flex justify-center mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
              </div>
              <p className="text-sm font-semibold text-foreground font-body mb-1">
                Compra não encontrada
              </p>
              <p className="text-sm text-muted-foreground font-body">
                Não encontramos uma compra associada a este e-mail. Para acessar o Programa FÉRTILE, realize sua compra primeiro. 🌸
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-soft space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">
                O que fazer?
              </p>
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <Mail className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground font-body">
                    <span className="font-semibold text-foreground">1.</span> Verifique se usou o mesmo e-mail da compra
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <HelpCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground font-body">
                    <span className="font-semibold text-foreground">2.</span> Confira se não há erros de digitação no e-mail
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground font-body">
                    <span className="font-semibold text-foreground">3.</span> Verifique se recebeu a confirmação da Kiwify
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <ShoppingBag className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground font-body">
                    <span className="font-semibold text-foreground">4.</span> Se precisar de ajuda, entre em contato pelo suporte
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => navigate("/planos")}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              Ver planos
            </Button>

            <button
              onClick={() => setNoPurchase(false)}
              className="flex w-full items-center justify-center gap-2 text-sm text-primary font-body hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Tentar outro e-mail
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">
                  E-mail da compra
                </Label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="font-body"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">
                  Crie sua senha
                </Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="font-body"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                size="lg"
                disabled={loading}
              >
                {loading ? "Verificando..." : "Ativar minha conta"}
              </Button>
            </form>

            <button
              onClick={() => navigate("/login")}
              className="flex w-full items-center justify-center gap-2 text-sm text-primary font-body hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Já tenho conta, entrar
            </button>
          </>
        )}

        <p className="text-center text-xs text-muted-foreground font-body">
          Ao entrar, você concorda com nossa{" "}
          <a href="#" className="text-primary underline">
            Política de Privacidade
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;
