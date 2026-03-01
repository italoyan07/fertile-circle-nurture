type Phase = "menstrual" | "folicular" | "ovulatoria" | "lutea";

const phaseConfig: Record<Phase, { label: string; className: string }> = {
  menstrual: { label: "Menstrual", className: "bg-phase-menstrual/15 text-phase-menstrual border-phase-menstrual/30" },
  folicular: { label: "Folicular", className: "bg-phase-follicular/15 text-phase-follicular border-phase-follicular/30" },
  ovulatoria: { label: "Ovulatória", className: "bg-phase-ovulatory/15 text-phase-ovulatory border-phase-ovulatory/30" },
  lutea: { label: "Lútea", className: "bg-phase-luteal/15 text-phase-luteal border-phase-luteal/30" },
};

interface CyclePhaseTagProps {
  phase: Phase;
  size?: "sm" | "md";
}

const CyclePhaseTag = ({ phase, size = "md" }: CyclePhaseTagProps) => {
  const config = phaseConfig[phase];
  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold font-body ${config.className} ${
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
      }`}
    >
      {config.label}
    </span>
  );
};

export default CyclePhaseTag;
export type { Phase };
