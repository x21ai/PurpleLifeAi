import { supabase } from "@/integrations/supabase/client";
import { exchangeWhoopAuthCode } from "@/lib/whoop.functions";
import { isNativeApp, plugin, callPlugin } from "./capacitor";

/**
 * Native wearable OAuth (Oura, Whoop).
 *
 * Popups break in WKWebView, so on the native shell we open the provider consent
 * URL in the system browser and finish when the provider redirects to a custom
 * scheme deep link. Register the native redirect URIs in the Oura and Whoop
 * developer consoles (see docs/native-oauth-setup.md).
 */
export type WearableOAuthProvider = "oura" | "whoop";

const NATIVE_REDIRECT: Record<WearableOAuthProvider, string> = {
  oura: "org.purplelife.app://oauth-oura-callback",
  whoop: "org.purplelife.app://oauth-whoop-callback",
};

const CONNECTED_EVENT: Record<WearableOAuthProvider, string> = {
  oura: "oura-connected",
  whoop: "whoop-connected",
};

let deepLinkBound = false;

export function nativeWearableRedirectUri(provider: WearableOAuthProvider): string {
  return NATIVE_REDIRECT[provider];
}

/** Bind deep link listeners early (e.g. from initNativeApp) for cold-start OAuth. */
export function initNativeWearableOAuthDeepLink(): void {
  bindDeepLinkHandler();
}

export async function nativeOpenWearableOAuth(url: string): Promise<boolean> {
  if (!isNativeApp()) return false;
  initNativeWearableOAuthDeepLink();
  await callPlugin("Browser", "open", { url, presentationStyle: "popover" });
  return true;
}

function providerFromCallbackUrl(url: string): WearableOAuthProvider | null {
  if (url.startsWith(NATIVE_REDIRECT.oura)) return "oura";
  if (url.startsWith(NATIVE_REDIRECT.whoop)) return "whoop";
  return null;
}

function bindDeepLinkHandler(): void {
  if (deepLinkBound) return;
  const app = plugin("App");
  if (!app?.addListener) return;
  deepLinkBound = true;

  app.addListener("appUrlOpen", (data) => {
    const url = (data as { url?: string })?.url;
    if (!url) return;
    const provider = providerFromCallbackUrl(url);
    if (provider) void completeWearableOAuth(url, provider);
  });

  void callPlugin("App", "getLaunchUrl", {}).then((result) => {
    const url = (result as { url?: string } | undefined)?.url;
    if (!url) return;
    const provider = providerFromCallbackUrl(url);
    if (provider) void completeWearableOAuth(url, provider);
  });
}

async function completeWearableOAuth(
  url: string,
  provider: WearableOAuthProvider,
): Promise<void> {
  await callPlugin("Browser", "close", {});
  try {
    const parsed = new URL(url);
    const oauthError = parsed.searchParams.get("error");
    if (oauthError) {
      console.warn(
        `[native] ${provider} oauth callback error`,
        oauthError,
        parsed.searchParams.get("error_description"),
      );
      return;
    }

    const code = parsed.searchParams.get("code");
    if (!code) {
      console.warn(`[native] ${provider} oauth callback missing code`);
      return;
    }

    const redirect_uri = NATIVE_REDIRECT[provider];
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) {
      console.warn(`[native] ${provider} oauth callback: not signed in`);
      return;
    }

    const state = parsed.searchParams.get("state");
    if (state && state !== sess.session.user.id) {
      console.warn(`[native] ${provider} oauth state mismatch`);
      return;
    }

    if (provider === "oura") {
      const res = await supabase.functions.invoke("oura-sync", {
        body: { action: "exchange", code, redirect_uri },
      });
      if (res.error) {
        console.warn("[native] oura oauth exchange failed", res.error);
        return;
      }
    } else {
      try {
        await exchangeWhoopAuthCode({ data: { code, redirect_uri } });
      } catch (err) {
        console.warn("[native] whoop oauth exchange failed", err);
        return;
      }
    }

    notifyConnected(provider);
  } catch (err) {
    console.warn(`[native] ${provider} oauth callback parse failed`, err);
  }
}

function notifyConnected(provider: WearableOAuthProvider): void {
  const type = CONNECTED_EVENT[provider];
  try {
    window.postMessage({ type }, window.location.origin);
  } catch {
    /* ignore */
  }
}
