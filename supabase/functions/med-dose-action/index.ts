import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    .select("id, user_id, status, medication_id, scheduled_at")
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
      console.error("med-dose-action taken error", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
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
      console.error("med-dose-action skip error", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } else if (action === "snooze") {
    const snoozeUntil = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { error } = await userClient
      .from("medication_doses")
      // Reset the notified markers so the dose-reminders cron fires again at
      // the snoozed time; otherwise "Snooze 10 min" never reminded again.
      .update({
        scheduled_at: snoozeUntil,
        status: "pending",
        notified_at: null,
        missed_notified_at: null,
      })
      .eq("id", doseId);
    if (error) {
      console.error("med-dose-action snooze error", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // Delivery instrumentation: stamp the acknowledgment on the latest open
  // delivery row for this dose (best-effort; never fails the action).
  try {
    const { data: openRows } = await userClient
      .from("notification_delivery_log")
      .select("id")
      .eq("user_id", userId)
      .eq("dose_id", doseId)
      .is("acknowledged_at", null)
      .order("created_at", { ascending: false })
      .limit(1);
    if (openRows && openRows.length > 0) {
      await userClient
        .from("notification_delivery_log")
        .update({ acknowledged_at: now, acknowledged_action: action })
        .eq("id", openRows[0].id);
    } else {
      await userClient.from("notification_delivery_log").insert({
        user_id: userId,
        dose_id: doseId,
        scheduled_at: dose.scheduled_at ?? now,
        delivery_channel: "sw_local",
        acknowledged_at: now,
        acknowledged_action: action,
      });
    }
  } catch (e) {
    console.warn("med-dose-action delivery log failed", e);
  }

  return new Response(JSON.stringify({ ok: true, doseId, action }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
