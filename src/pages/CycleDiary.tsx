import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Save, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import CyclePhaseTag, { type Phase } from "@/components/CyclePhaseTag";
import { useAuth } from "@/contexts/AuthContext";
import { useCycleConfig } from "@/hooks/useCycleConfig";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const moodOptions = ["😊 Bem", "😐 Neutra", "😢 Triste", "😤 Irritada", "😰 Ansiosa"];
const energyOptions = ["⚡ Alta", "🔋 Média", "🪫 Baixa"];
const symptomOptions = [
  "Cólica", "Dor de cabeça", "Inchaço", "Sensibilidade nos seios",
  "Náusea", "Fadiga", "Insônia", "Muco cervical", "Spotting",
];

const PAGE_SIZE = 10;

interface JournalEntry {
  id: string;
  date: string;
  cycle_day: number;
  phase: string;
  symptoms: string[] | null;
  mood: string | null;
  energy: string | null;
  notes: string | null;
}

const CycleDiary = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loading: cycleLoading, config, cycleDay, phase } = useCycleConfig();

  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [mood, setMood] = useState<string>("");
  const [energy, setEnergy] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // History
  const [history, setHistory] = useState<JournalEntry[]>([]);
  const [historyPage, setHistoryPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  const today = new Date().toISOString().split("T")[0];

  // Fetch today's entry
  useEffect(() => {
    if (!user) return;
    supabase
      .from("cycle_journal")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .single()
      .then(({ data }) => {
        if (data) {
          setSelectedSymptoms(data.symptoms || []);
          setMood(data.mood || "");
          setEnergy(data.energy || "");
          setNotes(data.notes || "");
        }
      });
  }, [user, today]);

  // Fetch history
  const fetchHistory = async (page: number) => {
    if (!user) return;
    const from = page * PAGE_SIZE;
    const { data } = await supabase
      .from("cycle_journal")
      .select("id, date, cycle_day, phase, symptoms, mood, energy, notes")
      .eq("user_id", user.id)
      .neq("date", today)
      .order("date", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (data) {
      if (page === 0) {
        setHistory(data as JournalEntry[]);
      } else {
        setHistory((prev) => [...prev, ...(data as JournalEntry[])]);
      }
      setHasMore(data.length === PAGE_SIZE);
    }
  };

  useEffect(() => {
    fetchHistory(0);
  }, [user]);

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handleSave = async () => {
    if (!user || !cycleDay || !phase) return;
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
    const { error } = await supabase
      .from("cycle_journal")
      .upsert(payload, { onConflict: "user_id,date" });
    setSaving(false);
    if (error) toast.error("Erro ao salvar registro.");
    else {
      toast.success("Registro salvo com sucesso! 🌸");
      fetchHistory(0);
      setHistoryPage(0);
    }
  };

  const toggleNoteExpand = (id: string) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const loadMore = () => {
    const nextPage = historyPage + 1;
    setHistoryPage(nextPage);
    fetchHistory(nextPage);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-background px-5 pt-12 pb-5">
        <div className="mx-auto max-w-lg text-center">
          <img
            alt="Programa FÉRTILE"
            className="mx-auto mb-4 h-10 object-contain"
            src="/lovable-uploads/635d5d10-72e5-4a7e-86e8-ca016cccf023.png"
          />
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Diário do Ciclo
          </h1>
          <p className="mt-1 text-sm text-muted-foreground font-body">
            Registre como você está hoje
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-5 px-5 pt-5">
        {/* Day & Phase from cycle_config */}
        {cycleLoading ? (
          <div className="rounded-xl border border-border bg-card p-4 shadow-soft text-center">
            <p className="text-sm text-muted-foreground font-body">Carregando...</p>
          </div>
        ) : config && cycleDay && phase ? (
          <div className="flex items-center justify-center rounded-xl border border-border bg-card p-4 shadow-soft">
            <div className="text-center">
              <span className="font-display text-3xl font-bold text-primary">
                Dia {cycleDay}
              </span>
              <div className="mt-1.5">
                <CyclePhaseTag phase={phase} />
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-5 shadow-soft text-center">
            <p className="text-sm text-muted-foreground font-body mb-3">
              Configure seu ciclo na Home para ver seu dia atual
            </p>
            <Button
              onClick={() => navigate("/")}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              size="sm"
            >
              Ir para a Home
            </Button>
          </div>
        )}

        {/* Symptoms */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-soft animate-fade-in">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">
            Sintomas
          </p>
          <div className="flex flex-wrap gap-2">
            {symptomOptions.map((s) => (
              <button
                key={s}
                onClick={() => toggleSymptom(s)}
                className={`rounded-full border px-3 py-1.5 text-xs font-body transition-all ${
                  selectedSymptoms.includes(s)
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Mood */}
        <div
          className="rounded-xl border border-border bg-card p-4 shadow-soft animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">
            Humor
          </p>
          <div className="flex flex-wrap gap-2">
            {moodOptions.map((m) => (
              <button
                key={m}
                onClick={() => setMood(m)}
                className={`rounded-full border px-3 py-1.5 text-xs font-body transition-all ${
                  mood === m
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Energy */}
        <div
          className="rounded-xl border border-border bg-card p-4 shadow-soft animate-fade-in"
          style={{ animationDelay: "0.15s" }}
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">
            Energia
          </p>
          <div className="flex gap-2">
            {energyOptions.map((e) => (
              <button
                key={e}
                onClick={() => setEnergy(e)}
                className={`flex-1 rounded-lg border px-3 py-2.5 text-xs font-body transition-all ${
                  energy === e
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div
          className="rounded-xl border border-border bg-card p-4 shadow-soft animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">
            Observações
          </p>
          <Textarea
            placeholder="Como você está se sentindo hoje?..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[80px] border-border bg-background font-body text-sm resize-none"
          />
        </div>

        <Button
          onClick={handleSave}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          size="lg"
          disabled={saving || !cycleDay}
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Salvando..." : "Salvar registro"}
        </Button>

        {/* History Section */}
        {history.length > 0 && (
          <div className="space-y-3 animate-fade-in">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">
              Histórico do Diário
            </p>
            {history.map((entry) => {
              const isExpanded = expandedNotes.has(entry.id);
              const entryPhase = (["menstrual", "folicular", "ovulatoria", "lutea"].includes(entry.phase)
                ? entry.phase
                : "folicular") as Phase;
              return (
                <div
                  key={entry.id}
                  className="rounded-xl border border-border bg-card p-4 shadow-soft"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground font-body">
                        {format(new Date(entry.date + "T12:00:00"), "dd 'de' MMM", { locale: ptBR })}
                      </span>
                      <span className="text-xs text-muted-foreground font-body">
                        Dia {entry.cycle_day}
                      </span>
                    </div>
                    <CyclePhaseTag phase={entryPhase} size="sm" />
                  </div>

                  {/* Symptoms */}
                  {entry.symptoms && entry.symptoms.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {entry.symptoms.map((s) => (
                        <span
                          key={s}
                          className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground font-body"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Mood & Energy */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-body">
                    {entry.mood && <span>{entry.mood}</span>}
                    {entry.energy && <span>{entry.energy}</span>}
                  </div>

                  {/* Notes */}
                  {entry.notes && (
                    <div className="mt-2">
                      <p
                        className={`text-xs text-foreground/80 font-body ${
                          !isExpanded ? "line-clamp-2" : ""
                        }`}
                      >
                        {entry.notes}
                      </p>
                      {entry.notes.length > 100 && (
                        <button
                          onClick={() => toggleNoteExpand(entry.id)}
                          className="flex items-center gap-0.5 text-[10px] text-primary font-semibold font-body mt-1 hover:underline"
                        >
                          {isExpanded ? (
                            <>
                              Menos <ChevronUp className="h-3 w-3" />
                            </>
                          ) : (
                            <>
                              Ver mais <ChevronDown className="h-3 w-3" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {hasMore && (
              <Button
                variant="outline"
                size="sm"
                className="w-full border-primary/20 text-primary hover:bg-primary/5"
                onClick={loadMore}
              >
                Ver mais registros
              </Button>
            )}
          </div>
        )}

        <div className="py-4 text-center">
          <p className="text-xs text-muted-foreground font-body">
            © Nutricionista Laiane Paula · Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  );
};

export default CycleDiary;
