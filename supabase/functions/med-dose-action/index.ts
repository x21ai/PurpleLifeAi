import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

type Action = "taken" | "skip" | "snooze";

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

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { doseId?: string; action?: Action };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { doseId, action } = body;
  if (!doseId || !action || !["taken", "skip", "snooze"].includes(action)) {
    return new Response(JSON.stringify({ error: "doseId and action required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = userData.user.id;

  const { data: dose, error: doseError } = await userClient
    .from("medication_doses")
    .select("id, user_id, status, medication_id")
    .eq("id", doseId)
    .eq("user_id", userId)
    .maybeSingle();

  if (doseError || !dose) {
    return new Response(JSON.stringify({ error: "Dose not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const now = new Date().toISOString();

  if (action === "taken") {
    const { error } = await userClient
      .from("medication_doses")
      .update({ status: "taken", taken_at: now })
      .eq("id", doseId);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } else if (action === "skip") {
    const { error } = await userClient
      .from("medication_doses")
      .update({ status: "skipped" })
      .eq("id", doseId);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } else if (action === "snooze") {
    const snoozeUntil = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { error } = await userClient
      .from("medication_doses")
      .update({ scheduled_at: snoozeUntil, status: "pending" })
      .eq("id", doseId);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response(JSON.stringify({ ok: true, doseId, action }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
