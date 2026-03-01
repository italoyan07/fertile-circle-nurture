import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("check-plan-expiry: starting");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const now = new Date();
    const tenDaysFromNow = new Date(now);
    tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10);

    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Get all profiles with expiry data (exclude owners)
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("user_id, plan_status, plan_expires_at, is_owner, scheduled_for_deletion")
      .eq("is_owner", false)
      .not("plan_expires_at", "is", null);

    if (error) { console.error("Error fetching profiles:", error); throw error; }
    console.log(`Processing ${profiles?.length || 0} profiles`);

    for (const profile of profiles || []) {
      const expiresAt = new Date(profile.plan_expires_at!);
      const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / 86400000);

      // 1. Warning: 10 days before expiry
      if (daysUntilExpiry <= 10 && daysUntilExpiry > 0 && profile.plan_status === "active") {
        // Check if warning already sent today
        const today = now.toISOString().split("T")[0];
        const { data: existing } = await supabaseAdmin
          .from("notifications")
          .select("id")
          .eq("user_id", profile.user_id)
          .eq("type", "expiry_warning")
          .gte("created_at", today)
          .limit(1);

        if (!existing?.length) {
          await supabaseAdmin.from("notifications").insert({
            user_id: profile.user_id,
            type: "expiry_warning",
            title: "Seu acesso está se encerrando",
            message: `Seu plano vence em ${daysUntilExpiry} dias. Renove agora para continuar sua jornada e não perder seu histórico. 🌸`,
          });
          console.log(`Sent expiry warning to ${profile.user_id}, ${daysUntilExpiry} days left`);
        }
      }

      // 2. Grace period: expired but within 3 days
      if (daysUntilExpiry <= 0 && daysUntilExpiry > -3 && profile.plan_status !== "grace") {
        await supabaseAdmin
          .from("profiles")
          .update({ plan_status: "grace" })
          .eq("user_id", profile.user_id);
        console.log(`Set grace period for ${profile.user_id}`);
      }

      // 3. Expired: past 3 days grace
      if (daysUntilExpiry <= -3 && profile.plan_status !== "expired") {
        await supabaseAdmin
          .from("profiles")
          .update({ plan_status: "expired" })
          .eq("user_id", profile.user_id);
        console.log(`Set expired for ${profile.user_id}`);
      }

      // 4. Schedule for deletion: expired > 60 days
      if (profile.plan_status === "expired" && expiresAt <= sixtyDaysAgo && !profile.scheduled_for_deletion) {
        await supabaseAdmin
          .from("profiles")
          .update({ scheduled_for_deletion: true })
          .eq("user_id", profile.user_id);
        console.log(`Scheduled for deletion: ${profile.user_id}`);
      }
    }

    console.log("check-plan-expiry: complete");
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("check-plan-expiry error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
