// Purple medication reminder service worker.
// Scheduled reminders are driven by setTimeout from the main thread (postMessage),
// the worker only owns notification display + click handling.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "show-med-notification") {
    const { title, body, tag } = data;
    self.registration.showNotification(title, {
      body,
      tag: tag || "purple-med",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      requireInteraction: false,
      data: { url: "/" },
    });
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";
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