// main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/globals.scss";
import { AppProviders } from "./app/providers/AppProviders";
import { registerSW } from "virtual:pwa-register";
import { initOfflineQueue } from "@/lib/offline/offlineQueue";

registerSW({
  immediate: true,
  onNeedRefresh() {
    // Не показываем уведомление, обновляем молча
  },
  onOfflineReady() {
    // Не показываем уведомление
  },
});
initOfflineQueue();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders />
  </StrictMode>,
);
