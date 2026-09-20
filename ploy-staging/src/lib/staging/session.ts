import { DESIGN_PREVIEW_DEFAULT_USER_ID, isStagingLiveData, STAGING_SESSION_KEY } from "./config";

export type StagingSession = {
  access_token: string;
  expires_in?: number;
  user: {
    id: string;
    email?: string | null;
    email_confirmed_at?: string | null;
  };
};

let bootstrapPromise: Promise<boolean> | null = null;

export function getStagingSession(): StagingSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STAGING_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StagingSession;
  } catch {
    return null;
  }
}

function setStagingSession(session: StagingSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STAGING_SESSION_KEY, JSON.stringify(session));
}

export async function ensureStagingSession(): Promise<boolean> {
  if (!isStagingLiveData()) return false;
  if (typeof window === "undefined") return false;
  if (getStagingSession()?.access_token) return true;
  if (!bootstrapPromise) {
    bootstrapPromise = fetchStagingSession().finally(() => {
      bootstrapPromise = null;
    });
  }
  return bootstrapPromise;
}

async function fetchStagingSession(): Promise<boolean> {
  try {
    const res = await fetch("/api/public/design-preview/session", {
      method: "GET",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return false;
    const data = (await res.json()) as StagingSession;
    if (!data.access_token || !data.user?.id) return false;
    setStagingSession(data);
    return data.user.id === DESIGN_PREVIEW_DEFAULT_USER_ID || Boolean(data.user.id);
  } catch {
    return false;
  }
}

export function authHeaders(): Record<string, string> {
  const token = getStagingSession()?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
