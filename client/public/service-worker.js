// public/service-worker.js
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { CacheFirst, NetworkOnly } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { createHandlerBoundToURL } from "workbox-precaching";

// Workbox вставит precache-манифест сюда автоматически
precacheAndRoute(self.__WB_MANIFEST);

cleanupOutdatedCaches();

// Navigation route (SPA fallback)
registerRoute(
  new NavigationRoute(createHandlerBoundToURL("/index.html"), {
    denylist: [/^\/api/, /^\/manifest/, /^\/screenshots/],
  }),
);

// Статика: CacheFirst
registerRoute(
  /\.(?:js|css|html|ico|png|svg|webp|woff2|json)$/,
  new CacheFirst({
    cacheName: "static-resources",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  }),
  "GET",
);

// API: только сеть
registerRoute(/\/api\/.*/, new NetworkOnly(), "GET");

// Google Fonts
registerRoute(
  /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
  new CacheFirst({
    cacheName: "google-fonts",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  }),
  "GET",
);

// ─── PUSH-УВЕДОМЛЕНИЯ ────────────────────────────────
self.addEventListener("push", (event) => {
  console.log("📨 Push получен!", event);

  let data;
  try {
    data = event.data?.json();
  } catch {
    data = {
      title: "TrainingTracker",
      body: event.data?.text() || "Новое уведомление",
    };
  }

  console.log("📨 Данные уведомления:", data);

  const options = {
    body: data.body || "Новое уведомление",
    icon: "/manifest/icons/icon-192x192.png",
    badge: "/manifest/icons/icon-192x192.png",
    vibrate: [200, 100, 200],
    tag: data.tag || "default",
    data: data.url || "/",
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || "TrainingTracker",
      options,
    ),
  );
});

self.addEventListener("notificationclick", (event) => {
  console.log("👆 Клик по уведомлению");
  event.notification.close();

  const url = event.notification.data || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    }),
  );
});
