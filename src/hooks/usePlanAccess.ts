import { useAuth } from "@/contexts/AuthContext";

export const usePlanAccess = () => {
  const { profile } = useAuth();

  const planType = profile?.plan_type || "mensal";
  const planStatus = profile?.plan_status || "active";
  const planExpiresAt = profile?.plan_expires_at || null;
  const isOwner = profile?.is_owner || false;
  const hasCommunityAccess =
    isOwner || planType === "trimestral" || planType === "semestral";

  const isExpired = !isOwner && planStatus === "expired";
  const isGrace = !isOwner && planStatus === "grace";

  const daysUntilExpiry = planExpiresAt
    ? Math.ceil((new Date(planExpiresAt).getTime() - Date.now()) / 86400000)
    : null;

  const graceDaysLeft = isGrace && daysUntilExpiry !== null
    ? Math.max(0, daysUntilExpiry + 3)
    : null;

  return { hasCommunityAccess, planType, planStatus, isOwner, isExpired, isGrace, daysUntilExpiry, graceDaysLeft };
};
