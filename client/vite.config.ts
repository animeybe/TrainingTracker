import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt", "manifest/icons/*"],
      filename: "service-worker.js",
      manifest: {
        name: "MyApp",
        short_name: "App",
        description: "Мое приложение",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
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
          {
            src: "manifest/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // @ = src/
    },
  },
  define: {
    "import.meta.env.VITE_API_URL": JSON.stringify("http://localhost:3001/api"),
  },
  server: {
    port: 5173,
  },
  preview: {
    port: 5173,
  },
});
