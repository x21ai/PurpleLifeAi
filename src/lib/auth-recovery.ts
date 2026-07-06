import { supabase } from "@/integrations/supabase/client";

/** True when the URL carries a Supabase recovery or OAuth callback payload. */
export function isAuthCallbackUrl(): boolean {
  if (typeof window === "undefined") return false;
  const { search, hash } = window.location;
  return (
    search.includes("code=") ||
    search.includes("error=") ||
    hash.includes("access_token=") ||
    hash.includes("error=")
  );
}

/** Parse PKCE `?code=` or implicit `#access_token=` recovery links from email. */
export async function bootstrapRecoverySessionFromUrl(): Promise<{
  ok: boolean;
  expired: boolean;
  message?: string;
}> {
  if (typeof window === "undefined") {
    return { ok: false, expired: false };
  }

  const { search, hash } = window.location;
  const params = new URLSearchParams(search);
  const hashParams = new URLSearchParams(
    hash.startsWith("#") ? hash.slice(1) : hash,
  );

  const errorCode =
    params.get("error_code") ?? hashParams.get("error_code") ?? undefined;
  const errorDescription =
    params.get("error_description") ??
    hashParams.get("error_description") ??
    undefined;

  if (errorCode || errorDescription) {
    return {
      ok: false,
      expired: errorCode === "otp_expired" || errorCode === "access_denied",
      message: errorDescription?.replace(/\+/g, " "),
    };
  }

  if (search.includes("code=")) {
    const { error } = await supabase.auth.exchangeCodeForSession(
      window.location.href,
    );
    if (error) {
      return {
        ok: false,
        expired: /expired|invalid/i.test(error.message),
        message: error.message,
      };
    }
  }

  for (let i = 0; i < 25; i++) {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      return { ok: true, expired: false };
    }
    await new Promise((r) => setTimeout(r, 80));
  }

  if (!isAuthCallbackUrl()) {
    return { ok: false, expired: false };
  }

  return {
    ok: false,
    expired: true,
    message: "Could not verify the reset link. Request a new one and try again.",
  };
}
