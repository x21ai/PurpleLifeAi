/**
 * Build a native app URL that carries a Worker JWT after web OAuth.
 * Returns null when [state] is a normal in-site path.
 */
export function nativeOAuthHandoffUrl(
  state: string,
  session: {
    access_token: string;
    expires_in?: number;
    user?: { id?: string; email?: string | null };
  },
): string | null {
  let decoded = state;
  try {
    decoded = decodeURIComponent(state);
  } catch {
    decoded = state;
  }
  if (!decoded.startsWith("org.purplelife.app://")) return null;

  const url = new URL(decoded);
  url.searchParams.set("access_token", session.access_token);
  url.searchParams.set("expires_in", String(session.expires_in ?? 3600));
  url.searchParams.set("token_type", "bearer");
  if (session.user?.id) url.searchParams.set("user_id", session.user.id);
  if (session.user?.email) url.searchParams.set("email", session.user.email);
  return url.toString();
}
