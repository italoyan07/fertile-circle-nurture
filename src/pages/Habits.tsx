import { useState, useEffect, useMemo } from "react";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isFuture } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";
import HabitItem from "@/components/HabitItem";
import { Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import logoFertile from "@/assets/logo-fertile.png";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const defaultHabits = [
  "Consumo de pelo menos 2 porções de frutas",
  "1 a 2 porções de vegetais",
  "Suplementação conforme protocolo",
  "Hidratação adequada",
  "Sono adequado",
  "Exercício físico",
  "Proteínas em 3–4 refeições",
  "Consumo de chás estratégicos",
];

interface CheckinRecord {
  date: string;
  habits: Record<string, boolean>;
}

const Habits = () => {
  const { user } = useAuth();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [viewingPast, setViewingPast] = useState(false);
  const [pastHabits, setPastHabits] = useState<Record<string, boolean>>({});
  const [monthCheckins, setMonthCheckins] = useState<CheckinRecord[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const today = new Date().toISOString().split("T")[0];

  // Fetch today's checkin
  useEffect(() => {
    if (!user) return;
    supabase.from("daily_checkin").select("habits").eq("user_id", user.id).eq("date", today).single().then(({ data }) => {
      if (data?.habits && typeof data.habits === "object" && !Array.isArray(data.habits)) {
        setChecked(data.habits as Record<string, boolean>);
      }
    });
  }, [user, today]);

  // Fetch month checkins for calendar
  useEffect(() => {
    if (!user) return;
    const start = format(startOfMonth(calendarMonth), "yyyy-MM-dd");
    const end = format(endOfMonth(calendarMonth), "yyyy-MM-dd");
    supabase
      .from("daily_checkin")
      .select("date, habits")
      .eq("user_id", user.id)
      .gte("date", start)
      .lte("date", end)
      .then(({ data }) => {
        if (data) {
          setMonthCheckins(data.map(d => ({
            date: d.date,
            habits: (typeof d.habits === "object" && !Array.isArray(d.habits) ? d.habits : {}) as Record<string, boolean>,
          })));
        }
      });
  }, [user, calendarMonth]);

  // Fetch 30-day history
  const [history, setHistory] = useState<{ date: string; count: number; total: number }[]>([]);
  useEffect(() => {
    if (!user) return;
    const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
    supabase
      .from("daily_checkin")
      .select("date, habits")
      .eq("user_id", user.id)
      .gte("date", thirtyDaysAgo)
      .order("date", { ascending: false })
      .then(({ data }) => {
        if (data) {
          setHistory(data.map(d => {
            const habits = (typeof d.habits === "object" && !Array.isArray(d.habits) ? d.habits : {}) as Record<string, boolean>;
            return {
              date: d.date,
              count: Object.values(habits).filter(Boolean).length,
              total: defaultHabits.length,
            };
          }));
        }
      });
  }, [user, checked]);

  const toggle = async (habit: string) => {
    if (viewingPast) return;
    const newChecked = { ...checked, [habit]: !checked[habit] };
    setChecked(newChecked);
    if (!user) return;
    await supabase.from("daily_checkin").upsert({
      user_id: user.id,
      date: today,
      habits: newChecked,
    }, { onConflict: "user_id,date" });
  };

  const handleDayClick = async (dateStr: string) => {
    if (dateStr === today) {
      setViewingPast(false);
      setSelectedDate(today);
      return;
    }
    setSelectedDate(dateStr);
    setViewingPast(true);
    if (!user) return;
    const { data } = await supabase
      .from("daily_checkin")
      .select("habits")
      .eq("user_id", user.id)
      .eq("date", dateStr)
      .single();
    if (data?.habits && typeof data.habits === "object" && !Array.isArray(data.habits)) {
      setPastHabits(data.habits as Record<string, boolean>);
    } else {
      setPastHabits({});
    }
  };

  const completedCount = viewingPast
    ? Object.values(pastHabits).filter(Boolean).length
    : Object.values(checked).filter(Boolean).length;
  const percent = Math.round((completedCount / defaultHabits.length) * 100);
  const activeHabits = viewingPast ? pastHabits : checked;

  // Calendar rendering
  const calendarDays = useMemo(() => {
    const start = startOfMonth(calendarMonth);
    const end = endOfMonth(calendarMonth);
    return eachDayOfInterval({ start, end });
  }, [calendarMonth]);

  const getCheckinStatus = (date: Date): "full" | "partial" | "none" => {
    const dateStr = format(date, "yyyy-MM-dd");
    const record = monthCheckins.find(c => c.date === dateStr);
    if (!record) return "none";
    const count = Object.values(record.habits).filter(Boolean).length;
    if (count >= defaultHabits.length) return "full";
    if (count > 0) return "partial";
    return "none";
  };

  const firstDayOfWeek = calendarDays[0]?.getDay() || 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-background px-5 pt-12 pb-5">
        <div className="mx-auto max-w-lg text-center">
          <img src={logoFertile} alt="Programa FÉRTILE" className="mx-auto mb-4 h-10 object-contain" />
          <h1 className="font-display text-2xl font-semibold text-foreground">Check-in Diário</h1>
          <p className="mt-1 text-sm text-muted-foreground font-body">Seus hábitos de hoje</p>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-4 px-5 pt-5">
        {/* Calendar */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-soft animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))} className="p-1 text-muted-foreground hover:text-primary transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <p className="text-sm font-semibold text-foreground font-body capitalize">
              {format(calendarMonth, "MMMM yyyy", { locale: ptBR })}
            </p>
            <button onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))} className="p-1 text-muted-foreground hover:text-primary transition-colors">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
              <span key={i} className="text-[10px] font-semibold text-muted-foreground font-body py-1">{d}</span>
            ))}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {calendarDays.map(day => {
              const status = getCheckinStatus(day);
              const isCurrentDay = isToday(day);
              const isSelected = selectedDate === format(day, "yyyy-MM-dd");
              const future = isFuture(day) && !isCurrentDay;
              return (
                <button
                  key={day.toISOString()}
                  disabled={future}
                  onClick={() => !future && handleDayClick(format(day, "yyyy-MM-dd"))}
                  className={`relative flex h-9 w-9 items-center justify-center rounded-full text-xs font-body mx-auto transition-all ${
                    future ? "text-muted-foreground/30" :
                    isSelected ? "ring-2 ring-primary ring-offset-1" :
                    isCurrentDay ? "border-2 border-primary text-primary font-bold" :
                    "text-foreground hover:bg-muted"
                  } ${
                    status === "full" ? "bg-primary text-primary-foreground" :
                    status === "partial" ? "bg-primary/30 text-foreground" :
                    ""
                  }`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Viewing past indicator */}
        {viewingPast && (
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
            <p className="text-xs text-muted-foreground font-body">
              Visualizando: {format(new Date(selectedDate + "T12:00:00"), "dd/MM/yyyy")} (somente leitura)
            </p>
            <button onClick={() => { setViewingPast(false); setSelectedDate(today); }} className="text-xs text-primary font-body font-semibold hover:underline">
              Voltar para hoje
            </button>
          </div>
        )}

        {/* Progress */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">Progresso</p>
            <span className="font-display text-2xl font-bold text-primary">{percent}%</span>
          </div>
          <Progress value={percent} className="h-3 bg-muted" />
          <p className="mt-2 text-xs text-muted-foreground font-body">{completedCount} de {defaultHabits.length} hábitos concluídos</p>
          {percent === 100 && !viewingPast && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-secondary/10 px-3 py-2 animate-scale-in">
              <Sparkles className="h-4 w-4 text-secondary" />
              <span className="text-xs font-semibold text-secondary font-body">Parabéns! Todos os hábitos concluídos! 🌸</span>
            </div>
          )}
        </div>

        {/* Habits List */}
        <div className="space-y-2">
          {defaultHabits.map((habit, i) => (
            <div key={habit} className="animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
              <HabitItem
                label={habit}
                checked={!!activeHabits[habit]}
                onToggle={() => toggle(habit)}
              />
            </div>
          ))}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="space-y-2 animate-fade-in">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">Histórico (últimos 30 dias)</p>
            {history.map(h => {
              const pct = Math.round((h.count / h.total) * 100);
              return (
                <div key={h.date} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                  <span className="text-sm text-foreground font-body">
                    {format(new Date(h.date + "T12:00:00"), "dd/MM")}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-body">{h.count}/{h.total}</span>
                    <span className={`text-xs font-bold font-body ${pct === 100 ? "text-primary" : "text-muted-foreground"}`}>{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="py-4 text-center">
          <p className="text-xs text-muted-foreground font-body">© Nutricionista Laiane Paula · Todos os direitos reservados</p>
        </div>
      </div>
    </div>
  );
};

export default Habits;
