/**
 * Oura sync logic ported from supabase/functions/oura-sync for Cloudflare backend.
 * Invoked by /api/public/cron/oura-sync-all and client routes when DATA_BACKEND=cloudflare.
 */
import { d1All, d1First, d1Run } from "../d1/client";
import { getBindings } from "../bindings";

type OuraTokenRow = {
  user_id: string;
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  sync_mode: string | null;
  sync_interval_hours: number | null;
  last_sync_at: string | null;
  updated_at: string | null;
};

type BiometricRow = Record<string, unknown>;

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function refreshToken(refresh_token: string) {
  const { OURA_CLIENT_ID, OURA_CLIENT_SECRET } = getBindings();
  if (!OURA_CLIENT_ID || !OURA_CLIENT_SECRET) {
    throw new Error("Oura OAuth not configured");
  }
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
  if (!res.ok) {
    throw new Error(`Oura refresh failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
    scope?: string;
  };
}

async function getValidAccessToken(userId: string): Promise<string | null> {
  const row = await d1First<OuraTokenRow>(
    `SELECT * FROM oura_tokens WHERE user_id = ?`,
    userId,
  );
  if (!row) return null;
  const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : 0;
  if (expiresAt - Date.now() > 60_000) return row.access_token;
  if (!row.refresh_token) return row.access_token;
  const refreshed = await refreshToken(row.refresh_token);
  const newExpires = new Date(
    Date.now() + (refreshed.expires_in ?? 3600) * 1000,
  ).toISOString();
  await d1Run(
    `UPDATE oura_tokens SET access_token = ?, refresh_token = ?, token_type = ?,
     scope = ?, expires_at = ?, updated_at = datetime('now') WHERE user_id = ?`,
    refreshed.access_token,
    refreshed.refresh_token ?? row.refresh_token,
    refreshed.token_type ?? null,
    refreshed.scope ?? null,
    newExpires,
    userId,
  );
  return refreshed.access_token;
}

async function ouraGet(
  token: string,
  path: string,
  start: string,
  end: string,
): Promise<{ data: unknown[] }> {
  const url = `https://api.ouraring.com/v2${path}?start_date=${start}&end_date=${end}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    console.error(`Oura ${path} failed: ${res.status}`);
    return { data: [] };
  }
  return (await res.json()) as { data: unknown[] };
}

function byDay<T extends { day?: string }>(items: T[]): Map<string, T> {
  const m = new Map<string, T>();
  for (const it of items ?? []) {
    if (it.day) m.set(it.day, it);
  }
  return m;
}

/**
 * Oura's daily_stress returns `stress_high` as SECONDS spent in high stress,
 * not a 0-100 score. Convert to a 0-100 daytime stress score so the UI can
 * render a value comparable to other scores. Prefer the qualitative
 * `day_summary` when present.
 */
function ouraStressScore(st: Record<string, unknown> | undefined): number | null {
  if (!st) return null;
  const summary = typeof st.day_summary === "string" ? st.day_summary : null;
  if (summary === "restored") return 90;
  if (summary === "normal") return 70;
  if (summary === "stressful") return 40;
  const seconds = typeof st.stress_high === "number" ? st.stress_high : null;
  if (seconds == null) return null;
  const capped = Math.min(Math.max(seconds, 0), 4 * 3600);
  return Math.round(100 - (capped / (4 * 3600)) * 100);
}

function nestedNumber(obj: unknown, ...keys: string[]): number | null {
  let cur: unknown = obj;
  for (const key of keys) {
    if (cur == null || typeof cur !== "object") return null;
    cur = (cur as Record<string, unknown>)[key];
  }
  return typeof cur === "number" ? cur : null;
}

async function syncRange(
  userId: string,
  start: string,
  end: string,
): Promise<{ days: number }> {
  const token = await getValidAccessToken(userId);
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

  const sleepDailyMap = byDay((sleepDaily.data ?? []) as Array<{ day?: string }>);
  const readinessMap = byDay((readiness.data ?? []) as Array<{ day?: string }>);
  const stressMap = byDay((stress.data ?? []) as Array<{ day?: string }>);
  const resilienceMap = byDay((resilience.data ?? []) as Array<{ day?: string }>);
  const activityMap = byDay((activity.data ?? []) as Array<{ day?: string }>);
  const spo2Map = byDay((spo2.data ?? []) as Array<{ day?: string }>);
  const cardioMap = byDay((cardio.data ?? []) as Array<{ day?: string }>);

  const sleepDetailMap = new Map<string, Record<string, unknown>>();
  for (const s of (sleepDetail.data ?? []) as Array<Record<string, unknown>>) {
    if (typeof s.day !== "string") continue;
    const prev = sleepDetailMap.get(s.day);
    if (!prev || s.type === "long_sleep") sleepDetailMap.set(s.day, s);
  }

  const days = new Set<string>([
    ...sleepDailyMap.keys(),
    ...readinessMap.keys(),
    ...stressMap.keys(),
    ...resilienceMap.keys(),
    ...activityMap.keys(),
    ...spo2Map.keys(),
    ...sleepDetailMap.keys(),
  ]);

  let upserts = 0;
  for (const day of days) {
    const sd = sleepDailyMap.get(day) as Record<string, unknown> | undefined;
    const rd = readinessMap.get(day) as Record<string, unknown> | undefined;
    const st = stressMap.get(day) as Record<string, unknown> | undefined;
    const rs = resilienceMap.get(day) as Record<string, unknown> | undefined;
    const ac = activityMap.get(day) as Record<string, unknown> | undefined;
    const sp = spo2Map.get(day) as Record<string, unknown> | undefined;
    const ca = cardioMap.get(day) as Record<string, unknown> | undefined;
    const sl = sleepDetailMap.get(day);

    const recordedAt = new Date(`${day}T12:00:00Z`).toISOString();
    const dayStart = new Date(`${day}T00:00:00Z`).toISOString();
    const dayEnd = new Date(`${day}T23:59:59Z`).toISOString();

    const row: Record<string, unknown> = {
      user_id: userId,
      source: "oura",
      recorded_at: recordedAt,
      sleep_total_min: sl?.total_sleep_duration
        ? Math.round((sl.total_sleep_duration as number) / 60)
        : null,
      sleep_rem_min: sl?.rem_sleep_duration
        ? Math.round((sl.rem_sleep_duration as number) / 60)
        : null,
      sleep_deep_min: sl?.deep_sleep_duration
        ? Math.round((sl.deep_sleep_duration as number) / 60)
        : null,
      sleep_light_min: sl?.light_sleep_duration
        ? Math.round((sl.light_sleep_duration as number) / 60)
        : null,
      sleep_awake_min: sl?.awake_time ? Math.round((sl.awake_time as number) / 60) : null,
      sleep_latency_min: sl?.latency ? Math.round((sl.latency as number) / 60) : null,
      sleep_efficiency_pct: nestedNumber(sd, "contributors", "efficiency") ?? sl?.efficiency ?? null,
      sleep_score: sd?.score ?? null,
      hrv_rmssd_ms: sl?.average_hrv ?? null,
      resting_hr_bpm: sl?.lowest_heart_rate ?? null,
      body_temp_deviation_c: nestedNumber(sl, "readiness", "temperature_deviation"),
      spo2_pct: nestedNumber(sp, "spo2_percentage", "average"),
      oura_readiness_score: rd?.score ?? null,
      oura_stress_score: ouraStressScore(st),
      oura_resilience_level: rs?.level ?? null,
      oura_activity_score: ac?.score ?? null,
      steps: ac?.steps ?? null,
      active_calories: ac?.active_calories ?? null,
      raw_payload: JSON.stringify({
        daily_sleep: sd,
        daily_readiness: rd,
        daily_stress: st,
        daily_resilience: rs,
        daily_activity: ac,
        daily_spo2: sp,
        daily_cardiovascular_age: ca,
        sleep: sl,
      }),
    };

    const existing = await d1First<BiometricRow>(
      `SELECT * FROM biometrics
       WHERE user_id = ? AND source = 'oura'
         AND recorded_at >= ? AND recorded_at <= ?
       ORDER BY recorded_at DESC LIMIT 1`,
      userId,
      dayStart,
      dayEnd,
    );

    if (existing) {
      for (const [key, value] of Object.entries(row)) {
        if (key === "raw_payload") continue;
        if (value == null && existing[key] != null) {
          row[key] = existing[key];
        }
      }
    }

    await d1Run(
      `DELETE FROM biometrics
       WHERE user_id = ? AND source = 'oura'
         AND recorded_at >= ? AND recorded_at <= ?`,
      userId,
      dayStart,
      dayEnd,
    );

    const cols = Object.keys(row);
    const vals = cols.map((c) => row[c] ?? null);
    const id = crypto.randomUUID();
    await d1Run(
      `INSERT INTO biometrics (id, ${cols.join(", ")}, created_at)
       VALUES (?, ${cols.map(() => "?").join(", ")}, datetime('now'))`,
      id,
      ...vals,
    );
    upserts += 1;
  }

  return { days: upserts };
}

export async function runOuraIncrementalSync(options?: {
  userId?: string;
  all?: boolean;
}): Promise<{ synced: number; skipped: number; errors: string[] }> {
  const errors: string[] = [];
  let synced = 0;
  let skipped = 0;

  const users = options?.userId
    ? [{ user_id: options.userId }]
    : await d1All<{ user_id: string }>(`SELECT user_id FROM oura_tokens`);

  const end = fmt(new Date());
  const start = fmt(new Date(Date.now() - 3 * 24 * 3600 * 1000));

  for (const { user_id } of users) {
    try {
      const row = await d1First<OuraTokenRow>(
        `SELECT * FROM oura_tokens WHERE user_id = ?`,
        user_id,
      );
      if (!row) {
        skipped += 1;
        continue;
      }

      if (options?.all) {
        const interval = row.sync_interval_hours ?? 12;
        if (interval === 0) {
          skipped += 1;
          continue;
        }
        const lastIso = row.last_sync_at ?? row.updated_at;
        const last = lastIso ? new Date(lastIso).getTime() : 0;
        const dueAt = last + interval * 3600 * 1000;
        if (Date.now() < dueAt) {
          skipped += 1;
          continue;
        }
      }

      await syncRange(user_id, start, end);
      await d1Run(
        `UPDATE oura_tokens SET last_sync_at = datetime('now'), updated_at = datetime('now') WHERE user_id = ?`,
        user_id,
      );
      synced += 1;
    } catch (e) {
      errors.push(`${user_id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { synced, skipped, errors };
}
