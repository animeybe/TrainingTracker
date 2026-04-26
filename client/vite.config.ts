import { defineConfig } from "vite";
import { VitePWA, type ManifestOptions } from "vite-plugin-pwa";
import react from "@vitejs/plugin-react";
import path from "path";

const manifest: Partial<ManifestOptions> | false = {
  name: "TrainingTracker",
  short_name: "TrainingTracker",
  description: "Приложение для генерации планов и помощи в тренировках",
  theme_color: "#C74A3B",
  background_color: "#121212",
  lang: "ru-RU",
  display: "standalone",
  start_url: "/",
  screenshots: [
    {
      src: "screenshots/desctop.png",
      type: "image/png",
      sizes: "1795x980",
      form_factor: "wide",
    },
    {
      src: "screenshots/mobile.png",
      type: "image/png",
      sizes: "414x899",
      form_factor: "narrow",
    },
  ],
  icons: [
    {
      src: "manifest/icons/icon-192x192.png",
      sizes: "192x192",
      type: "image/png",
    },
    {
      src: "manifest/icons/icon-512x512.png",
      sizes: "512x512",
      type: "image/png",
    },
  ],
};

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt", "manifest/icons/*"],
      filename: "service-worker.js",
      manifest: manifest,
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2,json}"],

        // ── Cache‑first для статики (неделя) ──
        runtimeCaching: [
          // 1. Статика: Cache‑first + Fallback
          {
            urlPattern: /\.(?:js|css|html|ico|png|svg|webp|woff2|json)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "static-resources",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 дней
              },
              // Fallback: если нет в кеше — всегда идём в сеть
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },

          // 2. API‑запросы: Network‑first + Fallback (Stale‑While‑Revalidate)
          {
            urlPattern: /\/api\/.*/,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-responses",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 24 * 60 * 60, // 1 день для API
              },
              networkTimeoutSeconds: 5, // ждём сеть 5 сек, затем кеш
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },

          // 3. Шрифты Google
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 дней
              },
            },
          },
          // 4. Fallback‑кеш
          {
            urlPattern: /\/api\/profile|\/api\/plan/,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-fallback", // отдельный кеш
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 дней — fallback
              },
              networkTimeoutSeconds: 3,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://192.168.1.151:3001",
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5173,
  },
});
