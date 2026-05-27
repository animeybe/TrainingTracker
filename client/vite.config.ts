import { defineConfig } from "vite";
import { VitePWA, type ManifestOptions } from "vite-plugin-pwa";
import react from "@vitejs/plugin-react";
import path from "path";

const manifest: Partial<ManifestOptions> | false = {
  name: "TrainingTracker",
  short_name: "TrainingTracker",
  description: "Приложение для генерации планов и помощи в тренировках",
  theme_color: "#121212",
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
      // ✅ Используем свой service-worker.js с push-обработчиками
      strategies: "injectManifest",
      injectManifest: {
        swSrc: "public/service-worker.js",
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2,json}"],
        additionalManifestEntries: [{ url: "/", revision: null }],
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
    allowedHosts: [
      "trainingtracker.ru",
      "*.trainingtracker.ru",
      "localhost",
      "127.0.0.1",
      "192.168.1.151",
    ],
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
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
});
