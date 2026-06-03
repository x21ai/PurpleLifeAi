const KEY = "purple-invite-code";

export function captureInviteFromUrl(): void {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("invite");
    if (!code) return;
    localStorage.setItem(KEY, code.trim().toUpperCase());
    params.delete("invite");
    const qs = params.toString();
    const next = window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash;
    window.history.replaceState({}, "", next);
  } catch {
    /* ignore */
  }
}

export function getStoredInvite(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setStoredInvite(code: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!code) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, code.trim().toUpperCase());
  } catch {
    /* ignore */
  }
}

export function clearStoredInvite(): void {
  setStoredInvite(null);
}