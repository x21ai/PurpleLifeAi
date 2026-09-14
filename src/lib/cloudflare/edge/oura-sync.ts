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
};

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

async function fetchOuraDaily(accessToken: string, start: string, end: string) {
  const url = new URL("https://api.ouraring.com/v2/usercollection/daily_sleep");
  url.searchParams.set("start_date", start);
  url.searchParams.set("end_date", end);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Oura API ${res.status}`);
  return res.json();
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
  const start = fmt(new Date(Date.now() - 7 * 864e5));

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

      if (options?.all && row.sync_interval_hours && row.sync_interval_hours > 0) {
        const last = row.last_sync_at ? new Date(row.last_sync_at).getTime() : 0;
        const minGap = row.sync_interval_hours * 3600_000;
        if (Date.now() - last < minGap) {
          skipped += 1;
          continue;
        }
      }

      const token = await getValidAccessToken(user_id);
      if (!token) {
        skipped += 1;
        continue;
      }

      await fetchOuraDaily(token, start, end);
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
