// shared/hooks/useProfile.ts
import { useState, useEffect, useCallback } from "react";
import { profileApi } from "@/shared/api/profileApi";
import type { ProfileData } from "@/shared/api/types";
import { logger } from "@/lib/utils/logger";

// ==================== КОНСТАНТЫ ====================
const PROFILE_CACHE_KEY = "user_profile_cache";
const PROFILE_MAX_AGE_DAYS = 7; // 7 дней — как и план

// ==================== ФУНКЦИИ КЭШИРОВАНИЯ ====================

/**
 * Сохранить профиль в localStorage с меткой времени
 */
const saveProfileToCache = (profile: ProfileData): void => {
  try {
    const cacheData = {
      data: profile,
      timestamp: Date.now(),
    };
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cacheData));
    console.log("💾 Профиль сохранён в кэш");
  } catch (error) {
    console.error("Ошибка сохранения профиля в кэш:", error);
  }
};

/**
 * Загрузить профиль из localStorage
 * @returns ProfileData | null (null если нет кэша или кэш устарел)
 */
const loadProfileFromCache = (): ProfileData | null => {
  try {
    const cached = localStorage.getItem(PROFILE_CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const daysDiff = Math.floor(
      (Date.now() - timestamp) / (1000 * 60 * 60 * 24),
    );

    if (daysDiff > PROFILE_MAX_AGE_DAYS) {
      console.log(`⏰ Кэш профиля устарел (${daysDiff} дней), удаляем`);
      localStorage.removeItem(PROFILE_CACHE_KEY);
      return null;
    }

    console.log(`📦 Профиль загружен из кэша, возраст ${daysDiff} дней`);
    return data;
  } catch (error) {
    console.error("Ошибка загрузки профиля из кэша:", error);
    return null;
  }
};

/**
 * Очистить кэш профиля (при выходе из аккаунта)
 */
export const clearProfileCache = (): void => {
  localStorage.removeItem(PROFILE_CACHE_KEY);
  console.log("🗑️ Кэш профиля очищен");
};

// ==================== ХУК ====================

export const useProfile = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Следить за статусом сети
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      console.log("🌐 Интернет появился — обновляем профиль");
      loadProfile(); // Перезагружаем свежие данные
    };

    const handleOffline = () => {
      setIsOffline(true);
      console.log("📴 Интернет пропал — используем кэш профиля");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const loadProfile = useCallback(async () => {
    setLoadingProfile(true);

    // Если есть интернет — загружаем свежие данные
    if (navigator.onLine) {
      try {
        const data = await profileApi.getProfile();
        setProfile(data);
        saveProfileToCache(data);
        console.log("🌐 Профиль загружен из API");
      } catch (error) {
        logger.error("Failed to load profile from API", error as Error);
        // При ошибке API — пробуем загрузить из кэша
        const cachedProfile = loadProfileFromCache();
        if (cachedProfile) {
          setProfile(cachedProfile);
          console.log("📦 Профиль загружен из кэша (API ошибка)");
        }
      }
    } else {
      // Нет интернета — только кэш
      const cachedProfile = loadProfileFromCache();
      if (cachedProfile) {
        setProfile(cachedProfile);
        console.log("📴 Офлайн: профиль загружен из кэша");
      } else {
        console.log("📴 Офлайн: кэш профиля пуст");
      }
    }

    setLoadingProfile(false);
  }, []);

  // Обновление профиля (с офлайн-поддержкой)
  const updateProfile = useCallback(
    async (data: Parameters<typeof profileApi.update>[0]) => {
      setLoadingProfile(true);
      try {
        const updatedProfile = await profileApi.update(data);
        setProfile(updatedProfile);
        saveProfileToCache(updatedProfile);
        console.log("✅ Профиль обновлён и сохранён в кэш");
        return updatedProfile;
      } catch (error) {
        // Запрос уже в очереди (через apiRequest)
        // Кэш не обновляем, так как данные не подтверждены сервером
        logger.error("Failed to update profile", error as Error);
        throw error;
      } finally {
        setLoadingProfile(false);
      }
    },
    [],
  );

  // Первоначальная загрузка
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return {
    profile,
    loadingProfile,
    isOffline,
    reloadProfile: loadProfile,
    updateProfile,
  };
};
