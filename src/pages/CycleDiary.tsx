import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import logoFertile from "@/assets/logo-fertile.png";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import CyclePhaseTag, { type Phase } from "@/components/CyclePhaseTag";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const moodOptions = ["😊 Bem", "😐 Neutra", "😢 Triste", "😤 Irritada", "😰 Ansiosa"];
const energyOptions = ["⚡ Alta", "🔋 Média", "🪫 Baixa"];
const symptomOptions = [
  "Cólica", "Dor de cabeça", "Inchaço", "Sensibilidade nos seios",
  "Náusea", "Fadiga", "Insônia", "Muco cervical", "Spotting",
];

const CycleDiary = () => {
  const { user } = useAuth();
  const [cycleDay, setCycleDay] = useState(14);
  const [phase] = useState<Phase>("ovulatoria");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [mood, setMood] = useState<string>("");
  const [energy, setEnergy] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!user) return;
    supabase.from("cycle_journal").select("*").eq("user_id", user.id).eq("date", today).single().then(({ data }) => {
      if (data) {
        setCycleDay(data.cycle_day);
        setSelectedSymptoms(data.symptoms || []);
        setMood(data.mood || "");
        setEnergy(data.energy || "");
        setNotes(data.notes || "");
      }
    });
  }, [user, today]);

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      date: today,
      cycle_day: cycleDay,
      phase,
      symptoms: selectedSymptoms,
      mood: mood || null,
      energy: energy || null,
      notes: notes || null,
    };
    const { error } = await supabase.from("cycle_journal").upsert(payload, { onConflict: "user_id,date" });
    setSaving(false);
    if (error) toast.error("Erro ao salvar registro.");
    else toast.success("Registro salvo com sucesso! 🌸");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-background px-5 pt-12 pb-5">
        <div className="mx-auto max-w-lg text-center">
          <img src={logoFertile} alt="Programa FÉRTILE" className="mx-auto mb-4 h-10 object-contain" />
          <h1 className="font-display text-2xl font-semibold text-foreground">Diário do Ciclo</h1>
          <p className="mt-1 text-sm text-muted-foreground font-body">Registre como você está hoje</p>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-5 px-5 pt-5">
        {/* Day Selector */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-soft">
          <button onClick={() => setCycleDay(Math.max(1, cycleDay - 1))} className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <span className="font-display text-3xl font-bold text-primary">Dia {cycleDay}</span>
            <div className="mt-1.5"><CyclePhaseTag phase={phase} /></div>
          </div>
          <button onClick={() => setCycleDay(Math.min(35, cycleDay + 1))} className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Symptoms */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-soft animate-fade-in">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">Sintomas</p>
          <div className="flex flex-wrap gap-2">
            {symptomOptions.map((s) => (
              <button key={s} onClick={() => toggleSymptom(s)} className={`rounded-full border px-3 py-1.5 text-xs font-body transition-all ${selectedSymptoms.includes(s) ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border text-muted-foreground hover:border-primary/30"}`}>{s}</button>
            ))}
          </div>
        </div>

        {/* Mood */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-soft animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">Humor</p>
          <div className="flex flex-wrap gap-2">
            {moodOptions.map((m) => (
              <button key={m} onClick={() => setMood(m)} className={`rounded-full border px-3 py-1.5 text-xs font-body transition-all ${mood === m ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border text-muted-foreground hover:border-primary/30"}`}>{m}</button>
            ))}
          </div>
        </div>

        {/* Energy */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-soft animate-fade-in" style={{ animationDelay: "0.15s" }}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">Energia</p>
          <div className="flex gap-2">
            {energyOptions.map((e) => (
              <button key={e} onClick={() => setEnergy(e)} className={`flex-1 rounded-lg border px-3 py-2.5 text-xs font-body transition-all ${energy === e ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border text-muted-foreground hover:border-primary/30"}`}>{e}</button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-soft animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">Observações</p>
          <Textarea placeholder="Como você está se sentindo hoje?..." value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[80px] border-border bg-background font-body text-sm resize-none" />
        </div>

        <Button onClick={handleSave} className="w-full bg-primary text-primary-foreground hover:bg-primary/90" size="lg" disabled={saving}>
          <Save className="mr-2 h-4 w-4" />{saving ? "Salvando..." : "Salvar registro"}
        </Button>

        <div className="py-4 text-center">
          <p className="text-xs text-muted-foreground font-body">© Nutricionista Laiane Paula · Todos os direitos reservados</p>
        </div>
      </div>
    </div>
  );
};

export default CycleDiary;
