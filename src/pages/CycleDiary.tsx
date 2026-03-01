import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Save, ChevronDown, ChevronUp, Pencil, Check } from "lucide-react";
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
  const formRef = useRef<HTMLDivElement>(null);

  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [mood, setMood] = useState<string>("");
  const [energy, setEnergy] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit mode state
  const [existingEntryId, setExistingEntryId] = useState<string | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setExistingEntryId(data.id);
          setSelectedSymptoms(data.symptoms || []);
          setMood(data.mood || "");
          setEnergy(data.energy || "");
          setNotes(data.notes || "");
          setIsReadOnly(true);
          setEditingDate(null);
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
    if (isReadOnly) return;
    setSelectedSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handleSave = async () => {
    if (!user || !cycleDay || !phase) return;
    setSaving(true);

    const entryId = editingEntryId || existingEntryId;

    if (entryId && isEditing) {
      // UPDATE existing entry
      const { error } = await supabase
        .from("cycle_journal")
        .update({
          symptoms: selectedSymptoms,
          mood: mood || null,
          energy: energy || null,
          notes: notes || null,
        })
        .eq("id", entryId)
        .eq("user_id", user.id);
      setSaving(false);
      if (error) {
        toast.error("Erro ao atualizar registro.");
      } else {
        toast.success("Registro atualizado! 🌸");
        setIsReadOnly(true);
        setIsEditing(false);
        // If editing a history entry, reset to today
        if (editingEntryId && editingEntryId !== existingEntryId) {
          resetToToday();
        }
        fetchHistory(0);
        setHistoryPage(0);
      }
    } else {
      // INSERT new entry
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
      const { data, error } = await supabase
        .from("cycle_journal")
        .upsert(payload, { onConflict: "user_id,date" })
        .select("id")
        .maybeSingle();
      setSaving(false);
      if (error) {
        toast.error("Erro ao salvar registro.");
      } else {
        toast.success("Registro salvo com sucesso! 🌸");
        if (data) setExistingEntryId(data.id);
        setIsReadOnly(true);
        setIsEditing(false);
        fetchHistory(0);
        setHistoryPage(0);
      }
    }
  };

  const handleEdit = () => {
    setIsReadOnly(false);
    setIsEditing(true);
  };

  const resetToToday = () => {
    // Reload today's entry
    if (!user) return;
    setEditingEntryId(null);
    setEditingDate(null);
    supabase
      .from("cycle_journal")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setExistingEntryId(data.id);
          setSelectedSymptoms(data.symptoms || []);
          setMood(data.mood || "");
          setEnergy(data.energy || "");
          setNotes(data.notes || "");
          setIsReadOnly(true);
          setIsEditing(false);
        } else {
          setExistingEntryId(null);
          setSelectedSymptoms([]);
          setMood("");
          setEnergy("");
          setNotes("");
          setIsReadOnly(false);
          setIsEditing(false);
        }
      });
  };

  const handleEditHistory = (entry: JournalEntry) => {
    setEditingEntryId(entry.id);
    setEditingDate(entry.date);
    setSelectedSymptoms(entry.symptoms || []);
    setMood(entry.mood || "");
    setEnergy(entry.energy || "");
    setNotes(entry.notes || "");
    setIsReadOnly(false);
    setIsEditing(true);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  // Badge text & style
  const getBadge = () => {
    if (editingDate && isEditing) {
      const formatted = format(new Date(editingDate + "T12:00:00"), "dd 'de' MMMM", { locale: ptBR });
      return { text: `✏️ Editando registro de ${formatted}`, className: "bg-amber-50 text-amber-700 border-amber-200" };
    }
    if (isEditing) {
      return { text: "✏️ Editando registro de hoje...", className: "bg-amber-50 text-amber-700 border-amber-200" };
    }
    if (isReadOnly && existingEntryId) {
      return { text: "✓ Registro de hoje já salvo", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    }
    return null;
  };

  const badge = getBadge();

  // Button text
  const getButtonText = () => {
    if (saving) return "Salvando...";
    if (isEditing) return "Salvar alterações";
    if (isReadOnly && existingEntryId) return "Editar registro";
    return "Salvar registro";
  };

  const handleButtonClick = () => {
    if (isReadOnly && existingEntryId && !isEditing) {
      handleEdit();
    } else {
      handleSave();
    }
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

      <div ref={formRef} className="mx-auto max-w-lg space-y-5 px-5 pt-5">
        {/* Badge */}
        {badge && (
          <div className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold font-body ${badge.className}`}>
            {badge.text}
          </div>
        )}

        {/* Cancel editing history */}
        {editingDate && isEditing && (
          <Button
            variant="outline"
            size="sm"
            className="w-full border-muted-foreground/20 text-muted-foreground"
            onClick={resetToToday}
          >
            Cancelar e voltar para hoje
          </Button>
        )}

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
                disabled={isReadOnly}
                className={`rounded-full border px-3 py-1.5 text-xs font-body transition-all ${
                  selectedSymptoms.includes(s)
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border text-muted-foreground hover:border-primary/30"
                } ${isReadOnly ? "opacity-70 cursor-default" : ""}`}
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
                onClick={() => !isReadOnly && setMood(m)}
                disabled={isReadOnly}
                className={`rounded-full border px-3 py-1.5 text-xs font-body transition-all ${
                  mood === m
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border text-muted-foreground hover:border-primary/30"
                } ${isReadOnly ? "opacity-70 cursor-default" : ""}`}
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
                onClick={() => !isReadOnly && setEnergy(e)}
                disabled={isReadOnly}
                className={`flex-1 rounded-lg border px-3 py-2.5 text-xs font-body transition-all ${
                  energy === e
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border text-muted-foreground hover:border-primary/30"
                } ${isReadOnly ? "opacity-70 cursor-default" : ""}`}
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
            readOnly={isReadOnly}
            className={`min-h-[80px] border-border bg-background font-body text-sm resize-none ${isReadOnly ? "opacity-70 cursor-default" : ""}`}
          />
        </div>

        <Button
          onClick={handleButtonClick}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          size="lg"
          disabled={saving || (!cycleDay && !editingEntryId)}
        >
          {isReadOnly && existingEntryId && !isEditing ? (
            <Pencil className="mr-2 h-4 w-4" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {getButtonText()}
        </Button>

        {/* History Section */}
        <div className="space-y-3 animate-fade-in pt-4">
          <div className="border-t border-border pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">
              Histórico do Diário
            </p>
          </div>

          {history.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground font-body">
                Seus registros anteriores aparecerão aqui 🌸
              </p>
            </div>
          ) : (
            <>
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
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground font-body">
                          {format(new Date(entry.date + "T12:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </span>
                        <span className="text-xs text-muted-foreground font-body">
                          Dia {entry.cycle_day} do ciclo
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
                            className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground font-body"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Mood & Energy */}
                    <div className="flex items-center gap-3 text-sm text-muted-foreground font-body">
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

                    {/* Edit button */}
                    <div className="flex justify-end mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs border-primary/20 text-primary hover:bg-primary/5"
                        onClick={() => handleEditHistory(entry)}
                      >
                        <Pencil className="mr-1 h-3 w-3" />
                        Editar
                      </Button>
                    </div>
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
                  Carregar mais registros
                </Button>
              )}
            </>
          )}
        </div>

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
