import {
  isNativeApp,
  nativePlatform,
  nativeBridgeReady,
  nativeAppBuildInfo,
  plugin,
  callPlugin,
} from "./capacitor";
import { loadUpcomingScheduledDoses } from "@/lib/med-notifications";
import { registerDeviceToken as saveNativePushToken } from "@/lib/native-push.functions";
import { captureSyncError } from "@/lib/observability/client-errors";
import { initNativeOAuthDeepLink } from "./oauth";
import { initNativeWearableOAuthDeepLink } from "./wearable-oauth";

export { isNativeApp, nativePlatform, nativeBridgeReady, nativeAppBuildInfo } from "./capacitor";
export {
  clearLastNativeLaunchIssue,
  getLastNativeLaunchIssue,
  isNativeDiagnosticsEnabled,
  onNativeDiagFlagChange,
  onNativeLaunchIssueChange,
  type NativeLaunchIssue,
} from "./capacitor";
export { isNativeIos, useNativeIos } from "./use-native-ios";
export { useNativeApp } from "./use-native-app";
export { NativeShellProvider, useRouteShellConfig, useShell } from "./shell-context";
export {
  DEFAULT_SHELL,
  SHELL_ROUTE_OVERRIDES,
  resolveShellConfig,
  type RouteShellConfig,
} from "./shell-routes";
export {
  getNativeHealthAuthorizationStatus,
  isNativeHealthAvailable,
  nativeHealthSource,
  openNativeHealthSettings,
  readNativeHealthMetrics,
  requestNativeHealthPermissions,
} from "./health";

let initialized = false;
let launchChromeHidden = false;
let initInFlight: Promise<void> | null = null;
let bridgeTimeoutReported = false;

const BRIDGE_MESSAGE_SOURCE = "purple-native";
const BRIDGE_TIMEOUT_CODE = "capacitor_bridge_unavailable";

/** Hide Capacitor launch splash and style status bar as soon as the bridge is ready. */
export async function hideNativeLaunchChrome(): Promise<void> {
  if (!isNativeApp() || launchChromeHidden) return;
  launchChromeHidden = true;
  try {
    await callPlugin("StatusBar", "setStyle", { style: "DARK" });
    if (nativePlatform() === "android") {
      await callPlugin("StatusBar", "setBackgroundColor", { color: "#0a0710" });
    }
    await callPlugin("SplashScreen", "hide", {});
  } catch (err) {
    console.warn("[native] hideNativeLaunchChrome failed", err);
  }
}

/**
 * One-time native shell setup, called from DeferredStartup after idle. Every
 * step is guarded so this is a complete no-op on the web. Steps:
 *  - style the status bar and hide the launch splash
 *  - register push (APNs/FCM) and hand the device token to the backend
 *  - schedule native Local Notifications for upcoming medication doses
 *  - make the hardware back button behave on Android
 */
export async function initNativeApp(): Promise<void> {
  if (!isNativeApp() || initialized) return;
  if (initInFlight) return initInFlight;

  initInFlight = (async () => {
    try {
      const bridgeReady = await waitForNativeBridge();
      if (!bridgeReady) return;
      if (!isNativeApp() || initialized) return;
      initialized = true;

      await hideNativeLaunchChrome();

      initNativeOAuthDeepLink();
      initNativeWearableOAuthDeepLink();
      // Remote push ships when APNs is configured (see docs/native-app-store-review.md).
      // await setupPushNotifications();
      await scheduleNativeMedReminders();
      setupAndroidBackButton();
    } catch (err) {
      console.warn("[native] initNativeApp failed", err);
      captureSyncError(err, "native.init");
      initialized = false;
    } finally {
      initInFlight = null;
    }
  })();

  return initInFlight;
}

/** Re-schedule native local dose reminders after med edits (no-op on web). */
export async function rescheduleNativeMedReminders(): Promise<void> {
  if (!isNativeApp()) return;
  await scheduleNativeMedReminders();
}

/**
 * Register for native push and forward the device token to the backend.
 * Delivery (APNs/FCM) needs Apple/Google credentials and a device-token table,
 * which are account-gated; see docs/native-app-setup.md. Until that backend is
 * provisioned the token is captured here and the POST endpoint is a no-op.
 */
