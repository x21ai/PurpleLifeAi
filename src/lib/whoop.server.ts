/**
 * Whoop API helpers, server-only.
 * Mirrors the shape of the Oura edge function but runs in TanStack Start
 * server fns instead of a Supabase Edge Function (per project rule).
 *
 * Whoop API v2 docs: https://developer.whoop.com/api
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const WHOOP_TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";
const WHOOP_API_BASE = "https://api.prod.whoop.com/developer";

function clientCreds() {
  const client_id = process.env.WHOOP_CLIENT_ID;
  const client_secret = process.env.WHOOP_CLIENT_SECRET;
  if (!client_id || !client_secret) {
    throw new Error("Whoop credentials are not configured");
  }
  return { client_id, client_secret };
}

export function getWhoopClientId(): string | null {
  return process.env.WHOOP_CLIENT_ID ?? null;
}

function isoDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function exchangeWhoopCode(code: string, redirect_uri: string) {
  const { client_id, client_secret } = clientCreds();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri,
    client_id,
    client_secret,
  });
  const res = await fetch(WHOOP_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`Whoop token exchange failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as {
    access_token: string;
    refresh_token: string;
    token_type: string;
    scope: string;
    expires_in: number;
  };
}

async function refreshWhoopToken(refresh_token: string) {
  const { client_id, client_secret } = clientCreds();
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token,
    client_id,
    client_secret,
    scope: "offline",
  });
  const res = await fetch(WHOOP_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`Whoop refresh failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    token_type: string;
    scope: string;
    expires_in: number;
  };
}

async function getValidAccessToken(user_id: string): Promise<string | null> {
  const { data: row } = await supabaseAdmin
    .from("whoop_tokens")
    .select("*")
    .eq("user_id", user_id)
    .maybeSingle();
  if (!row) return null;
  const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : 0;
  if (expiresAt - Date.now() > 60_000) return row.access_token;
  // Expired with no way to refresh: surface it instead of letting the stale
  // token 401 into a silent zero-row "successful" sync.
  if (!row.refresh_token) throw new Error("needs_reauth: Whoop token expired");
  const refreshed = await refreshWhoopToken(row.refresh_token);
  const newExpires = new Date(
    Date.now() + (refreshed.expires_in ?? 3600) * 1000,
  ).toISOString();
  await supabaseAdmin
    .from("whoop_tokens")
    .update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token ?? row.refresh_token,
      token_type: refreshed.token_type,
      scope: refreshed.scope,
      expires_at: newExpires,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user_id);
  return refreshed.access_token;
}

async function fetchAllPaginated(
  token: string,
  path: string,
  startIso: string,
  endIso: string,
): Promise<unknown[]> {
  const out: unknown[] = [];
  let next: string | null = null;
  for (let i = 0; i < 30; i++) {
    const params = new URLSearchParams({
      start: startIso,
      end: endIso,
      limit: "25",
    });
    if (next) params.set("nextToken", next);
    const res = await fetch(`${WHOOP_API_BASE}${path}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      // Propagate failures: swallowing them made broken auth look like a
      // successful sync with zero rows.
      console.error(`Whoop ${path} failed: ${res.status}`);
      if (res.status === 401 || res.status === 403) {
        throw new Error("needs_reauth: Whoop rejected the token");
      }
      throw new Error(`whoop_api_error: ${path} returned ${res.status}`);
    }
    const json = (await res.json()) as { records?: unknown[]; next_token?: string };
    if (Array.isArray(json.records)) out.push(...json.records);
    next = json.next_token ?? null;
    if (!next) break;
  }
  return out;
}

type Recovery = {
  cycle_id?: number;
  sleep_id?: number;
  created_at?: string;
  score?: {
    recovery_score?: number;
    resting_heart_rate?: number;
    hrv_rmssd_milli?: number;
    skin_temp_celsius?: number;
    spo2_percentage?: number;
  };
};
type Sleep = {
  id?: number;
  start?: string;
  end?: string;
  nap?: boolean;
  score?: {
    sleep_performance_percentage?: number;
    sleep_efficiency_percentage?: number;
    respiratory_rate?: number;
    stage_summary?: {
      total_in_bed_time_milli?: number;
      total_slow_wave_sleep_time_milli?: number;
      total_rem_sleep_time_milli?: number;
      total_light_sleep_time_milli?: number;
      total_awake_time_milli?: number;
    };
  };
};
type Cycle = {
  id?: number;
  start?: string;
  end?: string;
  score?: {
    strain?: number;
    average_heart_rate?: number;
    kilojoule?: number;
  };
};
type Workout = {
  start?: string;
  end?: string;
  score?: { kilojoule?: number };
};

function dayKey(iso: string | undefined): string | null {
  if (!iso) return null;
  return iso.slice(0, 10);
}

function msToMin(ms: number | undefined | null): number | null {
  if (ms == null) return null;
  return Math.round(ms / 60000);
}

/**
 * Sync the user's Whoop data for [start, end] (date-only strings).
 * Returns the number of upserted biometrics rows.
 */
