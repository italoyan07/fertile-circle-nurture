import { useNavigate } from "react-router-dom";
import { Check, Gem, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import logoFertile from "@/assets/logo-fertile.png";

const PLAN_RANK: Record<string, number> = { mensal: 1, trimestral: 2, semestral: 3 };

const plans = [
{
  key: "mensal",
  name: "Plano Mensal",
  price: "R$ 197/mês",
  tagline: "Ideal para o primeiro passo.",
  features: [
  "Formulário Clínico Individual",
  "Plano Alimentar Personalizado",
  "Prescrição de Suplementos",
  "30 dias de suporte via WhatsApp"],

  border: "border-border",
  bg: "bg-card",
  url: null,
  cta: ""
},
{
  key: "trimestral",
  name: "Plano Trimestral",
  price: "R$ 297",
  tagline: "O tempo necessário para a maturação dos óvulos.",
  features: [
  "Tudo do Plano Mensal",
  "Ajustes no plano e suplementação ao longo dos 3 meses",
  "Avaliação de Exames Laboratoriais",
  "Acesso à Comunidade FÉRTILE e Clube de Benefícios",
  "90 dias de suporte via WhatsApp"],

  border: "border-primary/40",
  bg: "bg-primary/5",
  url: "https://pay.kiwify.com.br/Rdsk1IA",
  cta: "Preparar meu corpo em 90 dias"
},
{
  key: "semestral",
  name: "Plano Semestral",
  price: "R$ 497",
  tagline: "O acompanhamento de elite para casos complexos e casais.",
  features: [
  "Tudo do Plano Trimestral",
  "Foco total em FIV (preparação, coleta e transferência)",
  "Aconselhamento e Plano para o Parceiro",
  "Suporte em casos de perdas gestacionais",
  "6 meses de acompanhamento e suporte total"],

  border: "border-[#5b8e9e]/40",
  bg: "bg-[#5b8e9e]/10",
  url: "https://pay.kiwify.com.br/cBeT54f",
  cta: "Quero a estratégia mais completa"
}];


const Planos = () => {
  const navigate = useNavigate();
  const { planType, isOwner } = usePlanAccess();
  const currentRank = PLAN_RANK[planType] || 1;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-background px-5 pt-12 pb-5">
        <div className="mx-auto max-w-lg text-center">
          <img alt="Programa FÉRTILE" className="mx-auto mb-4 h-10 object-contain" src="/lovable-uploads/90e6bb47-98dd-49b6-8365-b87b0b668b7a.png" />
          <h1 className="font-display text-2xl font-semibold text-foreground">Meu Plano</h1>
          <p className="mt-1 text-sm text-muted-foreground font-body">Escolha o melhor plano para sua jornada</p>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-4 px-5 pt-5">
        {plans.map((plan) => {
          const rank = PLAN_RANK[plan.key];
          const isCurrent = planType === plan.key;
          const isLower = rank < currentRank;
          const isUpgrade = rank > currentRank;

          return (
            <div
              key={plan.key}
              className={`rounded-xl border p-5 shadow-soft transition-all ${plan.border} ${plan.bg} ${isLower ? "opacity-50" : ""}`}>

              <div className="flex items-center justify-between mb-2">
                <Gem className={`h-6 w-6 ${isCurrent ? "text-primary" : isLower ? "text-muted-foreground" : "text-primary/70"}`} />
                {isCurrent &&
                <span className="bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-semibold">
                    Seu plano atual
                  </span>
                }
                {isLower &&
                <span className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-semibold">
                    Já incluído
                  </span>
                }
              </div>

              <h3 className="font-display text-lg font-semibold text-foreground">{plan.name}</h3>
              <p className="font-display text-2xl font-bold text-primary mt-1">{plan.price}</p>
              <p className="text-sm text-muted-foreground font-body mt-1 mb-3">{plan.tagline}</p>

              <ul className="space-y-2 mb-4">
                {plan.features.map((f) =>
                <li key={f} className="flex items-start gap-2 text-sm text-foreground/80 font-body">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    {f}
                  </li>
                )}
              </ul>

              {isUpgrade && plan.url &&
              <a href={plan.url} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    {plan.cta}
                  </Button>
                </a>
              }
              {isCurrent &&
              <Button className="w-full" variant="outline" disabled>
                  Plano atual
                </Button>
              }
            </div>);

        })}

        {isOwner &&
        <div className="flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
            <Gem className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary font-body">Acesso Proprietário — todos os recursos liberados</span>
          </div>
        }

        <div className="py-4 text-center">
          <p className="text-xs text-muted-foreground font-body">© Nutricionista Laiane Paula · Todos os direitos reservados</p>
        </div>
      </div>
    </div>);

};

export default Planos;