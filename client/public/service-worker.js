// public/service-worker.js

// ─── WORKBOX-МАРКЕР ──────────────────────────────────
const manifest = self.__WB_MANIFEST;

// ─── PUSH-УВЕДОМЛЕНИЯ ────────────────────────────────
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {
    title: "TrainingTracker",
    body: "Новое уведомление",
  };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/manifest/icons/icon-192x192.png",
      badge: "/manifest/icons/icon-192x192.png",
      vibrate: [200, 100, 200],
      tag: data.tag || "default",
      data: data.url || "/",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