export async function syncWhoopRange(
  user_id: string,
  startDate: string,
  endDate: string,
): Promise<{ days: number }> {
  const token = await getValidAccessToken(user_id);
  if (!token) throw new Error("No Whoop token for user");

  const startIso = new Date(`${startDate}T00:00:00Z`).toISOString();
  const endIso = new Date(`${endDate}T23:59:59Z`).toISOString();

  const [recoveries, sleeps, cycles, workouts] = (await Promise.all([
    fetchAllPaginated(token, "/v2/recovery", startIso, endIso),
    fetchAllPaginated(token, "/v2/activity/sleep", startIso, endIso),
    fetchAllPaginated(token, "/v2/cycle", startIso, endIso),
    fetchAllPaginated(token, "/v2/activity/workout", startIso, endIso),
  ])) as [Recovery[], Sleep[], Cycle[], Workout[]];

  // Group by day. For sleep, prefer the longest non-nap entry per day.
  const recoveryByDay = new Map<string, Recovery>();
  for (const r of recoveries) {
    const k = dayKey(r.created_at);
    if (k) recoveryByDay.set(k, r);
  }

  const sleepByDay = new Map<string, Sleep>();
  for (const s of sleeps) {
    if (s.nap) continue;
    const k = dayKey(s.end ?? s.start);
    if (!k) continue;
    const prev = sleepByDay.get(k);
    const dur = (s.score?.stage_summary?.total_in_bed_time_milli ?? 0);
    const prevDur = prev?.score?.stage_summary?.total_in_bed_time_milli ?? 0;
    if (!prev || dur > prevDur) sleepByDay.set(k, s);
  }

  const cycleByDay = new Map<string, Cycle>();
  for (const c of cycles) {
    const k = dayKey(c.start);
    if (!k) continue;
    const prev = cycleByDay.get(k);
    if (!prev || (c.score?.strain ?? 0) > (prev.score?.strain ?? 0)) cycleByDay.set(k, c);
  }

  const workoutMinByDay = new Map<string, number>();
  for (const w of workouts) {
    const k = dayKey(w.start);
    if (!k || !w.start || !w.end) continue;
    const mins = Math.max(
      0,
      Math.round(
        (new Date(w.end).getTime() - new Date(w.start).getTime()) / 60000,
      ),
    );
    workoutMinByDay.set(k, (workoutMinByDay.get(k) ?? 0) + mins);
  }

  const allDays = new Set<string>([
    ...recoveryByDay.keys(),
    ...sleepByDay.keys(),
    ...cycleByDay.keys(),
    ...workoutMinByDay.keys(),
  ]);

  let upserts = 0;
  for (const day of allDays) {
    const r = recoveryByDay.get(day);
    const s = sleepByDay.get(day);
    const c = cycleByDay.get(day);
    const workoutMin = workoutMinByDay.get(day) ?? null;

    const stage = s?.score?.stage_summary;
    const recordedAt = new Date(`${day}T12:00:00Z`).toISOString();

    const row = {
      user_id,
      source: "whoop",
      recorded_at: recordedAt,
      hrv_rmssd_ms: r?.score?.hrv_rmssd_milli ?? null,
      resting_hr_bpm: r?.score?.resting_heart_rate ?? null,
      spo2_pct: r?.score?.spo2_percentage ?? null,
      skin_temp_c: r?.score?.skin_temp_celsius ?? null,
      respiratory_rate_bpm: s?.score?.respiratory_rate ?? null,
      sleep_total_min:
        stage
          ? msToMin(
              (stage.total_in_bed_time_milli ?? 0) -
                (stage.total_awake_time_milli ?? 0),
            )
          : null,
      sleep_rem_min: msToMin(stage?.total_rem_sleep_time_milli),
      sleep_deep_min: msToMin(stage?.total_slow_wave_sleep_time_milli),
      sleep_light_min: msToMin(stage?.total_light_sleep_time_milli),
      sleep_awake_min: msToMin(stage?.total_awake_time_milli),
      sleep_efficiency_pct: s?.score?.sleep_efficiency_percentage ?? null,
      whoop_recovery_pct: r?.score?.recovery_score ?? null,
      whoop_strain: c?.score?.strain ?? null,
      whoop_sleep_performance_pct: s?.score?.sleep_performance_percentage ?? null,
      hr_bpm: c?.score?.average_heart_rate ?? null,
      active_calories: c?.score?.kilojoule != null ? c.score.kilojoule / 4.184 : null,
      workout_minutes: workoutMin,
      raw_payload: { recovery: r, sleep: s, cycle: c, workout_minutes: workoutMin },
    };

    const dayStart = new Date(`${day}T00:00:00Z`).toISOString();
    const dayEnd = new Date(`${day}T23:59:59Z`).toISOString();
    await supabaseAdmin
      .from("biometrics")
      .delete()
      .eq("user_id", user_id)
      .eq("source", "whoop")
      .gte("recorded_at", dayStart)
      .lte("recorded_at", dayEnd);

    const { error } = await supabaseAdmin.from("biometrics").insert(row);
    if (error) console.error("whoop biometrics insert error", day, error.message);
    else upserts++;
  }

  return { days: upserts };
}

