// public/service-worker.js
import {
  precacheAndRoute,
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
} from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

// ═══════════════════════════════════════════════════════════════
// PRECACHE — автоматически вставлен Workbox
// ═══════════════════════════════════════════════════════════════
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// ═══════════════════════════════════════════════════════════════
// NAVIGATION — все маршруты → index.html (SPA fallback)
// ═══════════════════════════════════════════════════════════════
const handler = createHandlerBoundToURL("/index.html");
const navigationRoute = new NavigationRoute(handler, {
  denylist: [/^\/api/, /^\/manifest/, /^\/screenshots/],
});
registerRoute(navigationRoute);

// ═══════════════════════════════════════════════════════════════
// СТАТИКА: CacheFirst (JS, CSS, картинки, шрифты — почти не меняются)
// ═══════════════════════════════════════════════════════════════
registerRoute(
  /\.(?:js|css|html|ico|png|svg|webp|woff2|json)$/,
  new CacheFirst({
    cacheName: "static-resources",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 дней
      }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
  "GET",
);

// ═══════════════════════════════════════════════════════════════
// API: NetworkFirst (сеть → fallback на кэш через 3 секунды)
// Это решает проблему: при отключении Wi-Fi navigator.onLine = true,
// но запросы не проходят. Через 3 секунды таймаута отдаём кэш.
// ═══════════════════════════════════════════════════════════════
registerRoute(
  /\/api\/.*/,
  new NetworkFirst({
    cacheName: "api-cache",
    networkTimeoutSeconds: 3, // ждём сеть 3 секунды, потом кэш
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 дней
      }),
      new CacheableResponsePlugin({ statuses: [200] }),
    ],
  }),
  "GET",
);

// ═══════════════════════════════════════════════════════════════
// GOOGLE FONTS: CacheFirst (почти никогда не меняются)
// ═══════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════
// PUSH-УВЕДОМЛЕНИЯ
// ═══════════════════════════════════════════════════════════════
self.addEventListener("push", (event) => {
  let data;
  try {
    data = event.data?.json();
  } catch {
    data = {
      title: "TrainingTracker",
      body: event.data?.text() || "Новое уведомление",
    };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "TrainingTracker", {
      body: data.body,
      icon: "/manifest/icons/icon-192x192.png",
      badge: "/manifest/icons/icon-192x192.png",
      vibrate: [200, 100, 200],
      tag: data.tag || "default",
      data: data.url || "/",
      requireInteraction: data.requireInteraction || false,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === event.notification.data && "focus" in client)
          return client.focus();
      }
      if (self.clients.openWindow)
        return self.clients.openWindow(event.notification.data || "/");
    }),
  );
});

// ═══════════════════════════════════════════════════════════════
// АКТИВАЦИЯ — мгновенно захватываем контроль над страницами
// ═══════════════════════════════════════════════════════════════
self.skipWaiting();
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
