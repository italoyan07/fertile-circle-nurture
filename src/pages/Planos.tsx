import { Crown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import logoFertile from "@/assets/logo-fertile.png";

const plans = [
  {
    name: "Mensal",
    price: "R$ 97",
    period: "/mês",
    features: [
      "Acesso a todas as aulas",
      "Diário do ciclo",
      "Check-in de hábitos",
      "Comunidade",
      "Materiais de apoio",
    ],
    link: "https://kiwify.com",
    highlight: false,
  },
  {
    name: "Trimestral",
    price: "R$ 247",
    period: "/3 meses",
    features: [
      "Tudo do plano Mensal",
      "Economia de 15%",
      "Suporte prioritário via WhatsApp",
      "Plano alimentar personalizado",
    ],
    link: "https://kiwify.com",
    highlight: true,
  },
  {
    name: "Semestral",
    price: "R$ 447",
    period: "/6 meses",
    features: [
      "Tudo do plano Trimestral",
      "Economia de 23%",
      "Consulta individual online",
      "Acesso antecipado a novos conteúdos",
    ],
    link: "https://kiwify.com",
    highlight: false,
  },
];

const Planos = () => {
  const { planType, isOwner, loading } = usePlanAccess();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground font-body">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="mx-auto max-w-lg flex items-center justify-center gap-3 px-4 py-3">
          <img src={logoFertile} alt="FÉRTILE" className="h-8 w-8 rounded-full object-cover" />
          <h1 className="font-display text-xl font-semibold text-foreground">Planos</h1>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-6 space-y-4">
        {/* Owner Badge */}
        {isOwner && (
          <div className="rounded-xl border border-[#5b8e9e]/30 bg-[#5b8e9e]/10 p-4 animate-fade-in">
            <div className="flex items-center gap-3 mb-2">
              <Crown className="h-5 w-5 text-[#5b8e9e] shrink-0" />
              <Badge className="bg-[#5b8e9e] text-white rounded-full">
                Acesso Proprietário
              </Badge>
            </div>
            <p className="text-sm text-foreground/80 font-body">
              Você tem acesso vitalício ao Programa FÉRTILE. Os planos abaixo são exibidos para fins de visualização e moderação. 🌸
            </p>
          </div>
        )}

        {/* Plan Cards */}
        {plans.map((plan) => {
          const isCurrent = planType === plan.name.toLowerCase() && !isOwner;

          return (
            <div
              key={plan.name}
              className={`rounded-xl border p-5 shadow-soft animate-fade-in ${
                plan.highlight
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              {plan.highlight && (
                <Badge className="mb-3 bg-primary text-primary-foreground text-[10px]">
                  Mais popular
                </Badge>
              )}
              <h3 className="font-display text-xl font-semibold text-foreground">
                {plan.name}
              </h3>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-display text-3xl font-bold text-primary">
                  {plan.price}
                </span>
                <span className="text-sm text-muted-foreground font-body">
                  {plan.period}
                </span>
              </div>
              <ul className="mt-4 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-foreground/80 font-body">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                {isCurrent ? (
                  <Button className="w-full" variant="outline" disabled>
                    Plano atual
                  </Button>
                ) : (
                  <div className="space-y-1">
                    <Button
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => window.open(plan.link, "_blank")}
                    >
                      {isOwner ? "Visualizar" : "Escolher plano"}
                    </Button>
                    {isOwner && (
                      <p className="text-xs text-muted-foreground text-center font-body">
                        [Modo proprietário]
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Footer */}
        <div className="pt-8 pb-4 text-center">
          <p className="text-xs text-muted-foreground font-body">
            © Nutricionista Laiane Paula · Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  );
};

export default Planos;