export async function persistTokensAndBackfill(
  user_id: string,
  tok: Awaited<ReturnType<typeof exchangeWhoopCode>>,
  backfillDays = 30,
): Promise<{ days: number }> {
  const expires_at = new Date(
    Date.now() + (tok.expires_in ?? 3600) * 1000,
  ).toISOString();
  await supabaseAdmin
    .from("whoop_tokens")
    .upsert(
      {
        user_id,
        access_token: tok.access_token,
        refresh_token: tok.refresh_token,
        token_type: tok.token_type,
        scope: tok.scope,
        expires_at,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  const end = isoDateOnly(new Date());
  const start = isoDateOnly(new Date(Date.now() - backfillDays * 24 * 3600 * 1000));
  const result = await syncWhoopRange(user_id, start, end);
  await supabaseAdmin
    .from("whoop_tokens")
    .update({ last_sync_at: new Date().toISOString() })
    .eq("user_id", user_id);
  return result;
}

export async function incrementalSyncForUser(
  user_id: string,
  daysBack = 3,
): Promise<{ days: number }> {
  const end = isoDateOnly(new Date());
  const start = isoDateOnly(new Date(Date.now() - daysBack * 24 * 3600 * 1000));
  const result = await syncWhoopRange(user_id, start, end);
  await supabaseAdmin
    .from("whoop_tokens")
    .update({ last_sync_at: new Date().toISOString() })
    .eq("user_id", user_id);
  return result;
}

export async function syncAllConnectedUsers(): Promise<{
  ok: true;
  results: Array<{ user_id: string; days?: number; error?: string; skipped?: string }>;
}> {
  const { data: tokens } = await supabaseAdmin
    .from("whoop_tokens")
    .select("user_id, sync_interval_hours, updated_at, last_sync_at");
  const results: Array<{
    user_id: string;
    days?: number;
    error?: string;
    skipped?: string;
  }> = [];
  for (const t of tokens ?? []) {
    const interval = (t as { sync_interval_hours?: number }).sync_interval_hours ?? 12;
    if (interval === 0) {
      results.push({ user_id: t.user_id, skipped: "manual" });
      continue;
    }
    const lastIso = t.last_sync_at ?? t.updated_at;
    const last = lastIso ? new Date(lastIso).getTime() : 0;
    if (Date.now() < last + interval * 3600 * 1000) {
      results.push({ user_id: t.user_id, skipped: "not_due" });
      continue;
    }
    try {
      const r = await incrementalSyncForUser(t.user_id, 3);
      results.push({ user_id: t.user_id, days: r.days });
    } catch (e) {
      results.push({ user_id: t.user_id, error: String(e) });
    }
  }
  return { ok: true, results };
}