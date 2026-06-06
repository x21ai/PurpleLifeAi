import { useEffect, useState } from "react";
import { Bell, BellRing, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { subscribePush, unsubscribePush, sendTestPush } from "@/lib/push.functions";
import { getOrCreatePushSubscription, removePushSubscription } from "@/lib/push-client";
import { notificationsSupported, isStandalonePwa, requestPermission, ensureServiceWorker } from "@/lib/med-notifications";

export function PhoneAlarmsSection() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [standalone, setStandalone] = useState(false);

  const subscribe = useServerFn(subscribePush);
  const unsubscribe = useServerFn(unsubscribePush);
  const sendTest = useServerFn(sendTestPush);

  useEffect(() => {
    setSupported(notificationsSupported() && typeof window !== "undefined" && "PushManager" in window);
    setStandalone(isStandalonePwa());
    if (typeof Notification !== "undefined") setPermission(Notification.permission);
    (async () => {
      const reg = await ensureServiceWorker();
      if (!reg) return;
      const sub = await reg.pushManager.getSubscription();
      setEnabled(!!sub);
    })();
  }, []);

  const enable = async () => {
    setBusy(true);
    try {
      const perm = await requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        toast.error("Notification permission denied", {
          description: "Enable notifications for Purple in your browser settings.",
        });
        return;
      }
      const sub = await getOrCreatePushSubscription();
      if (!sub) {
        toast.error("Couldn't subscribe", { description: "Your browser blocked the subscription." });
        return;
      }
      await subscribe({ data: sub });
      setEnabled(true);
      toast.success("Phone alarms on", { description: "We'll ring every dose, even with the app closed." });
    } catch (e) {
      console.error(e);
      toast.error("Couldn't enable alarms", { description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      const endpoint = await removePushSubscription();
      if (endpoint) await unsubscribe({ data: { endpoint } });
      setEnabled(false);
      toast.success("Phone alarms off");
    } catch (e) {
      toast.error("Couldn't disable", { description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    setBusy(true);
    try {
      const res = await sendTest({ data: undefined });
      if (res.ok) toast.success(`Test sent to ${res.sent} device${res.sent === 1 ? "" : "s"}`);
      else toast.error("No devices subscribed");
    } catch (e) {
      toast.error("Test failed", { description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <BellRing className="h-4 w-4 text-primary" />
        <h2 className="font-serif text-xl text-foreground">Phone alarms</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Get a real phone notification for every scheduled dose, even when Purple is closed.
      </p>

      {!supported && (
        <p className="mt-4 text-sm text-muted-foreground">
          This browser doesn't support push notifications. Try Chrome, Firefox, or install Purple to your home screen on iOS 16.4+.
        </p>
      )}

      {supported && !standalone && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-secondary/40 p-3 text-xs text-muted-foreground">
          <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>
            For best results on phones, install Purple first: open the share menu and pick <strong>Add to Home Screen</strong>. iOS only fires alarms for installed PWAs.
          </span>
        </div>
      )}

      {supported && (
        <div className="mt-5 flex flex-wrap gap-2">
          {!enabled ? (
            <Button onClick={enable} disabled={busy}>
              <Bell className="mr-2 h-4 w-4" /> Enable phone alarms
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={test} disabled={busy}>Send test alarm</Button>
              <Button variant="ghost" onClick={disable} disabled={busy}>Turn off</Button>
            </>
          )}
        </div>
      )}

      {permission === "denied" && (
        <p className="mt-3 text-xs text-destructive">
          Notifications are blocked in this browser. Open site settings and allow notifications for Purple.
        </p>
      )}
    </section>
  );
}