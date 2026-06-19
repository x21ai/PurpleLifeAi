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
 * Prerequisite registration (see docs/native-app-setup.md): the custom scheme
 * `org.purplelife.app://auth-callback` must be added to the iOS/Android native
 * projects, to the Supabase Auth redirect allow list, and to the Google/Apple
 * provider consoles.
 */
const NATIVE_REDIRECT = "org.purplelife.app://auth-callback";

let deepLinkBound = false;

export async function nativeSignInWithOAuth(provider: "google" | "apple"): Promise<boolean> {
  if (!isNativeApp()) return false;
  bindDeepLinkHandler();

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

/** Listen for the provider redirect deep link and exchange it for a session. */
function bindDeepLinkHandler(): void {
  if (deepLinkBound) return;
  const app = plugin("App");
  if (!app?.addListener) return;
  deepLinkBound = true;

  app.addListener("appUrlOpen", (data) => {
    const url = (data as { url?: string })?.url;
    if (!url || !url.startsWith(NATIVE_REDIRECT)) return;
    void completeFromUrl(url);
  });
}

async function completeFromUrl(url: string): Promise<void> {
  await callPlugin("Browser", "close", {});
  try {
    const parsed = new URL(url);
    const code = parsed.searchParams.get("code");
    if (code) {
      await supabase.auth.exchangeCodeForSession(code);
      return;
    }
    // Implicit flow: tokens arrive in the URL fragment.
    const hash = new URLSearchParams(parsed.hash.replace(/^#/, ""));
    const access_token = hash.get("access_token");
    const refresh_token = hash.get("refresh_token");
    if (access_token && refresh_token) {
      await supabase.auth.setSession({ access_token, refresh_token });
    }
  } catch (err) {
    console.warn("[native] oauth callback parse failed", err);
  }
}
