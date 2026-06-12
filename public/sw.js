// Purple service worker, medication reminders and static assets.

const CACHE = "purple-shell-v4";
const SHELL = ["/manifest.json", "/icon-192.png", "/icon-512.png"];
const DB_NAME = "purple-med-schedule";
const STORE = "doses";
// Delivery instrumentation: fires and acknowledgments queue here and the app
// flushes them to the server on open (src/lib/notification-delivery.ts).
const DELIVERY_STORE = "delivery_log";
const CHECK_INTERVAL_MS = 60_000;

let checkTimer = null;

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "doseId" });
      }
      if (!db.objectStoreNames.contains(DELIVERY_STORE)) {
        db.createObjectStore(DELIVERY_STORE, { autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function logDeliveryEvent(event) {
  try {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(DELIVERY_STORE, "readwrite");
      tx.objectStore(DELIVERY_STORE).add(event);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    // Instrumentation must never break the reminder itself.
    console.warn("[purple sw] delivery log failed", e);
  }
}

async function clearDoses() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function putDoses(doses) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    for (const dose of doses) {
      store.put({ ...dose, notified: false });
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getAllDoses() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result ?? []);
    req.onerror = () => reject(req.error);
  });
}

async function markNotified(doseId) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const getReq = store.get(doseId);
    getReq.onsuccess = () => {
      const row = getReq.result;
      if (row) {
        row.notified = true;
        store.put(row);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function removeDose(doseId) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(doseId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function startCheckLoop() {
  if (checkTimer) return;
  checkTimer = setInterval(() => {
    void checkDueDoses();
  }, CHECK_INTERVAL_MS);
  void checkDueDoses();
}

async function checkDueDoses() {
  const doses = await getAllDoses();
  const now = Date.now();
  const windowMs = CHECK_INTERVAL_MS;

  for (const dose of doses) {
    if (dose.notified) continue;
    const dueAt = new Date(dose.scheduledAt).getTime();
    if (dueAt <= now + windowMs && dueAt >= now - windowMs) {
      await showDoseNotification(dose);
      await markNotified(dose.doseId);
      await logDeliveryEvent({
        kind: "fired",
        doseId: dose.doseId,
        scheduledAt: dose.scheduledAt,
        firedAt: new Date().toISOString(),
        channel: "sw_local",
      });
    } else if (dueAt < now - windowMs) {
      await removeDose(dose.doseId);
    }
  }
}

async function showDoseNotification(dose) {
  const dosage = dose.dosage ? `${dose.dosage}. ` : "";
  await self.registration.showNotification(`Time for ${dose.medName}`, {
    body: `${dosage}Tap when you have taken it.`,
    tag: `med-dose-${dose.doseId}`,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    requireInteraction: true,
    data: {
      doseId: dose.doseId,
      medicationId: dose.medicationId,
      scheduledAt: dose.scheduledAt,
      channel: "sw_local",
      authToken: dose.authToken,
      supabaseUrl: dose.supabaseUrl,
      url: "/meds",
    },
    actions: [
      { action: "taken", title: "Taken" },
      { action: "skip", title: "Skip" },
      { action: "snooze", title: "Snooze 10 min" },
    ],
  });
}

async function callDoseAction(dose, action) {
  if (!dose.authToken || !dose.supabaseUrl) return;
  try {
    await fetch(`${dose.supabaseUrl}/functions/v1/med-dose-action`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${dose.authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ doseId: dose.doseId, action }),
    });
  } catch (e) {
    console.warn("[purple sw] dose action failed", e);
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
      startCheckLoop();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/oauth/")) return;

  if (req.mode === "navigate") {
    // Never serve cached HTML for app routes. A previous worker cached the
    // SSR error page under "/", which could strand signed-in users on
    // "This page didn't load" after navigating to /today.
    return;
  }

  if (["style", "script", "font", "image"].includes(req.destination)) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
            }
            return res;
          }).catch(() => cached),
      ),
    );
  }
});

self.addEventListener("message", (event) => {
  const data = event.data || {};

  if (data.type === "SCHEDULE_DOSES") {
    event.waitUntil(
      (async () => {
        await clearDoses();
        const doses = (data.doses ?? []).map((d) => ({
          doseId: d.doseId,
          medicationId: d.medicationId,
          medName: d.medName,
          dosage: d.dosage,
          scheduledAt: d.scheduledAt,
          authToken: d.authToken,
          supabaseUrl: data.supabaseUrl ?? "",
          notified: false,
        }));
        await putDoses(doses);
        startCheckLoop();
      })(),
    );
    return;
  }

  if (data.type === "show-med-notification") {
    const { title, body, tag } = data;
    self.registration.showNotification(title, {
      body,
      tag: tag || "purple-med",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: "/meds" },
    });
  }
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Purple", body: event.data.text() };
  }
  event.waitUntil(
    (async () => {
      await self.registration.showNotification(payload.title ?? "Purple", {
        body: payload.body ?? "",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        data: {
          url: payload.url ?? "/meds",
          doseId: payload.doseId ?? null,
          scheduledAt: payload.scheduledAt ?? null,
          channel: "web_push",
        },
      });
      // Receipt logging for dose pushes; the send itself is logged server-side.
      if (payload.doseId) {
        await logDeliveryEvent({
          kind: "received",
          doseId: payload.doseId,
          scheduledAt: payload.scheduledAt ?? null,
          firedAt: new Date().toISOString(),
          channel: "web_push",
        });
      }
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const targetUrl = data.url || "/meds";

  if (event.action && data.doseId) {
    event.waitUntil(
      (async () => {
        const actionMap = { taken: "taken", skip: "skip", snooze: "snooze" };
        const action = actionMap[event.action];
        if (action) {
          await callDoseAction(data, action);
          await removeDose(data.doseId);
          await logDeliveryEvent({
            kind: "acknowledged",
            doseId: data.doseId,
            scheduledAt: data.scheduledAt ?? null,
            acknowledgedAt: new Date().toISOString(),
            action,
            channel: data.channel ?? "sw_local",
          });
        }
      })(),
    );
    return;
  }

  if (data.doseId) {
    // Plain tap (no action button) still counts as an acknowledgment.
    event.waitUntil(
      logDeliveryEvent({
        kind: "acknowledged",
        doseId: data.doseId,
        scheduledAt: data.scheduledAt ?? null,
        acknowledgedAt: new Date().toISOString(),
        action: "opened",
        channel: data.channel ?? "sw_local",
      }),
    );
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl).catch(() => {});
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    }),
  );
});

self.addEventListener("notificationclose", () => {
  // No-op; dose stays in IndexedDB until taken or expired.
});
