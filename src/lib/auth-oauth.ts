import { supabase } from "@/integrations/supabase/client";

/** OAuth redirect target after Apple / Google sign-in (must match Supabase allow list). */
export function oauthRedirectUrl(): string {
  if (typeof window === "undefined") return "/";
  return `${window.location.origin}/`;
}

export function isOAuthCallbackUrl(): boolean {
  if (typeof window === "undefined") return false;
  const { search, hash } = window.location;
  return (
    search.includes("code=") ||
    search.includes("error=") ||
    hash.includes("access_token=") ||
    hash.includes("error=")
  );
}

/** Wait for Supabase to finish parsing the OAuth callback in the URL. */
export async function waitForOAuthSession(maxAttempts = 25, delayMs = 80): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    const { data } = await supabase.auth.getSession();
    if (data.session) return true;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}
