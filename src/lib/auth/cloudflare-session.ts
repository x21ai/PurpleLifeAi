const STORAGE_KEY = "purple-cf-session";

export type CloudflareSession = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  user: {
    id: string;
    email?: string | null;
    email_confirmed_at?: string | null;
  };
};

function read(): CloudflareSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CloudflareSession;
  } catch {
    return null;
  }
}

export function getCloudflareSession(): CloudflareSession | null {
  return read();
}

export function setCloudflareSession(session: CloudflareSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearCloudflareSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

function accessExpiresUnix(token: string): number | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
    const payload = JSON.parse(atob(padded + pad)) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

let refreshInFlight: Promise<boolean> | null = null;

/** Rotate the access token before it expires. Does not weaken server checks. */
export async function ensureFreshCloudflareSession(force = false): Promise<boolean> {
  const session = read();
  if (!session?.refresh_token) return false;
  const exp = accessExpiresUnix(session.access_token);
  const now = Math.floor(Date.now() / 1000);
  const due = force || exp == null || exp - now <= 120;
  if (!due) return true;
  if (!refreshInFlight) {
    refreshInFlight = refreshOnce(session.refresh_token).finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function refreshOnce(refreshToken: string): Promise<boolean> {
  let res: Response;
  try {
    res = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } catch {
    return false;
  }
  const data = (await res.json().catch(() => ({}))) as Partial<CloudflareSession> & {
    user?: CloudflareSession["user"];
  };
  if (!res.ok || !data.access_token || !data.refresh_token || !data.user?.id) {
    const current = read();
    const exp = current ? accessExpiresUnix(current.access_token) : null;
    const now = Math.floor(Date.now() / 1000);
    if (exp != null && exp <= now) clearCloudflareSession();
    return false;
  }
  setCloudflareSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in ?? 3600,
    user: data.user,
  });
  return true;
}
