// shared/hooks/usePushNotifications.ts
import { useState, useEffect, useCallback } from "react";
import { pushApi } from "@/shared/api";

import { logger } from "@/lib/utils/logger";
import {
  requestNotificationPermission,
  subscribeToPush,
} from "@/lib/notifications/notifications";

interface UsePushNotificationsReturn {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  toggle: () => Promise<void>;
  deviceCount: number;
}

export const usePushNotifications = (): UsePushNotificationsReturn => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deviceCount, setDeviceCount] = useState(0);

  // Проверяем поддержку
  const isSupported =
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  // При монтировании проверяем текущий статус подписки
  useEffect(() => {
    if (!isSupported) return;

    const checkSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);

        if (subscription) {
          try {
            const { count } = await pushApi.getDeviceCount();
            setDeviceCount(count);
          } catch {
            setDeviceCount(1);
          }
        }
      } catch (error) {
        logger.error("Failed to check push subscription", error as Error);
      }
    };

    checkSubscription();
  }, [isSupported]);

  // Включить/выключить уведомления
  const toggle = useCallback(async () => {
    if (!isSupported) return;

    setIsLoading(true);
    try {
      if (isSubscribed) {
        // Отписываемся
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await pushApi.unsubscribe(subscription.endpoint);
          await subscription.unsubscribe();
        }
        setIsSubscribed(false);
        setDeviceCount(0);
        logger.info("Push notifications disabled");
      } else {
        // Подписываемся
        const permission = await requestNotificationPermission();
        if (permission !== "granted") {
          alert(
            "Разрешите уведомления в настройках браузера, чтобы получать напоминания о тренировках",
          );
          return;
        }

        const subscription = await subscribeToPush();
        if (subscription) {
          setIsSubscribed(true);
          try {
            const { count } = await pushApi.getDeviceCount();
            setDeviceCount(count);
          } catch {
            setDeviceCount(1);
          }
          logger.info("Push notifications enabled");
        }
      }
    } catch (error) {
      logger.error("Failed to toggle push notifications", error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, isSubscribed]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    toggle,
    deviceCount,
  };
};
