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
