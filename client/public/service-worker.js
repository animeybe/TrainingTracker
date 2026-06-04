// public/service-worker.js
import {
  precacheAndRoute,
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
} from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import {
  CacheFirst,
  NetworkFirst,
  StaleWhileRevalidate,
} from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

// ═══════════════════════════════════════════════════════════════
// PRECACHE — Workbox автоматически вставляет __WB_MANIFEST
// ═══════════════════════════════════════════════════════════════
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// ═══════════════════════════════════════════════════════════════
// HTML-СТРАНИЦЫ: StaleWhileRevalidate
//   Мгновенно отдаёт закэшированную версию (быстрая загрузка).
//   В фоне обновляет кэш свежей версией с сервера.
//   При офлайне — тихо отдаёт кэш, без ошибки браузера.
// ═══════════════════════════════════════════════════════════════
registerRoute(
  ({ request }) => request.destination === "document",
  new StaleWhileRevalidate({
    cacheName: "pages-cache",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
      new CacheableResponsePlugin({ statuses: [200] }),
    ],
  }),
);

// ═══════════════════════════════════════════════════════════════
// NAVIGATION — fallback на index.html для SPA-маршрутов
// ═══════════════════════════════════════════════════════════════
const handler = createHandlerBoundToURL("/index.html");
const navigationRoute = new NavigationRoute(handler, {
  denylist: [/^\/api/, /^\/manifest/, /^\/screenshots/],
});
registerRoute(navigationRoute);

// ═══════════════════════════════════════════════════════════════
// СТАТИКА: StaleWhileRevalidate
//   Мгновенно отдаёт кэш, обновляет в фоне.
// ═══════════════════════════════════════════════════════════════
registerRoute(
  /\.(?:js|css|ico|png|svg|webp|woff2|json)$/,
  new StaleWhileRevalidate({
    cacheName: "static-resources",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
  "GET",
);

// ═══════════════════════════════════════════════════════════════
// API (GET): StaleWhileRevalidate
//   Мгновенно отдаёт закэшированный ответ, обновляет в фоне.
//   При офлайне — отдаст последний успешный кэш.
// ═══════════════════════════════════════════════════════════════
registerRoute(
  /\/api\/.*/,
  new StaleWhileRevalidate({
    cacheName: "api-cache",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
      new CacheableResponsePlugin({ statuses: [200] }),
    ],
  }),
  "GET",
);

// ═══════════════════════════════════════════════════════════════
// GOOGLE FONTS: CacheFirst
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
// АКТИВАЦИЯ — мгновенный захват контроля + очистка старого кэша
// ═══════════════════════════════════════════════════════════════
self.skipWaiting();
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const staticCache = await caches.open("static-resources");
      const keys = await staticCache.keys();
      for (const key of keys) await staticCache.delete(key);
      console.log("🗑 static-resources очищен при активации нового SW");
      await self.clients.claim();
    })(),
  );
});
