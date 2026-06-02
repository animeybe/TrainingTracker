// shared/ui/blocks/NetworkStatus/NetworkStatus.tsx
import { useState, useEffect } from "react";
import "./NetworkStatus.scss";

/**
 * Индикатор состояния сети.
 * Проверяет реальную доступность сервера (не только navigator.onLine).
 * При отключении Wi-Fi navigator.onLine может оставаться true,
 * поэтому делаем HEAD-запрос к API каждые 15 секунд.
 */
export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    /**
     * Реальная проверка: HEAD-запрос к /api/profile.
     * Если запрос прошёл — мы онлайн.
     * Если нет — офлайн (даже если navigator.onLine = true).
     */
    const checkConnectivity = async () => {
      try {
        await fetch("/api/profile", {
          method: "HEAD",
          cache: "no-store",
        });
        setIsOnline(true);
      } catch {
        setIsOnline(false);
      }
    };

    // Обработчики событий браузера
    const handleOnline = () => checkConnectivity();
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Периодическая проверка каждые 15 секунд
    const interval = setInterval(checkConnectivity, 15000);
    // Первая проверка сразу
    checkConnectivity();

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Если онлайн — ничего не показываем
  if (isOnline) return null;

  return (
    <div className="network-status">
      <span className="network-status__icon">📡</span>
      <span className="network-status__text">Нет соединения</span>
    </div>
  );
}
