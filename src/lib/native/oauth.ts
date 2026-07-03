import { supabase } from "@/integrations/supabase/client";
import { isNativeApp, plugin, callPlugin } from "./capacitor";

/**
 * Native OAuth.
 *
 * Google blocks its consent screen inside embedded WebViews, so on the native
 * shell we must not let signInWithOAuth navigate the WebView. Instead we fetch
 * the provider URL (skipBrowserRedirect), open it in the system browser
 * (ASWebAuthenticationSession on iOS / Chrome Custom Tabs on Android via the
 * Capacitor Browser plugin), and complete the session when the provider
 * redirects back to the app deep link.
 *
 * Prerequisite registration (see docs/native-oauth-setup.md): the custom scheme
 * `org.purplelife.app://auth-callback` must be added to the iOS/Android native
 * projects and to the Supabase Auth redirect allow list.
 */
const NATIVE_REDIRECT = "org.purplelife.app://auth-callback";

let deepLinkBound = false;

/** Bind deep link listeners early (e.g. from initNativeApp) for cold-start OAuth. */
export function initNativeOAuthDeepLink(): void {
  bindDeepLinkHandler();
}

export async function nativeSignInWithOAuth(provider: "google" | "apple"): Promise<boolean> {
  if (!isNativeApp()) return false;
  initNativeOAuthDeepLink();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: NATIVE_REDIRECT, skipBrowserRedirect: true },
  });
  if (error || !data?.url) {
    console.warn("[native] oauth url error", error);
    return false;
  }
  await callPlugin("Browser", "open", { url: data.url, presentationStyle: "popover" });
  return true;
}

function isNativeOAuthCallback(url: string): boolean {
  return url.startsWith(NATIVE_REDIRECT);
}

/** Listen for the provider redirect deep link and exchange it for a session. */
function bindDeepLinkHandler(): void {
  if (deepLinkBound) return;
  const app = plugin("App");
  if (!app?.addListener) return;
  deepLinkBound = true;

  app.addListener("appUrlOpen", (data) => {
    const url = (data as { url?: string })?.url;
    if (!url || !isNativeOAuthCallback(url)) return;
    void completeFromUrl(url);
  });

  // Cold start: app was killed while the system browser finished OAuth.
  void callPlugin("App", "getLaunchUrl", {}).then((result) => {
    const url = (result as { url?: string } | undefined)?.url;
    if (url && isNativeOAuthCallback(url)) void completeFromUrl(url);
  });
}

async function completeFromUrl(url: string): Promise<void> {
  await callPlugin("Browser", "close", {});
  try {
    const parsed = new URL(url);
    const oauthError = parsed.searchParams.get("error");
    if (oauthError) {
      console.warn(
        "[native] oauth callback error",
        oauthError,
        parsed.searchParams.get("error_description"),
      );
      return;
    }

    const code = parsed.searchParams.get("code");
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) console.warn("[native] oauth code exchange failed", error);
      return;
    }

    // Implicit flow: tokens arrive in the URL fragment.
    const hash = new URLSearchParams(parsed.hash.replace(/^#/, ""));
    const hashError = hash.get("error");
    if (hashError) {
      console.warn("[native] oauth callback error", hashError, hash.get("error_description"));
      return;
    }
    const access_token = hash.get("access_token");
    const refresh_token = hash.get("refresh_token");
    if (access_token && refresh_token) {
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) console.warn("[native] oauth setSession failed", error);
    }
  } catch (err) {
    console.warn("[native] oauth callback parse failed", err);
  }
}
