import { useEffect } from "react";
import { ensureServiceWorker, rearmMedicationNotifications } from "@/lib/med-notifications";
import { flushDeliveryLog } from "@/lib/notification-delivery";
import { useWearableAutoSync } from "@/hooks/use-wearable-autosync";

/**
 * Startup work that must not compete with first paint. Mounted lazily from
 * the root component after the browser goes idle (see __root.tsx), which
 * also keeps these modules out of the entry chunk.
 */
export default function DeferredStartup() {
  // On app open, sync connected wearables on "visit" mode (3h throttle).
  useWearableAutoSync();

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
