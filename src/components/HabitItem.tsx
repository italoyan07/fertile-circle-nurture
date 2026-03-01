import { Check } from "lucide-react";

interface HabitItemProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
}

const HabitItem = ({ label, checked, onToggle }: HabitItemProps) => {
  return (
    <button
      onClick={onToggle}
      className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 transition-all ${
        checked
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-card hover:border-primary/20"
      }`}
    >
      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
          checked
            ? "border-primary bg-primary"
            : "border-muted-foreground/30"
        }`}
      >
        {checked && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
      </div>
      <span className={`text-sm font-body ${checked ? "text-foreground" : "text-muted-foreground"}`}>
        {label}
      </span>
    </button>
  );
};

export default HabitItem;
