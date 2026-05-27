import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PUBLISHABLE = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ||
  Deno.env.get("SUPABASE_ANON_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(SUPABASE_URL, PUBLISHABLE, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const journalEntryId = String(body?.journal_entry_id || "").trim();
    if (!journalEntryId) {
      return new Response(JSON.stringify({ error: "journal_entry_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify ownership + load entry
    const { data: entry, error: entryErr } = await admin
      .from("journal_entries")
      .select("id, user_id, text, voice_transcript, captured_at, created_at")
      .eq("id", journalEntryId)
      .eq("user_id", userId)
      .maybeSingle();
    if (entryErr) throw new Error(entryErr.message);
    if (!entry) {
      return new Response(JSON.stringify({ error: "not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const text = [entry.text, entry.voice_transcript].filter(Boolean).join("\n\n").trim();
    if (!text) {
      return new Response(
        JSON.stringify({ extractions: [], unmatched_phrases: [], daily_behaviors_written: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const entryDate = (entry.captured_at || entry.created_at || new Date().toISOString()).slice(0, 10);

    // Call orchestrator's extract action via internal HTTP (service role auth)
    const orchUrl = `${SUPABASE_URL}/functions/v1/ai-orchestrator`;
    const orchResp = await fetch(orchUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "extract_behaviors_from_text",
        text,
        date: entryDate,
      }),
    });
    if (!orchResp.ok) {
      const errText = await orchResp.text();
      throw new Error(`extractor ${orchResp.status}: ${errText}`);
    }
    const { extractions = [], unmatched_phrases = [] } = await orchResp.json();

    // Write daily_behaviors rows
    const rows = extractions.map((e: any) => ({
      user_id: userId,
      journal_entry_id: journalEntryId,
      date: entryDate,
      behavior_key: e.behavior_key,
      value: e.value,
      extraction_confidence: e.confidence,
      user_corrected: false,
    }));

    let written = 0;
    if (rows.length > 0) {
      // Sweep stale extractions for this entry that are no longer emitted
      const keepKeys = rows.map((r: any) => r.behavior_key);
      const { error: delErr } = await admin
        .from("daily_behaviors")
        .delete()
        .eq("user_id", userId)
        .eq("journal_entry_id", journalEntryId)
        .not("behavior_key", "in", `(${keepKeys.map((k) => `"${k}"`).join(",")})`);
      if (delErr) throw new Error(`sweep failed: ${delErr.message}`);

      const { error: insErr, count } = await admin
        .from("daily_behaviors")
        .upsert(rows, {
          onConflict: "user_id,journal_entry_id,behavior_key",
          count: "exact",
        });
      if (insErr) throw new Error(`upsert failed: ${insErr.message}`);
      written = count ?? rows.length;
    }

    return new Response(
      JSON.stringify({
        extractions,
        unmatched_phrases,
        daily_behaviors_written: written,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("journal-extract error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});