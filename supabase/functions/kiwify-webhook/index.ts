import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, token",
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

function formatPhone(raw: string): string | null {
  if (!raw) return null;
  let phone = raw.replace(/[\s\-\(\)\.]/g, "");
  if (phone.startsWith("0")) phone = phone.substring(1);
  if (!phone.startsWith("55")) phone = "55" + phone;
  return phone.length >= 12 ? phone : null;
}

function getFirstName(fullName: string): string {
  return (fullName || "").trim().split(/\s+/)[0] || "Cliente";
}

async function sendWhatsApp(phone: string, firstName: string): Promise<void> {
  const token = Deno.env.get("WHATSAPP_TOKEN");
  if (!token) {
    console.error("WHATSAPP_TOKEN not configured, skipping WhatsApp");
    return;
  }

  console.log(`Enviando WhatsApp para ${phone}`);

  try {
    const res = await fetch(
      "https://graph.facebook.com/v18.0/952943261241519/messages",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "template",
          template: {
            name: "compra_aprovada",
            language: { code: "pt_BR" },
            components: [
              {
                type: "body",
                parameters: [{ type: "text", text: firstName }],
              },
            ],
          },
        }),
      }
    );

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`WhatsApp API error (${res.status}): ${errBody}`);
    } else {
      console.log(`WhatsApp enviado com sucesso para ${firstName}`);
    }
  } catch (err) {
    console.error("WhatsApp send failed:", err);
  }
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

    const payload = JSON.parse(rawBody);

    // Detect event — prioritize Kiwify's actual format
    const event =
      payload.webhook_event_type ||
      payload.order_status ||
      payload.event ||
      payload.type ||
      payload.status ||
      payload.data?.status;

    const approvedStatuses = [
      "order_approved",
      "order.approved",
      "approved",
      "paid",
      "complete",
      "completed",
    ];

    if (event && !approvedStatuses.includes(event)) {
      console.log("Ignoring event:", event);
      return new Response(JSON.stringify({ success: true, message: "Event ignored" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!event) {
      console.log("No identifiable event field found. Processing anyway. Payload:", JSON.stringify(payload));
    } else {
      console.log("Event detected:", event);
    }

    // Email — prioritize Kiwify's Customer (capital C)
    const email = (
      payload.Customer?.email ||
      payload.data?.Customer?.email ||
      payload.data?.customer?.email ||
      payload.customer?.email ||
      payload.buyer?.email ||
      payload.data?.buyer?.email ||
      ""
    ).toLowerCase().trim();

    // Nome — prioritize Kiwify's Customer.first_name
    const name =
      payload.Customer?.first_name ||
      payload.Customer?.full_name ||
      payload.data?.Customer?.first_name ||
      payload.data?.Customer?.full_name ||
      payload.data?.customer?.name ||
      payload.customer?.name ||
      payload.buyer?.name ||
      payload.data?.buyer?.name ||
      "";

    // Telefone — prioritize Kiwify's Customer.mobile
    const rawPhone =
      payload.Customer?.mobile ||
      payload.data?.Customer?.mobile ||
      payload.data?.customer?.mobile ||
      payload.data?.customer?.phone ||
      payload.customer?.mobile ||
      payload.customer?.phone ||
      payload.buyer?.phone ||
      payload.data?.buyer?.phone ||
      "";

    // Product ID — prioritize Kiwify's Product.product_id
    const productId =
      payload.Product?.product_id ||
      payload.data?.Product?.product_id ||
      payload.data?.product?.id ||
      payload.product?.id ||
      payload.product_id ||
      payload.data?.product_id ||
      "";

    console.log("Email:", email);
    console.log("Nome:", name);
    console.log("Telefone:", rawPhone);
    console.log("Plan:", PRODUCT_MAP[productId] || "desconhecido");
    console.log("Product ID:", productId);
    console.log("Body completo:", JSON.stringify(payload, null, 2));

    // Determine plan and validate token
    let planType: string;
    const receivedToken = req.headers.get("token") || "";

    if (PRODUCT_MAP[productId]) {
      // Known production product
      const expectedToken = PRODUCT_TOKENS[productId];
      if (receivedToken !== expectedToken) {
        console.error(`Invalid token for product ${productId}. Received: ${receivedToken}`);
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      planType = PRODUCT_MAP[productId];
    } else {
      // Unknown product ID – default to mensal (testing)
      console.log(`Unknown product ID: ${productId}. Defaulting to 'mensal', skipping token validation.`);
      planType = "mensal";
    }
    console.log(`Token validated. Product: ${productId}, Plan: ${planType}, Email: ${email}`);

    // Validate email before proceeding
    const isTestEmail =
      !email ||
      email === "johndoe@example.com" ||
      !email.includes("@") ||
      !email.includes(".") ||
      email.length < 5;

    if (isTestEmail) {
      console.log("Payload de teste detectado, pulando criação de usuário. Email:", email || "(vazio)");
      return new Response(JSON.stringify({ success: true, test: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processando compra real para ${email}`);

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

      console.log(`Criando usuário para ${email}`);
      console.log(`New user provisioned: ${email}, plan: ${planType}`);
    }

    // Send WhatsApp notification (never fails the main flow)
    const formattedPhone = formatPhone(rawPhone);
    if (formattedPhone) {
      await sendWhatsApp(formattedPhone, getFirstName(name));
      console.log(`WhatsApp enviado para ${formattedPhone}`);
    } else {
      console.log("No valid phone number found, skipping WhatsApp");
    }

    console.log(`Processamento concluído para ${email}`);

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
