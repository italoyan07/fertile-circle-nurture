import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { differenceInDays } from "date-fns";

export type CyclePhase = "menstrual" | "folicular" | "ovulatoria" | "lutea";

interface CycleConfig {
  last_period_date: string;
  cycle_length: number;
}

interface CycleState {
  loading: boolean;
  config: CycleConfig | null;
  cycleDay: number | null;
  phase: CyclePhase | null;
  saveConfig: (lastPeriod: string, cycleLength: number) => Promise<void>;
}

function computePhase(day: number): CyclePhase {
  if (day <= 5) return "menstrual";
  if (day <= 13) return "folicular";
  if (day <= 16) return "ovulatoria";
  return "lutea";
}

export const useCycleConfig = (): CycleState => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<CycleConfig | null>(null);

  const fetchConfig = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from("cycle_config")
        .select("last_period_date, cycle_length")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) console.error("Error fetching cycle_config:", error);
      setConfig(data ?? null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const saveConfig = useCallback(async (lastPeriod: string, cycleLength: number) => {
    if (!user) return;
    if (config) {
      await supabase
        .from("cycle_config")
        .update({ last_period_date: lastPeriod, cycle_length: cycleLength })
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("cycle_config")
        .insert({ user_id: user.id, last_period_date: lastPeriod, cycle_length: cycleLength });
    }
    setConfig({ last_period_date: lastPeriod, cycle_length: cycleLength });
  }, [user, config]);

  let cycleDay: number | null = null;
  let phase: CyclePhase | null = null;

  if (config) {
    const diff = differenceInDays(new Date(), new Date(config.last_period_date));
    const day = (diff % config.cycle_length) + 1;
    cycleDay = day > 0 ? day : 1;
    phase = computePhase(cycleDay);
  }

  return { loading, config, cycleDay, phase, saveConfig };
};
