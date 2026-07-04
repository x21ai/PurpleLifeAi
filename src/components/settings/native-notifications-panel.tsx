import { useCallback, useEffect, useState } from "react";
import { Bell, BellRing, Loader2, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { callPlugin, isNativeApp, nativePlatform, plugin } from "@/lib/native/capacitor";
import { rescheduleNativeMedReminders } from "@/lib/native";

type DisplayPermission = "granted" | "denied" | "prompt";

async function readLocalNotificationPermission(): Promise<DisplayPermission | null> {
  if (!plugin("LocalNotifications")) return null;
  const result = (await callPlugin("LocalNotifications", "checkPermissions")) as
    | { display?: DisplayPermission }
    | undefined;
  return result?.display ?? "prompt";
}

async function requestLocalNotificationPermission(): Promise<DisplayPermission> {
  const result = (await callPlugin("LocalNotifications", "requestPermissions")) as
    | { display?: DisplayPermission }
    | undefined;
  return result?.display ?? "denied";
}

async function openNativeNotificationSettings(): Promise<boolean> {
  if (!isNativeApp()) return false;
  const platform = nativePlatform();
  if (platform === "ios") {
    await callPlugin("App", "openUrl", { url: "app-settings:" });
    return true;
  }
  if (platform === "android") {
    await callPlugin("App", "openUrl", { url: "package:org.purplelife.app" });
    return true;
  }
  return false;
}

export function NativeNotificationsPanel() {
  const [permission, setPermission] = useState<DisplayPermission | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setPermission(await readLocalNotificationPermission());
  }, []);

  useEffect(() => {
    void refresh();
    const onFocus = () => void refresh();
    document.addEventListener("visibilitychange", onFocus);
    return () => document.removeEventListener("visibilitychange", onFocus);
  }, [refresh]);

  const enable = async () => {
    setBusy(true);
    try {
      const display = await requestLocalNotificationPermission();
      setPermission(display);
      if (display !== "granted") {
        toast.error("Notification permission denied", {
          description: "Open Settings and allow notifications for Purple.",
        });
        return;
      }
      await rescheduleNativeMedReminders();
      toast.success("Reminders on", { description: "Purple will alert you at each scheduled dose." });
    } catch (e) {
      console.error(e);
      toast.error("Couldn't enable reminders", { description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const openSettings = async () => {
    const opened = await openNativeNotificationSettings();
    if (!opened) {
      toast.error("Couldn't open Settings", {
        description: "Open Settings, tap Purple, and turn on notifications.",
      });
    }
  };

  const statusLabel =
    permission === "granted"
      ? "Allowed"
      : permission === "denied"
        ? "Blocked"
        : permission === "prompt"
          ? "Not set"
          : null;

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <BellRing className="h-4 w-4 text-primary" />
        <h2 className="font-serif text-xl text-foreground">Medication reminders</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Local notifications on this device for every scheduled dose, even when Purple is in the background.
      </p>

      {permission === null ? (
        <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Checking notification access…
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm text-foreground">
            Status:{" "}
            <span
              className={
                permission === "granted"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : permission === "denied"
                    ? "text-destructive"
                    : "text-muted-foreground"
              }
            >
              {statusLabel}
            </span>
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {permission !== "granted" && (
              <Button onClick={() => void enable()} disabled={busy}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bell className="mr-2 h-4 w-4" />}
                Enable reminders
              </Button>
            )}
            <Button variant="outline" onClick={() => void openSettings()} disabled={busy}>
              <Settings2 className="mr-2 h-4 w-4" />
              Open Settings
            </Button>
          </div>

          {permission === "denied" && (
            <p className="mt-3 text-xs text-destructive">
              Notifications are blocked for Purple. Open Settings, tap Notifications, and allow alerts.
            </p>
          )}
        </>
      )}
    </section>
  );
}
