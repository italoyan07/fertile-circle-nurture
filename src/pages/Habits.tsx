import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import HabitItem from "@/components/HabitItem";
import { Sparkles } from "lucide-react";

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

const Habits = () => {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggle = (habit: string) => {
    setChecked((prev) => ({ ...prev, [habit]: !prev[habit] }));
  };

  const completedCount = Object.values(checked).filter(Boolean).length;
  const percent = Math.round((completedCount / defaultHabits.length) * 100);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="border-b border-border bg-card px-5 pt-12 pb-5">
        <div className="mx-auto max-w-lg">
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Check-in Diário
          </h1>
          <p className="mt-1 text-sm text-muted-foreground font-body">
            Seus hábitos de hoje
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-4 px-5 pt-5">
        {/* Progress Card */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">
              Progresso
            </p>
            <span className="font-display text-2xl font-bold text-primary">{percent}%</span>
          </div>
          <Progress value={percent} className="h-3 bg-muted" />
          <p className="mt-2 text-xs text-muted-foreground font-body">
            {completedCount} de {defaultHabits.length} hábitos concluídos
          </p>
          {percent === 100 && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-secondary/10 px-3 py-2 animate-scale-in">
              <Sparkles className="h-4 w-4 text-secondary" />
              <span className="text-xs font-semibold text-secondary font-body">
                Parabéns! Todos os hábitos concluídos! 🌸
              </span>
            </div>
          )}
        </div>

        {/* Habit List */}
        <div className="space-y-2">
          {defaultHabits.map((habit, i) => (
            <div key={habit} className="animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
              <HabitItem
                label={habit}
                checked={!!checked[habit]}
                onToggle={() => toggle(habit)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Habits;
