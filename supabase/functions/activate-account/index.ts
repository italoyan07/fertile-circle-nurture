import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { email, password } = await req.json();
    const normalizedEmail = email?.toLowerCase().trim();

    if (!normalizedEmail || !password || password.length < 6) {
      return new Response(
        JSON.stringify({ error: "E-mail e senha (mín. 6 caracteres) são obrigatórios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Activation request for:", normalizedEmail);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check if a user with this email exists (created by Kiwify webhook)
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.error("Error listing users:", listError);
      throw listError;
    }

    const existingUser = usersData.users.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (!existingUser) {
      console.log("No user found for email:", normalizedEmail);
      return new Response(
        JSON.stringify({ error: "no_purchase", message: "Nenhuma compra encontrada para este e-mail." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the profile has a valid plan
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("plan_type, plan_status")
      .eq("user_id", existingUser.id)
      .single();

    if (!profile || !profile.plan_type) {
      console.log("Profile not provisioned for:", normalizedEmail);
      return new Response(
        JSON.stringify({ error: "no_purchase", message: "Perfil não provisionado." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User found, updating password for:", existingUser.id);

    // Update the user's password to the one they chose
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      existingUser.id,
      { password }
    );

    if (updateError) {
      console.error("Error updating password:", updateError);
      throw updateError;
    }

    console.log("Account activated successfully for:", normalizedEmail);

    return new Response(
      JSON.stringify({ success: true, message: "Conta ativada com sucesso!" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Activation error:", error);
    return new Response(
      JSON.stringify({ error: "internal", message: "Erro interno do servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
