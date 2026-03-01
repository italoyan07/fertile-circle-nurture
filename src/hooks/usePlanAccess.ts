import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface PlanAccess {
  planType: string;
  planStatus: string;
  planExpiresAt: string | null;
  isOwner: boolean;
  loading: boolean;
}

export const usePlanAccess = (): PlanAccess => {
  const { user } = useAuth();
  const [planType, setPlanType] = useState("mensal");
  const [planStatus, setPlanStatus] = useState("active");
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    supabase
      .from("profiles")
      .select("plan_type, plan_status, plan_expires_at, is_owner")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setPlanType(data.plan_type || "mensal");
          setPlanStatus(data.plan_status || "active");
          setPlanExpiresAt(data.plan_expires_at);
          setIsOwner(data.is_owner || false);
        }
        setLoading(false);
      });
  }, [user]);

  return { planType, planStatus, planExpiresAt, isOwner, loading };
};
