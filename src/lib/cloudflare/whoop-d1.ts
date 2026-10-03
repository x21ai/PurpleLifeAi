/**
 * Whoop token and biometric writes on D1.
 * Used when DATA_BACKEND=cloudflare so connect does not depend on Supabase.
 */
import { d1All, d1First, d1Run } from "./d1/client";

export type WhoopTokenRow = {
  user_id: string;
  access_token: string;
  refresh_token: string | null;
  token_type: string | null;
  expires_at: string | null;
  scope: string | null;
  sync_mode: string | null;
  sync_interval_hours: number | null;
  last_sync_at: string | null;
  updated_at: string | null;
};

export async function upsertWhoopToken(
  userId: string,
  fields: {
    access_token: string;
    refresh_token?: string | null;
    token_type?: string | null;
    scope?: string | null;
    expires_at?: string | null;
    last_sync_at?: string | null;
  },
): Promise<void> {
  await d1Run(
    `INSERT INTO whoop_tokens (
       user_id, access_token, refresh_token, token_type, scope, expires_at, last_sync_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(user_id) DO UPDATE SET
       access_token = excluded.access_token,
       refresh_token = COALESCE(excluded.refresh_token, whoop_tokens.refresh_token),
       token_type = COALESCE(excluded.token_type, whoop_tokens.token_type),
       scope = COALESCE(excluded.scope, whoop_tokens.scope),
       expires_at = COALESCE(excluded.expires_at, whoop_tokens.expires_at),
       last_sync_at = COALESCE(excluded.last_sync_at, whoop_tokens.last_sync_at),
       updated_at = datetime('now')`,
    userId,
    fields.access_token,
    fields.refresh_token ?? null,
    fields.token_type ?? null,
    fields.scope ?? null,
    fields.expires_at ?? null,
    fields.last_sync_at ?? null,
  );
}

export async function readWhoopToken(userId: string): Promise<WhoopTokenRow | null> {
  return d1First<WhoopTokenRow>(
    `SELECT user_id, access_token, refresh_token, token_type, expires_at, scope,
            sync_mode, sync_interval_hours, last_sync_at, updated_at
     FROM whoop_tokens WHERE user_id = ?`,
    userId,
  );
}

export async function listWhoopTokens(): Promise<WhoopTokenRow[]> {
  return d1All<WhoopTokenRow>(
    `SELECT user_id, access_token, refresh_token, token_type, expires_at, scope,
            sync_mode, sync_interval_hours, last_sync_at, updated_at
     FROM whoop_tokens`,
  );
}

export async function replaceWhoopBiometricDay(
  userId: string,
  dayStart: string,
  dayEnd: string,
  row: Record<string, unknown>,
): Promise<void> {
  await d1Run(
    `DELETE FROM biometrics
     WHERE user_id = ? AND source = 'whoop' AND recorded_at >= ? AND recorded_at <= ?`,
    userId,
    dayStart,
    dayEnd,
  );
  const id = crypto.randomUUID();
  const raw = row.raw_payload == null ? null : JSON.stringify(row.raw_payload);
  await d1Run(
    `INSERT INTO biometrics (
       id, user_id, recorded_at, source, hrv_rmssd_ms, resting_hr_bpm, spo2_pct,
       skin_temp_c, respiratory_rate_bpm, sleep_total_min, sleep_rem_min, sleep_deep_min,
       sleep_light_min, sleep_awake_min, sleep_efficiency_pct, whoop_recovery_pct,
       whoop_strain, whoop_sleep_performance_pct, hr_bpm, active_calories, workout_minutes,
       raw_payload
     ) VALUES (?, ?, ?, 'whoop', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    userId,
    row.recorded_at,
    row.hrv_rmssd_ms ?? null,
    row.resting_hr_bpm ?? null,
    row.spo2_pct ?? null,
    row.skin_temp_c ?? null,
    row.respiratory_rate_bpm ?? null,
    row.sleep_total_min ?? null,
    row.sleep_rem_min ?? null,
    row.sleep_deep_min ?? null,
    row.sleep_light_min ?? null,
    row.sleep_awake_min ?? null,
    row.sleep_efficiency_pct ?? null,
    row.whoop_recovery_pct ?? null,
    row.whoop_strain ?? null,
    row.whoop_sleep_performance_pct ?? null,
    row.hr_bpm ?? null,
    row.active_calories ?? null,
    row.workout_minutes ?? null,
    raw,
  );
}
