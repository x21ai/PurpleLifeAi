import { stagingFrom } from "./api-query";
import { formatRelativeTime } from "./format";

export type ConnectionState = "connected" | "disconnected" | "error";

export type WearableConnection = {
  id: "oura" | "whoop" | "apple";
  state: ConnectionState;
  label: string;
  detail: string;
  lastSync: string | null;
};

type OuraTokenRow = {
  last_sync_at: string | null;
  expires_at: string | null;
  updated_at: string | null;
};

type WhoopTokenRow = {
  last_sync_at: string | null;
  expires_at: string | null;
  updated_at: string | null;
};

type AppleHealthTokenRow = {
  last_sync_at: string | null;
  last_webhook_at: string | null;
};

function tokenExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  const t = new Date(expiresAt).getTime();
  return !Number.isNaN(t) && t < Date.now();
}

function wearableState(
  row: { last_sync_at?: string | null; expires_at?: string | null; updated_at?: string | null } | null,
): { state: ConnectionState; lastSync: string | null } {
  if (!row) return { state: "disconnected", lastSync: null };
  const lastSync = row.last_sync_at ?? row.updated_at ?? null;
  if (tokenExpired(row.expires_at ?? null)) {
    return { state: "error", lastSync };
  }
  return { state: "connected", lastSync };
}

export async function fetchWearableConnections(): Promise<WearableConnection[]> {
  const [ouraRes, whoopRes, appleRes] = await Promise.all([
    stagingFrom("oura_tokens")
      .select("last_sync_at, expires_at, updated_at")
      .limit(1)
      .maybeSingle(),
    stagingFrom("whoop_tokens")
      .select("last_sync_at, expires_at, updated_at")
      .limit(1)
      .maybeSingle(),
    stagingFrom("apple_health_tokens")
      .select("last_sync_at, last_webhook_at")
      .limit(1)
      .maybeSingle(),
  ]);

  const oura = ouraRes.data as OuraTokenRow | null;
  const whoop = whoopRes.data as WhoopTokenRow | null;
  const apple = appleRes.data as AppleHealthTokenRow | null;

  const ouraConn = wearableState(oura);
  const whoopConn = wearableState(whoop);
  const appleLast = apple?.last_webhook_at ?? apple?.last_sync_at ?? null;
  const appleConnected = Boolean(apple);

  return [
    {
      id: "oura",
      state: ouraConn.state,
      label:
        ouraConn.state === "connected"
          ? "Connected"
          : ouraConn.state === "error"
            ? "Needs attention"
            : "Not connected",
      detail:
        ouraConn.state === "disconnected"
          ? "No Oura account linked in production D1."
          : ouraConn.state === "error"
            ? `Token may need refresh. Last sync ${formatRelativeTime(ouraConn.lastSync)}.`
            : `Last sync ${formatRelativeTime(ouraConn.lastSync)}.`,
      lastSync: ouraConn.lastSync,
    },
    {
      id: "whoop",
      state: whoopConn.state,
      label:
        whoopConn.state === "connected"
          ? "Connected"
          : whoopConn.state === "error"
            ? "Needs attention"
            : "Not connected",
      detail:
        whoopConn.state === "disconnected"
          ? "No Whoop account linked in production D1."
          : whoopConn.state === "error"
            ? `Token expired or refresh failed. Last sync ${formatRelativeTime(whoopConn.lastSync)}.`
            : `Last sync ${formatRelativeTime(whoopConn.lastSync)}.`,
      lastSync: whoopConn.lastSync,
    },
    {
      id: "apple",
      state: appleConnected ? "connected" : "disconnected",
      label: appleConnected ? "Connected" : "Not connected",
      detail: appleConnected
        ? `Last webhook ${formatRelativeTime(appleLast)}.`
        : "No Apple Health webhook configured in production D1.",
      lastSync: appleLast,
    },
  ];
}
