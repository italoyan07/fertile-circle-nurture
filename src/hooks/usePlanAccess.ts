import { useAuth } from "@/contexts/AuthContext";

export const usePlanAccess = () => {
  const { profile } = useAuth();

  const planType = profile?.plan_type || "mensal";
  const isOwner = profile?.is_owner || false;
  const hasCommunityAccess =
    isOwner || planType === "trimestral" || planType === "semestral";

  return { hasCommunityAccess, planType, isOwner };
};
