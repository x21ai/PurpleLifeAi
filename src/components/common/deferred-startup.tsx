import { useEffect } from "react";
import { ensureServiceWorker, rearmMedicationNotifications } from "@/lib/med-notifications";
import { flushDeliveryLog } from "@/lib/notification-delivery";
import { useOuraDailyAutoSync } from "@/hooks/use-oura-daily-autosync";

/**
 * Startup work that must not compete with first paint. Mounted lazily from
 * the root component after the browser goes idle (see __root.tsx), which
 * also keeps these modules out of the entry chunk.
 */
export default function DeferredStartup() {
  // Fire a background Oura sync once per session if the data is > 20h old.
  useOuraDailyAutoSync();

  // Register the service worker for medication reminders only. The helper
  // refuses registration in preview/iframe/dev and clears stale shell caches.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void ensureServiceWorker();
    // Repopulate the SW's IndexedDB schedule after every reload so dose
    // reminders survive page refreshes / app restarts.
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      void rearmMedicationNotifications();
    }
    // Carry the SW's queued delivery events (fires/acks) up to the server.
    void flushDeliveryLog().catch(() => undefined);
  }, []);

  return null;
}
