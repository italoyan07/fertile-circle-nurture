import { useNavigate } from "react-router-dom";
import { Check, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import logoFertile from "@/assets/logo-fertile.png";

const plans = [
  {
    key: "mensal",
    name: "Mensal",
    price: "R$ 97/mês",
    features: ["Aulas e materiais", "Check-in diário", "Diário do ciclo"],
    highlight: false,
  },
  {
    key: "trimestral",
    name: "Trimestral",
    price: "R$ 247/tri",
    features: ["Tudo do Mensal", "Comunidade FÉRTILE", "Suporte prioritário"],
    highlight: true,
  },
  {
    key: "semestral",
    name: "Semestral",
    price: "R$ 397/sem",
    features: ["Tudo do Trimestral", "Aulas bônus", "Acompanhamento estendido"],
    highlight: false,
  },
];

const Planos = () => {
  const navigate = useNavigate();
  const { planType, isOwner } = usePlanAccess();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-background px-5 pt-12 pb-5">
        <div className="mx-auto max-w-lg text-center">
          <img src={logoFertile} alt="Programa FÉRTILE" className="mx-auto mb-4 h-10 object-contain" />
          <h1 className="font-display text-2xl font-semibold text-foreground">Planos</h1>
          <p className="mt-1 text-sm text-muted-foreground font-body">Escolha o melhor plano para você</p>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-4 px-5 pt-5">
        {isOwner && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
            <Crown className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary font-body">Acesso Proprietário</span>
          </div>
        )}

        {plans.map((plan) => {
          const isCurrent = planType === plan.key;
          return (
            <div
              key={plan.key}
              className={`rounded-xl border p-5 shadow-soft ${
                plan.highlight
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              {plan.highlight && (
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary font-body">Mais popular</p>
              )}
              <h3 className="font-display text-lg font-semibold text-foreground">{plan.name}</h3>
              <p className="mt-1 font-display text-2xl font-bold text-primary">{plan.price}</p>
              <ul className="mt-3 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground font-body">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-4 w-full"
                variant={isCurrent ? "outline" : "default"}
                disabled={isCurrent || isOwner}
              >
                {isOwner ? "[Modo proprietário]" : isCurrent ? "Plano atual" : "Selecionar"}
              </Button>
            </div>
          );
        })}

        <div className="py-4 text-center">
          <p className="text-xs text-muted-foreground font-body">© Nutricionista Laiane Paula · Todos os direitos reservados</p>
        </div>
      </div>
    </div>
  );
};

export default Planos;
