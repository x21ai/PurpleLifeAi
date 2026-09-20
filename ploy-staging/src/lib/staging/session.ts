import { isStagingLiveData, STAGING_SESSION_KEY } from "./config";

export type StagingSession = {
  access_token: string;
  expires_in?: number;
  user: {
    id: string;
    email?: string | null;
    email_confirmed_at?: string | null;
  };
};

export const STAGING_SIGN_IN_PATH = "/login";

/** Message for live pages when no session is stored. */
export function stagingSignInRequiredMessage(): string {
  return `Sign in at ${STAGING_SIGN_IN_PATH} to load production data.`;
}

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

export function setStagingSession(session: StagingSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STAGING_SESSION_KEY, JSON.stringify(session));
}

export function clearStagingSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STAGING_SESSION_KEY);
}

/** True when a JWT from sign-in (or prior session) is in localStorage. Does not auto-mint. */
export function hasStagingSession(): boolean {
  return Boolean(getStagingSession()?.access_token);
}

export async function ensureStagingSession(): Promise<boolean> {
  if (!isStagingLiveData()) return false;
  if (typeof window === "undefined") return false;
  return hasStagingSession();
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<{ ok: boolean; error: string | null }> {
  try {
    const res = await fetch("/api/auth/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ email: email.trim(), password }),
    });
    const data = (await res.json().catch(() => ({}))) as StagingSession & { error?: string };
    if (!res.ok) {
      return { ok: false, error: data.error ?? "Invalid email or password" };
    }
    if (!data.access_token || !data.user?.id) {
      return { ok: false, error: "Sign-in response missing token" };
    }
    setStagingSession(data);
    return { ok: true, error: null };
  } catch {
    return { ok: false, error: "Could not reach sign-in service" };
  }
}

export function signOutStaging(): void {
  clearStagingSession();
}

export function authHeaders(): Record<string, string> {
  const token = getStagingSession()?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
