import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Plus, ExternalLink, Users, TrendingUp, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import CyclePhaseTag from "@/components/CyclePhaseTag";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import logoFertile from "@/assets/logo-fertile.png";

const Index = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { hasCommunityAccess } = usePlanAccess();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const cycleDay = 14;
  const phase = "ovulatoria" as const;
  const habitsCompleted = 5;
  const habitsTotal = 8;
  const progressPercent = Math.round(habitsCompleted / habitsTotal * 100);

  const firstName = profile?.name?.split(" ")[0] || "Querida";

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-background px-5 pt-12 pb-6">
        <div className="mx-auto max-w-lg text-center">
          <img alt="Programa FÉRTILE" className="mx-auto mb-4 h-10 object-contain" src="/lovable-uploads/6f7a7c90-65d0-424c-9acc-17629830009a.png" />
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Olá, {firstName} 🌸
          </h1>
          <p className="mt-1 text-sm text-muted-foreground font-body">
            Que bom ter você aqui hoje.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-4 px-5 pt-5">
        {/* Cycle Card */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">Seu ciclo</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-display text-4xl font-bold text-primary">Dia {cycleDay}</span>
              </div>
              <div className="mt-2"><CyclePhaseTag phase={phase} /></div>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-primary/20 bg-primary/5">
              <CalendarDays className="h-7 w-7 text-primary" />
            </div>
          </div>
          <Button onClick={() => navigate("/diario")} className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90" size="sm">
            <Plus className="mr-2 h-4 w-4" />Registrar sintomas de hoje
          </Button>
        </div>

        {/* Habits Progress */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">Hábitos de hoje</p>
            <span className="text-xs font-bold text-primary font-body">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2.5 bg-muted" />
          <p className="mt-2 text-xs text-muted-foreground font-body">{habitsCompleted} de {habitsTotal} concluídos</p>
          <Button variant="outline" size="sm" className="mt-3 w-full border-primary/20 text-primary hover:bg-primary/5" onClick={() => navigate("/habitos")}>
            <TrendingUp className="mr-2 h-4 w-4" />Ver check-in
          </Button>
        </div>

        {/* Quick Access */}
        <div className="grid grid-cols-2 gap-3 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <button onClick={() => hasCommunityAccess ? navigate("/comunidade") : setShowUpgradeModal(true)} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 shadow-soft transition-all hover:shadow-card hover:border-primary/20">
            <Users className="h-6 w-6 text-primary" />
            <span className="text-xs font-semibold text-foreground font-body">Comunidade</span>
            {!hasCommunityAccess && <Lock className="h-3 w-3 text-muted-foreground" />}
          </button>
          <a href="https://kiwify.com" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 shadow-soft transition-all hover:shadow-card hover:border-primary/20">
            <ExternalLink className="h-6 w-6 text-primary" />
            <span className="text-xs font-semibold text-foreground font-body">Acessar Aulas</span>
          </a>
        </div>

        {/* Kiwify CTA */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary font-body mb-1">Conteúdo do Programa</p>
          <p className="text-sm text-foreground/80 font-body mb-3">Acesse suas aulas, materiais e protocolos na plataforma Kiwify.</p>
          <a href="https://kiwify.com" target="_blank" rel="noopener noreferrer">
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />Acessar Conteúdo do Programa
            </Button>
          </a>
        </div>

        <div className="py-4 text-center">
          <p className="text-xs text-muted-foreground font-body">© Nutricionista Laiane Paula · Todos os direitos reservados</p>
        </div>
      </div>

      {/* Upgrade Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="max-w-[90vw] sm:max-w-sm bg-card text-center p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-7 w-7 text-primary" />
            </div>
            <h2 className="font-display text-xl font-semibold text-foreground">Comunidade exclusiva</h2>
            <p className="text-sm text-muted-foreground font-body">
              A Comunidade Fertile é exclusiva para alunas dos planos Trimestral e Semestral. Faça o upgrade e conecte-se com outras mulheres nessa jornada. 🌸
            </p>
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => {setShowUpgradeModal(false);navigate("/planos");}}>
              Quero fazer upgrade
            </Button>
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setShowUpgradeModal(false)}>
              Agora não
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>);

};

export default Index;