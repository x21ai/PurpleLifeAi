import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OURA_CLIENT_ID = Deno.env.get("OURA_CLIENT_ID")!;
const OURA_CLIENT_SECRET = Deno.env.get("OURA_CLIENT_SECRET")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

function fmt(d: Date) {
  return d.toISOString().slice(0, 10);
}

async function getUserIdFromRequest(req: Request): Promise<string | null> {
  const auth = req.headers.get("Authorization");
  if (!auth) return null;
  const token = auth.replace("Bearer ", "");
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

async function exchangeCode(code: string, redirect_uri: string) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri,
    client_id: OURA_CLIENT_ID,
    client_secret: OURA_CLIENT_SECRET,
  });
  const res = await fetch("https://api.ouraring.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Oura token exchange failed: ${res.status} ${await res.text()}`);
  return await res.json();
}

async function refreshToken(refresh_token: string) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token,
    client_id: OURA_CLIENT_ID,
    client_secret: OURA_CLIENT_SECRET,
  });
  const res = await fetch("https://api.ouraring.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Oura refresh failed: ${res.status} ${await res.text()}`);
  return await res.json();
}

async function getValidAccessToken(user_id: string): Promise<string | null> {
  const { data: row } = await admin
    .from("oura_tokens")
    .select("*")
    .eq("user_id", user_id)
    .maybeSingle();
  if (!row) return null;
  const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : 0;
  if (expiresAt - Date.now() > 60_000) return row.access_token;
  if (!row.refresh_token) return row.access_token;
  const refreshed = await refreshToken(row.refresh_token);
  const newExpires = new Date(Date.now() + (refreshed.expires_in ?? 3600) * 1000).toISOString();
  await admin.from("oura_tokens").update({
    access_token: refreshed.access_token,
    refresh_token: refreshed.refresh_token ?? row.refresh_token,
    token_type: refreshed.token_type,
    scope: refreshed.scope,
    expires_at: newExpires,
    updated_at: new Date().toISOString(),
  }).eq("user_id", user_id);
  return refreshed.access_token;
}