async function setupPushNotifications(): Promise<void> {
  const push = plugin("PushNotifications");
  if (!push) return;

  const perm = (await callPlugin("PushNotifications", "requestPermissions")) as
    | { receive?: string }
    | undefined;
  if (perm?.receive !== "granted") return;

  push.addListener?.("registration", (data) => {
    const token = (data as { value?: string })?.value;
    if (token) void registerDeviceToken(token);
  });
  push.addListener?.("registrationError", (err) => {
    console.warn("[native] push registration error", err);
    captureSyncError(err, "native.push.registration");
  });

  await callPlugin("PushNotifications", "register");
}

async function registerDeviceToken(token: string): Promise<void> {
  const platform = nativePlatform();
  if (platform !== "ios" && platform !== "android") return;
  try {
    await saveNativePushToken({ data: { token, platform } });
  } catch (err) {
    console.warn("[native] failed to register push token", err);
    captureSyncError(err, "native.push.token");
  }
}

/**
 * Mirror the medication reminder schedule into native Local Notifications.
 * The web service worker alarm loop does not run inside a native WebView, so
 * the native shell owns dose reminders while installed.
 */
async function scheduleNativeMedReminders(): Promise<void> {
  try {
    const ln = plugin("LocalNotifications");
    if (!ln) return;

    const existing = (await callPlugin("LocalNotifications", "checkPermissions")) as
      | { display?: string }
      | undefined;
    let display = existing?.display;
    if (display !== "granted") {
      const perm = (await callPlugin("LocalNotifications", "requestPermissions")) as
        | { display?: string }
        | undefined;
      display = perm?.display;
    }
    if (display !== "granted") return;

    const doses = await loadUpcomingScheduledDoses();
    const now = Date.now();
    const notifications = doses
      .filter((d) => new Date(d.scheduledAt).getTime() > now)
      .slice(0, 60)
      .map((d) => ({
        id: hashId(d.doseId),
        title: "Time for your medication",
        body: d.dosage ? `${d.medName} (${d.dosage})` : d.medName,
        schedule: { at: new Date(d.scheduledAt) },
        extra: { doseId: d.doseId, url: "/meds" },
      }));

    if (notifications.length === 0) return;
    // Clear any stale schedule first so edits do not leave orphan reminders.
    const pending = (await callPlugin("LocalNotifications", "getPending")) as
      | { notifications?: Array<{ id: number }> }
      | undefined;
    if (pending?.notifications?.length) {
      await callPlugin("LocalNotifications", "cancel", {
        notifications: pending.notifications.map((n) => ({ id: n.id })),
      });
    }
    await callPlugin("LocalNotifications", "schedule", { notifications });
  } catch (err) {
    console.warn("[native] scheduleNativeMedReminders failed", err);
    captureSyncError(err, "native.med-reminders");
  }
}

function setupAndroidBackButton(): void {
  const app = plugin("App");
  app?.addListener?.("backButton", (data) => {
    const canGoBack = (data as { canGoBack?: boolean })?.canGoBack;
    if (canGoBack) {
      window.history.back();
    } else {
      void callPlugin("App", "exitApp");
    }
  });
}

function publishBridgeTimeoutIssue(timeoutMs: number): void {
  if (typeof window === "undefined" || bridgeTimeoutReported) return;
  bridgeTimeoutReported = true;

  const buildParam = new URLSearchParams(window.location.search).get("build");
  const timeoutError = `Timed out after ${timeoutMs}ms waiting for core Capacitor plugins.`;
  const issue = {
    code: BRIDGE_TIMEOUT_CODE,
    message: "Capacitor bridge failed to initialize.",
    error: timeoutError,
    url: window.location.href,
    at: new Date().toISOString(),
    build: buildParam || undefined,
  };

  window.dispatchEvent(new CustomEvent("purple:native-launch-error", { detail: issue }));
  try {
    window.postMessage(
      {
        source: BRIDGE_MESSAGE_SOURCE,
        type: "launch-error",
        payload: issue,
      },
      "*",
    );
  } catch {
    // Ignore postMessage failures, local event dispatch already fired.
  }

  console.warn("[native] bridge unavailable after timeout");
  captureSyncError(new Error(timeoutError), "native.bridge.timeout");
}

async function waitForNativeBridge(timeoutMs = 2500): Promise<boolean> {
  if (!isNativeApp()) return false;
  const hasCorePlugins = () => Boolean(plugin("SplashScreen") || plugin("StatusBar"));
  if (hasCorePlugins()) return true;

  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    await new Promise<void>((resolve) => window.setTimeout(resolve, 50));
    if (hasCorePlugins()) return true;
  }

  publishBridgeTimeoutIssue(timeoutMs);
  return false;
}

/** Stable positive 31-bit int id from a uuid string (LocalNotifications needs numeric ids). */
function hashId(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
