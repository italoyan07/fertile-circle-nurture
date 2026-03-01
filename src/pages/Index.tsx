import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Plus, Users, TrendingUp, Lock, BookOpen, Clipboard, Settings, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CyclePhaseTag from "@/components/CyclePhaseTag";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import { useCycleConfig } from "@/hooks/useCycleConfig";
import { supabase } from "@/integrations/supabase/client";

const TOTAL_HABITS = 8;

const Index = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { hasCommunityAccess, isGrace, graceDaysLeft } = usePlanAccess();
  const { loading: cycleLoading, config, cycleDay, phase, saveConfig } = useCycleConfig();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCycleSetup, setShowCycleSetup] = useState(false);
  const [setupDate, setSetupDate] = useState<Date | undefined>(undefined);
  const [setupLength, setSetupLength] = useState(28);
  const [saving, setSaving] = useState(false);
  const [showExpiryWarning, setShowExpiryWarning] = useState(false);
  const [expiryDays, setExpiryDays] = useState(0);

  // Real habits data
  const [habitsCompleted, setHabitsCompleted] = useState(0);
  const today = new Date().toISOString().split("T")[0];

  const fetchHabits = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("daily_checkin")
      .select("habits")
      .eq("user_id", user.id)
      .eq("date", today)
      .single();
    if (data?.habits && typeof data.habits === "object" && !Array.isArray(data.habits)) {
      const count = Object.values(data.habits as Record<string, boolean>).filter(Boolean).length;
      setHabitsCompleted(count);
    } else {
      setHabitsCompleted(0);
    }
  }, [user, today]);

  useEffect(() => { fetchHabits(); }, [fetchHabits]);

  // Realtime subscription for habits
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("home-habits")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "daily_checkin",
        filter: `user_id=eq.${user.id}`,
      }, () => { fetchHabits(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchHabits]);

  // Expiry warning check
  useEffect(() => {
    if (!user) return;
    const checkWarning = async () => {
      const shownKey = `expiry_warning_shown_${today}`;
      if (sessionStorage.getItem(shownKey)) return;

      const { data } = await supabase
        .from("notifications")
        .select("id, message")
        .eq("user_id", user.id)
        .eq("type", "expiry_warning")
        .eq("read", false)
        .order("created_at", { ascending: false })
        .limit(1);

      if (data?.length) {
        const match = data[0].message.match(/(\d+) dias/);
        setExpiryDays(match ? parseInt(match[1]) : 10);
        setShowExpiryWarning(true);
        sessionStorage.setItem(shownKey, "1");
      }
    };
    checkWarning();
  }, [user, today]);

  const dismissWarning = async () => {
    setShowExpiryWarning(false);
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("type", "expiry_warning")
      .eq("read", false);
  };

  const progressPercent = Math.round((habitsCompleted / TOTAL_HABITS) * 100);
  const firstName = profile?.name?.split(" ")[0] || "Querida";

  const handleSaveCycle = async () => {
    if (!setupDate) return;
    setSaving(true);
    try {
      await saveConfig(format(setupDate, "yyyy-MM-dd"), setupLength);
      setShowCycleSetup(false);
    } finally {
      setSaving(false);
    }
  };

  const openSetupWithDefaults = () => {
    if (config) {
      setSetupDate(new Date(config.last_period_date + "T12:00:00"));
      setSetupLength(config.cycle_length);
    } else {
      setSetupDate(undefined);
      setSetupLength(28);
    }
    setShowCycleSetup(true);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-background px-5 pt-12 pb-6">
        <div className="mx-auto max-w-lg text-center">
          <img alt="Programa FÉRTILE" className="mx-auto mb-4 h-10 object-contain" src="/lovable-uploads/6f7a7c90-65d0-424c-9acc-17629830009a.png" />
          <h1 className="font-display text-2xl font-semibold text-foreground">Olá, {firstName} 🌸</h1>
          <p className="mt-1 text-sm text-muted-foreground font-body">Que bom ter você aqui hoje.</p>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-4 px-5 pt-5">
        {/* Grace Period Banner */}
        {isGrace && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 animate-fade-in">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800 font-body">
                Seu plano venceu. Você tem {graceDaysLeft ?? 0} dia(s) para renovar e manter seu histórico.
              </p>
            </div>
            <Button size="sm" className="shrink-0 bg-amber-600 text-white hover:bg-amber-700" onClick={() => navigate("/planos")}>
              Renovar
            </Button>
          </div>
        )}

        {/* Cycle Card */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft animate-fade-in">
          {cycleLoading ? (
            <p className="text-sm text-muted-foreground font-body">Carregando...</p>
          ) : config && cycleDay && phase ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">Seu ciclo</p>
                    <button onClick={openSetupWithDefaults} className="text-muted-foreground hover:text-primary transition-colors">
                      <Settings className="h-3.5 w-3.5" />
                    </button>
                  </div>
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
            </>
          ) : (
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-primary/20 bg-primary/5">
                  <CalendarDays className="h-7 w-7 text-primary" />
                </div>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body mb-1">Seu ciclo</p>
              <p className="text-sm text-muted-foreground font-body mb-4">Configure seu ciclo para acompanhar sua fase atual</p>
              <Button onClick={openSetupWithDefaults} className="w-full bg-primary text-primary-foreground hover:bg-primary/90" size="sm">
                <Settings className="mr-2 h-4 w-4" />Configurar agora
              </Button>
            </div>
          )}
        </div>

        {/* Habits Progress */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">Hábitos de hoje</p>
            <span className="text-xs font-bold text-primary font-body">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2.5 bg-muted" />
          <p className="mt-2 text-xs text-muted-foreground font-body">{habitsCompleted} de {TOTAL_HABITS} concluídos</p>
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
          <button onClick={() => navigate("/conteudo")} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 shadow-soft transition-all hover:shadow-card hover:border-primary/20">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-xs font-semibold text-foreground font-body">Conteúdo do Programa</span>
          </button>
        </div>

        {/* Diagnostic Form */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <div className="flex items-center gap-3 mb-2">
            <Clipboard className="h-6 w-6 text-primary shrink-0" />
            <h3 className="font-display text-base font-semibold text-foreground">Formulário de Diagnóstico</h3>
          </div>
          <p className="text-sm text-muted-foreground font-body mb-3">Preencha seu diagnóstico inicial e nos ajude a personalizar sua jornada 🌸</p>
          <a href="https://forms.google.com" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="w-full border-primary/20 text-primary hover:bg-primary/5">Preencher agora</Button>
          </a>
        </div>

        <div className="py-4 text-center">
          <p className="text-xs text-muted-foreground font-body">© Nutricionista Laiane Paula · Todos os direitos reservados</p>
        </div>
      </div>

      {/* Cycle Setup Modal */}
      <Dialog open={showCycleSetup} onOpenChange={setShowCycleSetup}>
        <DialogContent className="max-w-[90vw] sm:max-w-sm bg-card p-6">
          <div className="flex flex-col gap-4">
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <CalendarDays className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h2 className="font-display text-xl font-semibold text-foreground">Configurar ciclo</h2>
              <p className="mt-1 text-sm text-muted-foreground font-body">Informe os dados do seu ciclo menstrual</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground font-body">Quando começou sua última menstruação?</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal font-body", !setupDate && "text-muted-foreground")}>
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {setupDate ? format(setupDate, "dd/MM/yyyy") : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={setupDate} onSelect={setSetupDate} disabled={(date) => date > new Date()} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground font-body">Quantos dias dura seu ciclo normalmente?</Label>
                <Input type="number" min={20} max={45} value={setupLength} onChange={(e) => setSetupLength(Number(e.target.value))} className="font-body" />
              </div>
            </div>
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSaveCycle} disabled={!setupDate || saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expiry Warning Modal */}
      <Dialog open={showExpiryWarning} onOpenChange={setShowExpiryWarning}>
        <DialogContent className="max-w-[90vw] sm:max-w-sm bg-card text-center p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <CalendarDays className="h-7 w-7 text-primary" />
            </div>
            <h2 className="font-display text-xl font-semibold text-foreground">Seu acesso está se encerrando</h2>
            <p className="text-sm text-muted-foreground font-body">
              Seu plano vence em {expiryDays} dias. Renove agora para continuar sua jornada e não perder seu histórico. 🌸
            </p>
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => { setShowExpiryWarning(false); navigate("/planos"); }}>
              Renovar agora
            </Button>
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={dismissWarning}>
              Lembrar depois
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => { setShowUpgradeModal(false); navigate("/planos"); }}>
              Quero fazer upgrade
            </Button>
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setShowUpgradeModal(false)}>
              Agora não
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
