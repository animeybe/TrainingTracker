// shared/hooks/useExercises.ts
/**
 * useExercises — управление упражнениями, избранным, нелюбимыми.
 *
 * Архитектура офлайн-режима:
 *   - Все списки кэшируются в localStorage при загрузке из API
 *   - При офлайне восстанавливаются из localStorage
 *   - toggleFavorite/toggleLeastFavorite:
 *     - Оптимистичное обновление UI (мгновенно)
 *     - apiRequest сохраняет мутацию в IndexedDB очередь
 *     - При онлайне сервер подтверждает, список перезагружается
 *     - При офлайне UI остаётся обновлённым, данные в очереди
 *   - Списки сохраняются в localStorage при КАЖДОМ изменении
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { exerciseApi } from "@/shared/api/exerciseApi";
import { favoriteApi } from "@/shared/api/favoriteApi";
import { leastFavoriteApi } from "@/shared/api/leastFavoriteApi";
import type { Exercise } from "@/shared/api/types";
import { useError } from "./useError";
import toast from "react-hot-toast";

// Ключи для localStorage (офлайн-фолбек)
const EXERCISES_CACHE_KEY = "all_exercises_cache";
const FAVORITES_CACHE_KEY = "favorites_cache";
const LEAST_FAVORITES_CACHE_KEY = "least_favorites_cache";
const CACHE_MAX_AGE_DAYS = 7;

interface UseExercisesReturn {
  allExercises: Exercise[] | null;
  favoriteExercises: Exercise[] | null;
  leastFavoriteExercises: Exercise[] | null;
  loadingExercises: {
    all: boolean;
    favorites: boolean;
    leastFavorites: boolean;
  };
  refetchAll: () => Promise<void>;
  refetchFavorites: () => Promise<void>;
  refetchLeastFavorites: () => Promise<void>;
  toggleFavorite: (exerciseId: string) => Promise<boolean>;
  toggleLeastFavorite: (exerciseId: string) => Promise<boolean>;
}

/** Сохранить в localStorage с меткой времени */
const saveToCache = (key: string, data: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    /* localStorage переполнен */
  }
};

/** Загрузить из localStorage, если кэш не устарел */
const loadFromCache = <T>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if ((Date.now() - timestamp) / 86400000 > CACHE_MAX_AGE_DAYS) {
      localStorage.removeItem(key);
      return null;
    }
    return data as T;
  } catch {
    return null;
  }
};

