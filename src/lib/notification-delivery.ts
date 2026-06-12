import { logNotificationDeliveries } from "@/lib/notification-delivery.functions";

/**
 * Flushes the service worker's queued delivery events (fires, receipts,
 * acknowledgments) to the server. Called on app open from DeferredStartup.
 * The SW writes events into IndexedDB because it has no auth context of its
 * own; the signed-in app does, so it carries them the rest of the way.
 */

const DB_NAME = "purple-med-schedule";
const DELIVERY_STORE = "delivery_log";

export type DeliveryEvent = {
  kind: "fired" | "received" | "acknowledged";
  doseId: string;
  scheduledAt: string | null;
  firedAt?: string;
  acknowledgedAt?: string;
  action?: string;
  channel: "sw_local" | "web_push";
};

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === "undefined") {
      resolve(null);
      return;
    }
    const req = indexedDB.open(DB_NAME, 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("doses")) {
        db.createObjectStore("doses", { keyPath: "doseId" });
      }
      if (!db.objectStoreNames.contains(DELIVERY_STORE)) {
        db.createObjectStore(DELIVERY_STORE, { autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

export async function flushDeliveryLog(): Promise<void> {
  const db = await openDb();
  if (!db || !db.objectStoreNames.contains(DELIVERY_STORE)) return;

  const events = await new Promise<DeliveryEvent[]>((resolve) => {
    const tx = db.transaction(DELIVERY_STORE, "readonly");
    const req = tx.objectStore(DELIVERY_STORE).getAll();
    req.onsuccess = () => resolve((req.result ?? []) as DeliveryEvent[]);
    req.onerror = () => resolve([]);
  });
  if (events.length === 0) return;

  try {
    await logNotificationDeliveries({ data: { events: events.slice(0, 200) } });
  } catch {
    // Leave events queued; the next app open retries.
    return;
  }

  await new Promise<void>((resolve) => {
    const tx = db.transaction(DELIVERY_STORE, "readwrite");
    tx.objectStore(DELIVERY_STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}
