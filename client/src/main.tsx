// main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/globals.scss";
import { AppProviders } from "./app/providers/AppProviders";
import { registerSW } from "virtual:pwa-register";
import { initOfflineQueue } from "@/lib/offline/offlineQueue";

// Регистрируем Service Worker с автообновлением
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true).then(() => {
      window.location.reload();
    });
  },
  onRegisteredSW(_swUrl, registration) {
    // Проверяем обновления каждый час
    if (registration) {
      setInterval(
        () => {
          registration.update();
        },
        60 * 60 * 1000,
      );
    }
  },
});

// Инициализируем очередь офлайн-запросов
initOfflineQueue();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders />
  </StrictMode>,
);