export const useExercises = (): UseExercisesReturn => {
  const { setError, clearError } = useError();

  const [allExercises, setAllExercises] = useState<Exercise[] | null>(null);
  const [favoriteExercises, setFavoriteExercises] = useState<Exercise[] | null>(
    null,
  );
  const [leastFavoriteExercises, setLeastFavoriteExercises] = useState<
    Exercise[] | null
  >(null);
  const [loadingExercises, setLoadingExercises] = useState({
    all: false,
    favorites: false,
    leastFavorites: false,
  });

  const initialLoadDone = useRef(false);

  // ==================== ВСЕ УПРАЖНЕНИЯ ====================
  const loadAllExercises = useCallback(async () => {
    setLoadingExercises((prev) => ({ ...prev, all: true }));
    clearError();
    try {
      const data = await exerciseApi.getAllExercises();
      const allData = Array.isArray(data) ? data : (data?.data ?? null);
      if (allData) {
        setAllExercises(allData);
        saveToCache(EXERCISES_CACHE_KEY, allData);
      }
    } catch {
      const cached = loadFromCache<Exercise[]>(EXERCISES_CACHE_KEY);
      if (cached) setAllExercises(cached);
      else if (!allExercises) setError("network", "Ошибка загрузки упражнений");
    }
    setLoadingExercises((prev) => ({ ...prev, all: false }));
  }, [clearError, setError, allExercises]);

  // ==================== ИЗБРАННЫЕ ====================
  const loadFavoriteExercises = useCallback(async () => {
    setLoadingExercises((prev) => ({ ...prev, favorites: true }));
    clearError();
    try {
      const data = await favoriteApi.getFavorites();
      const favData = Array.isArray(data) ? data : (data?.data ?? null);
      if (favData) {
        setFavoriteExercises(favData);
        saveToCache(FAVORITES_CACHE_KEY, favData);
      }
    } catch {
      const cached = loadFromCache<Exercise[]>(FAVORITES_CACHE_KEY);
      setFavoriteExercises(cached || []);
    }
    setLoadingExercises((prev) => ({ ...prev, favorites: false }));
  }, [clearError]);

  // ==================== НЕЛЮБИМЫЕ ====================
  const loadLeastFavoriteExercises = useCallback(async () => {
    setLoadingExercises((prev) => ({ ...prev, leastFavorites: true }));
    clearError();
    try {
      const data = await leastFavoriteApi.getLeastFavorites();
      const lfData = Array.isArray(data) ? data : (data?.data ?? null);
      if (lfData) {
        setLeastFavoriteExercises(lfData);
        saveToCache(LEAST_FAVORITES_CACHE_KEY, lfData);
      }
    } catch {
      const cached = loadFromCache<Exercise[]>(LEAST_FAVORITES_CACHE_KEY);
      setLeastFavoriteExercises(cached || []);
    }
    setLoadingExercises((prev) => ({ ...prev, leastFavorites: false }));
  }, [clearError]);

  // ==================== TOGGLE ИЗБРАННОГО ====================
  const toggleFavorite = useCallback(
    async (exerciseId: string): Promise<boolean> => {
      const exercise = allExercises?.find((e) => e.id === exerciseId);
      if (leastFavoriteExercises?.some((lf) => lf.id === exerciseId)) {
        console.warn("⚠️ Нельзя добавить в избранное из нелюбимых");
        return false;
      }

      const isCurrentlyFavorite = favoriteExercises?.some(
        (fav) => fav.id === exerciseId,
      );

      // Оптимистичное обновление UI
      setFavoriteExercises((prev) => {
        if (!prev) return prev;
        if (isCurrentlyFavorite)
          return prev.filter((fav) => fav.id !== exerciseId);
        if (exercise) return [...prev, exercise];
        return prev;
      });

      try {
        // Сначала синхронизируем офлайн-очередь, чтобы сервер был актуален
        if (navigator.onLine) {
          const { processQueue } = await import("@/lib/offline/offlineQueue");
          await processQueue();
        }

        const result = await favoriteApi.toggleFavorite({ exerciseId });
        if (result.success) await loadFavoriteExercises();
        else await loadFavoriteExercises();
        return result.success;
      } catch {
        toast.success("📴 Избранное синхронизируется при появлении сети.", {
          duration: 3000,
        });
        return true;
      }
    },
    [
      allExercises,
      favoriteExercises,
      leastFavoriteExercises,
      loadFavoriteExercises,
    ],
  );

  // ==================== TOGGLE НЕЛЮБИМОГО ====================
  const toggleLeastFavorite = useCallback(
    async (exerciseId: string): Promise<boolean> => {
      const exercise = allExercises?.find((e) => e.id === exerciseId);
      if (favoriteExercises?.some((fav) => fav.id === exerciseId)) {
        console.warn("⚠️ Нельзя добавить в нелюбимые из избранного");
        return false;
      }

      const isCurrentlyLeastFavorite = leastFavoriteExercises?.some(
        (lf) => lf.id === exerciseId,
      );

      // Оптимистичное обновление UI
      setLeastFavoriteExercises((prev) => {
        if (!prev) return prev;
        if (isCurrentlyLeastFavorite)
          return prev.filter((lf) => lf.id !== exerciseId);
        if (exercise) return [...prev, exercise];
        return prev;
      });

      try {
        // Сначала синхронизируем офлайн-очередь
        if (navigator.onLine) {
          const { processQueue } = await import("@/lib/offline/offlineQueue");
          await processQueue();
        }

        const result = await leastFavoriteApi.toggleLeastFavorite({
          exerciseId,
        });
        if (result.success) await loadLeastFavoriteExercises();
        else await loadLeastFavoriteExercises();
        return result.success;
      } catch {
        toast.success("📴 Нелюбимые синхронизируются при появлении сети.", {
          duration: 3000,
        });
        return true;
      }
    },
    [
      allExercises,
      favoriteExercises,
      leastFavoriteExercises,
      loadLeastFavoriteExercises,
    ],
  );

  // ─── Автосохранение избранного в localStorage при каждом изменении ──
  useEffect(() => {
    if (favoriteExercises) saveToCache(FAVORITES_CACHE_KEY, favoriteExercises);
  }, [favoriteExercises]);

  // ─── Автосохранение нелюбимых в localStorage при каждом изменении ──
  useEffect(() => {
    if (leastFavoriteExercises)
      saveToCache(LEAST_FAVORITES_CACHE_KEY, leastFavoriteExercises);
  }, [leastFavoriteExercises]);

  // ==================== ПЕРВОНАЧАЛЬНАЯ ЗАГРУЗКА ====================
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    const init = async () => {
      // Мгновенное восстановление из кэша
      const cachedExercises = loadFromCache<Exercise[]>(EXERCISES_CACHE_KEY);
      if (cachedExercises) setAllExercises(cachedExercises);
      const cachedFavorites = loadFromCache<Exercise[]>(FAVORITES_CACHE_KEY);
      if (cachedFavorites) setFavoriteExercises(cachedFavorites);
      const cachedLeastFav = loadFromCache<Exercise[]>(
        LEAST_FAVORITES_CACHE_KEY,
      );
      if (cachedLeastFav) setLeastFavoriteExercises(cachedLeastFav);

      // Фоновое обновление из API
      await loadAllExercises();
      await loadFavoriteExercises();
      await loadLeastFavoriteExercises();
    };
    init();
  }, []); // eslint-disable-line

  return {
    allExercises,
    favoriteExercises,
    leastFavoriteExercises,
    loadingExercises,
    refetchAll: loadAllExercises,
    refetchFavorites: loadFavoriteExercises,
    refetchLeastFavorites: loadLeastFavoriteExercises,
    toggleFavorite,
    toggleLeastFavorite,
  };
};
