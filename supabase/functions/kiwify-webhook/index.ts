import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-kiwify-signature",
};

const PRODUCT_MAP: Record<string, string> = {
  "cd936090-0501-11f1-9801-2ff8538a4163": "mensal",
  "93f9ea70-158c-11f1-a9b9-67c978dacc32": "trimestral",
  "68260450-158d-11f1-b868-fb0cdd92aeaa": "semestral",
};

const PLAN_RANK: Record<string, number> = {
  mensal: 1,
  trimestral: 2,
  semestral: 3,
};

const PLAN_DAYS: Record<string, number> = {
  mensal: 30,
  trimestral: 90,
  semestral: 180,
};

const PRODUCT_TOKENS: Record<string, string> = {
  "cd936090-0501-11f1-9801-2ff8538a4163": "h9r1ooc08sr",
  "93f9ea70-158c-11f1-a9b9-67c978dacc32": "ht2lzqtzqhz",
  "68260450-158d-11f1-b868-fb0cdd92aeaa": "6fll18sv68r",
};

function generatePassword(length = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pass = "";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (const byte of array) {
    pass += chars[byte % chars.length];
  }
  return pass;
}




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
    const rawBody = await req.text();
    console.log("Received webhook request");

    // Validate HMAC signature
    const secret = Deno.env.get("KIWIFY_WEBHOOK_SECRET");
    if (!secret) {
      console.error("KIWIFY_WEBHOOK_SECRET not configured");
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const signature = req.headers.get("x-kiwify-signature") || "";
    const valid = await verifySignature(rawBody, signature, secret);
    if (!valid) {
      console.error("Invalid signature");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.log("Signature validated");

    const payload = JSON.parse(rawBody);

    // Check event type
    if (payload.event !== "order.approved") {
      console.log("Ignoring event:", payload.event);
      return new Response(JSON.stringify({ success: true, message: "Event ignored" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { customer, product } = payload.data;
    const email = customer.email?.toLowerCase().trim();
    const name = customer.name || "";
    const productId = product.id;

    console.log(`Processing order: email=${email}, product=${productId}`);

    // Map product to plan
    const planType = PRODUCT_MAP[productId];
    if (!planType) {
      console.error("Unknown product ID:", productId);
      return new Response(JSON.stringify({ error: "Unknown product" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.log("Plan type:", planType);

    // Init Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + PLAN_DAYS[planType]);

    // Check if user exists
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.error("Error listing users:", listError);
      throw listError;
    }

    const existingUser = existingUsers.users.find(
      (u) => u.email?.toLowerCase() === email
    );

    if (existingUser) {
      console.log("User exists, checking plan upgrade for:", existingUser.id);

      // Get current profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("plan_type")
        .eq("user_id", existingUser.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        throw profileError;
      }

      const currentRank = PLAN_RANK[profile?.plan_type || "mensal"] || 0;
      const newRank = PLAN_RANK[planType] || 0;

      const updateData: Record<string, unknown> = {
        plan_status: "active",
        plan_expires_at: expiresAt.toISOString(),
      };

      if (newRank > currentRank) {
        updateData.plan_type = planType;
        console.log(`Upgrading plan: ${profile?.plan_type} → ${planType}`);
      } else {
        console.log(`Keeping current plan (${profile?.plan_type}), only renewing expiry`);
      }

      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update(updateData)
        .eq("user_id", existingUser.id);

      if (updateError) {
        console.error("Error updating profile:", updateError);
        throw updateError;
      }

      console.log("Profile updated successfully");
    } else {
      console.log("Creating new user:", email);

      const tempPassword = generatePassword();

      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { name },
      });

      if (createError) {
        console.error("Error creating user:", createError);
        throw createError;
      }

      console.log("User created:", newUser.user.id);

      // The trigger handle_new_user creates the profile, but we update it with the correct plan
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          name,
          plan_type: planType,
          plan_status: "active",
          plan_expires_at: expiresAt.toISOString(),
        })
        .eq("user_id", newUser.user.id);

      if (updateError) {
        console.error("Error updating new profile:", updateError);
        throw updateError;
      }

      console.log(`New user provisioned: ${email}, plan: ${planType}, temp password generated`);
      // Note: Welcome email with temp password would be sent via a separate email service
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