async function ouraGet(token: string, path: string, start: string, end: string) {
  const url = `https://api.ouraring.com/v2${path}?start_date=${start}&end_date=${end}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    console.error(`Oura ${path} failed: ${res.status}`);
    return { data: [] };
  }
  return await res.json();
}

function byDay<T extends { day?: string }>(items: T[]) {
  const m = new Map<string, T>();
  for (const it of items ?? []) if (it.day) m.set(it.day, it);
  return m;
}

async function syncRange(user_id: string, start: string, end: string) {
  const token = await getValidAccessToken(user_id);
  if (!token) throw new Error("No Oura token for user");

  const [sleepDaily, readiness, stress, resilience, activity, spo2, cardio, sleepDetail] =
    await Promise.all([
      ouraGet(token, "/usercollection/daily_sleep", start, end),
      ouraGet(token, "/usercollection/daily_readiness", start, end),
      ouraGet(token, "/usercollection/daily_stress", start, end),
      ouraGet(token, "/usercollection/daily_resilience", start, end),
      ouraGet(token, "/usercollection/daily_activity", start, end),
      ouraGet(token, "/usercollection/daily_spo2", start, end),
      ouraGet(token, "/usercollection/daily_cardiovascular_age", start, end),
      ouraGet(token, "/usercollection/sleep", start, end),
    ]);

  const sleepDailyMap = byDay(sleepDaily.data);
  const readinessMap = byDay(readiness.data);
  const stressMap = byDay(stress.data);
  const resilienceMap = byDay(resilience.data);
  const activityMap = byDay(activity.data);
  const spo2Map = byDay(spo2.data);
  const cardioMap = byDay(cardio.data);

  // For /sleep endpoint, prefer "long_sleep" type per day
  const sleepDetailMap = new Map<string, any>();
  for (const s of (sleepDetail.data ?? []) as any[]) {
    if (!s.day) continue;
    const prev = sleepDetailMap.get(s.day);
    if (!prev || s.type === "long_sleep") sleepDetailMap.set(s.day, s);
  }

  const days = new Set<string>([
    ...sleepDailyMap.keys(), ...readinessMap.keys(), ...stressMap.keys(),
    ...resilienceMap.keys(), ...activityMap.keys(), ...spo2Map.keys(),
    ...sleepDetailMap.keys(),
  ]);

  let upserts = 0;
  for (const day of days) {
    const sd: any = sleepDailyMap.get(day);
    const rd: any = readinessMap.get(day);
    const st: any = stressMap.get(day);
    const rs: any = resilienceMap.get(day);
    const ac: any = activityMap.get(day);
    const sp: any = spo2Map.get(day);
    const ca: any = cardioMap.get(day);
    const sl: any = sleepDetailMap.get(day);

    const recordedAt = new Date(`${day}T12:00:00Z`).toISOString();

    const row: Record<string, unknown> = {
      user_id,
      source: "oura",
      recorded_at: recordedAt,
      sleep_total_min: sl?.total_sleep_duration ? Math.round(sl.total_sleep_duration / 60) : null,
      sleep_rem_min: sl?.rem_sleep_duration ? Math.round(sl.rem_sleep_duration / 60) : null,
      sleep_deep_min: sl?.deep_sleep_duration ? Math.round(sl.deep_sleep_duration / 60) : null,
      sleep_light_min: sl?.light_sleep_duration ? Math.round(sl.light_sleep_duration / 60) : null,
      sleep_awake_min: sl?.awake_time ? Math.round(sl.awake_time / 60) : null,
      sleep_latency_min: sl?.latency ? Math.round(sl.latency / 60) : null,
      sleep_efficiency_pct: sd?.contributors?.efficiency ?? sl?.efficiency ?? null,
      sleep_score: sd?.score ?? null,
      hrv_rmssd_ms: sl?.average_hrv ?? null,
      resting_hr_bpm: sl?.lowest_heart_rate ?? null,
      body_temp_deviation_c: sl?.readiness?.temperature_deviation ?? null,
      spo2_pct: sp?.spo2_percentage?.average ?? null,
      oura_readiness_score: rd?.score ?? null,
      oura_stress_score: ouraStressScore(st),
      oura_resilience_level: rs?.level ?? null,
      oura_activity_score: ac?.score ?? null,
      steps: ac?.steps ?? null,
      active_calories: ac?.active_calories ?? null,
      raw_payload: {
        daily_sleep: sd, daily_readiness: rd, daily_stress: st,
        daily_resilience: rs, daily_activity: ac, daily_spo2: sp,
        daily_cardiovascular_age: ca, sleep: sl,
      },
    };

    const dayStart = new Date(`${day}T00:00:00Z`).toISOString();
    const dayEnd = new Date(`${day}T23:59:59Z`).toISOString();

    // Merge with any existing row for the day so a partial sync (e.g. the Oura
    // sleep endpoints failed while activity succeeded) never nulls out
    // previously-synced fields. Keep an existing non-null value when the new
    // payload has nothing for that column.
    const { data: existing } = await admin
      .from("biometrics")
      .select("*")
      .eq("user_id", user_id)
      .eq("source", "oura")
      .gte("recorded_at", dayStart)
      .lte("recorded_at", dayEnd)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing) {
      for (const [key, value] of Object.entries(row)) {
        if (key === "raw_payload") continue;
        if (value == null && (existing as Record<string, unknown>)[key] != null) {
          row[key] = (existing as Record<string, unknown>)[key];
        }
      }
    }

    // Delete existing oura row(s) for that day before insert (no unique constraint exists)
    await admin.from("biometrics")
      .delete()
      .eq("user_id", user_id)
      .eq("source", "oura")
      .gte("recorded_at", dayStart)
      .lte("recorded_at", dayEnd);

    const { error } = await admin.from("biometrics").insert(row);
    if (error) console.error("biometrics insert error", day, error.message);
    else upserts++;
  }
  return { days: upserts };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const action = body.action as "exchange" | "backfill" | "incremental";

    if (action === "config" as any) {
      return new Response(JSON.stringify({ client_id: OURA_CLIENT_ID }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Incremental cron: sync all connected users
    if (action === "incremental" && body.all === true) {
      // Service-role only: prevents unauthenticated callers from triggering
      // mass Oura API syncs and exhausting per-user rate limits.
      const authHeader = req.headers.get("Authorization") ?? "";
      const token = authHeader.replace(/^Bearer\s+/i, "");
      if (!SERVICE_ROLE || token !== SERVICE_ROLE) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: tokens } = await admin
        .from("oura_tokens")
        .select("user_id, sync_interval_hours, updated_at, last_sync_at");
      const end = fmt(new Date());
      const start = fmt(new Date(Date.now() - 3 * 24 * 3600 * 1000));
      const results: any[] = [];
      for (const t of tokens ?? []) {
        const interval = (t as any).sync_interval_hours ?? 12;
        if (interval === 0) {
          results.push({ user_id: t.user_id, skipped: "manual" });
          continue;
        }
        const lastIso = (t as any).last_sync_at ?? (t as any).updated_at;
        const last = lastIso ? new Date(lastIso).getTime() : 0;
        const dueAt = last + interval * 3600 * 1000;
        if (Date.now() < dueAt) {
          results.push({ user_id: t.user_id, skipped: "not_due" });
          continue;
        }
        try {
          const r = await syncRange(t.user_id, start, end);
          await admin.from("oura_tokens")
            .update({ last_sync_at: new Date().toISOString() })
            .eq("user_id", t.user_id);
          results.push({ user_id: t.user_id, ...r });
        } catch (e) {
          results.push({ user_id: t.user_id, error: String(e) });
        }
      }
      return new Response(JSON.stringify({ ok: true, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user_id = await getUserIdFromRequest(req);
    if (!user_id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "exchange") {
      const { code, redirect_uri } = body;
      const tok = await exchangeCode(code, redirect_uri);
      const expires_at = new Date(Date.now() + (tok.expires_in ?? 3600) * 1000).toISOString();
      await admin.from("oura_tokens").upsert({
        user_id,
        access_token: tok.access_token,
        refresh_token: tok.refresh_token,
        token_type: tok.token_type,
        scope: tok.scope,
        expires_at,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      const end = fmt(new Date());
      const start = fmt(new Date(Date.now() - 90 * 24 * 3600 * 1000));
      const result = await syncRange(user_id, start, end);
      await admin.from("oura_tokens")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("user_id", user_id);
      return new Response(JSON.stringify({ ok: true, ...result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "backfill") {
      const days = Number(body.days ?? 90);
      const end = fmt(new Date());
      const start = fmt(new Date(Date.now() - days * 24 * 3600 * 1000));
      const result = await syncRange(user_id, start, end);
      await admin.from("oura_tokens")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("user_id", user_id);
      return new Response(JSON.stringify({ ok: true, ...result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "incremental") {
      const end = fmt(new Date());
      const start = fmt(new Date(Date.now() - 3 * 24 * 3600 * 1000));
      const result = await syncRange(user_id, start, end);
      await admin.from("oura_tokens")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("user_id", user_id);
      return new Response(JSON.stringify({ ok: true, ...result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("oura-sync error", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});