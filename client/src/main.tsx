import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/globals.scss";
import { AppProviders } from "./app/providers/AppProviders";
import { registerSW } from "virtual:pwa-register";
import { initOfflineQueue } from "@/lib/offline/offlineQueue";

registerSW({ immediate: true });
initOfflineQueue();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.ready.then((registration) => {
    if (!registration.active) return;

    registration.active.addEventListener("push", (event: Event) => {
      const data = (
        event as unknown as { data?: { json: () => Record<string, string> } }
      ).data?.json() ?? {
        title: "TrainingTracker",
        body: "Новое уведомление",
      };

      registration.showNotification(data.title, {
        body: data.body,
        icon: "/manifest/icons/icon-192x192.png",
        vibrate: [200, 100, 200],
        tag: data.tag || "default",
      } as NotificationOptions);
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders />
  </StrictMode>,
);
