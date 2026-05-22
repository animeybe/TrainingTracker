// shared/hooks/useExercises.ts
import { useState, useEffect } from "react";
import { exerciseApi } from "@/shared/api/exerciseApi";
import { favoriteApi } from "@/shared/api/favoriteApi";
import { leastFavoriteApi } from "@/shared/api/leastFavoriteApi";
import type { Exercise } from "@/shared/api/types";
import { useError } from "./useError";

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

  // ==================== ВСЕ УПРАЖНЕНИЯ ====================
  const loadAllExercises = async () => {
    setLoadingExercises((prev) => ({ ...prev, all: true }));
    clearError();

    try {
      const data = await exerciseApi.getAllExercises();
      const allData = Array.isArray(data) ? data : (data?.data ?? null);
      setAllExercises(allData);
    } catch (err) {
      console.error("❌ Ошибка загрузки упражнений:", err);
      // В офлайне не показываем ошибку, если уже есть данные
      if (!allExercises) {
        setError("network", "Ошибка загрузки упражнений");
      }
    }

    setLoadingExercises((prev) => ({ ...prev, all: false }));
  };

  // ==================== ИЗБРАННЫЕ УПРАЖНЕНИЯ ====================
  const loadFavoriteExercises = async () => {
    setLoadingExercises((prev) => ({ ...prev, favorites: true }));
    clearError();

    try {
      const data = await favoriteApi.getFavorites();
      const favoritesData = Array.isArray(data) ? data : (data?.data ?? null);
      setFavoriteExercises(favoritesData || []);
    } catch (err) {
      console.error("❌ Ошибка загрузки избранного:", err);
      // В офлайне не сбрасываем существующие данные
      if (!favoriteExercises) {
        setFavoriteExercises([]);
      }
      setError("network", "Ошибка загрузки избранного");
    }

    setLoadingExercises((prev) => ({ ...prev, favorites: false }));
  };

  // ==================== НЕЛЮБИМЫЕ УПРАЖНЕНИЯ ====================
  const loadLeastFavoriteExercises = async () => {
    setLoadingExercises((prev) => ({ ...prev, leastFavorites: true }));
    clearError();

    try {
      const data = await leastFavoriteApi.getLeastFavorites();
      const leastFavoritesData = Array.isArray(data)
        ? data
        : (data?.data ?? null);
      setLeastFavoriteExercises(leastFavoritesData || []);
    } catch (err) {
      console.error("❌ Ошибка загрузки нелюбимых:", err);
      // В офлайне не сбрасываем существующие данные
      if (!leastFavoriteExercises) {
        setLeastFavoriteExercises([]);
      }
      setError("network", "Ошибка загрузки нелюбимых");
    }

    setLoadingExercises((prev) => ({ ...prev, leastFavorites: false }));
  };

  // ==================== TOGGLE ИЗБРАННОГО ====================
  const toggleFavorite = async (exerciseId: string): Promise<boolean> => {
    // Находим упражнение в общем списке
    const exercise = allExercises?.find((e) => e.id === exerciseId);

    // Проверяем, не в нелюбимых ли оно
    const isLeastFavorite = leastFavoriteExercises?.some(
      (lf) => lf.id === exerciseId,
    );
    if (isLeastFavorite) {
      console.warn("⚠️ Нельзя добавить в избранное из нелюбимых");
      return false;
    }

    // Проверяем текущий статус
    const isCurrentlyFavorite = favoriteExercises?.some(
      (fav) => fav.id === exerciseId,
    );

    // Оптимистичное обновление UI
    setFavoriteExercises((prev) => {
      if (!prev) return prev;

      if (isCurrentlyFavorite) {
        // Удаляем из избранного
        return prev.filter((fav) => fav.id !== exerciseId);
      } else if (exercise) {
        // Добавляем в избранное
        return [...prev, exercise];
      }
      return prev;
    });

    // Если офлайн — сохраняем изменения и надеемся на синхронизацию
    if (!navigator.onLine) {
      console.log(
        "📴 Офлайн: изменения будут синхронизированы при появлении сети",
      );
      return true;
    }

    // Онлайн: синхронизируем с сервером
    try {
      const result = await favoriteApi.toggleFavorite({ exerciseId });

      if (result.success) {
        // Фоновая синхронизация с сервером
        await loadFavoriteExercises();
        return true;
      } else {
        // Ошибка на сервере — откатываем
        console.warn("⚠️ Сервер вернул ошибку, откатываем изменения");
        await loadFavoriteExercises();
        return false;
      }
    } catch (err) {
      // Если сеть пропала во время запроса — не откатываем
      if (err instanceof TypeError && err.message === "Failed to fetch") {
        console.log("📴 Сеть пропала во время запроса, оставляем изменения");
        return true;
      }

      // Другие ошибки — откатываем
      console.error("❌ Ошибка синхронизации, откатываем изменения");
      await loadFavoriteExercises();
      setError("network", "Не удалось изменить избранное");
      return false;
    }
  };

  // ==================== TOGGLE НЕЛЮБИМОГО ====================
  const toggleLeastFavorite = async (exerciseId: string): Promise<boolean> => {
    // Находим упражнение в общем списке
    const exercise = allExercises?.find((e) => e.id === exerciseId);

    // Проверяем, не в избранном ли оно
    const isFavorite = favoriteExercises?.some((fav) => fav.id === exerciseId);
    if (isFavorite) {
      console.warn("⚠️ Нельзя добавить в нелюбимые из избранного");
      return false;
    }

    // Проверяем текущий статус
    const isCurrentlyLeastFavorite = leastFavoriteExercises?.some(
      (lf) => lf.id === exerciseId,
    );

    // Оптимистичное обновление UI
    setLeastFavoriteExercises((prev) => {
      if (!prev) return prev;

      if (isCurrentlyLeastFavorite) {
        // Удаляем из нелюбимых
        return prev.filter((lf) => lf.id !== exerciseId);
      } else if (exercise) {
        // Добавляем в нелюбимые
        return [...prev, exercise];
      }
      return prev;
    });

    // Если офлайн — сохраняем изменения и надеемся на синхронизацию
    if (!navigator.onLine) {
      console.log(
        "📴 Офлайн: изменения будут синхронизированы при появлении сети",
      );
      return true;
    }

    // Онлайн: синхронизируем с сервером
    try {
      const result = await leastFavoriteApi.toggleLeastFavorite({
        exerciseId,
      });

      if (result.success) {
        // Фоновая синхронизация с сервером
        await loadLeastFavoriteExercises();
        return true;
      } else {
        // Ошибка на сервере — откатываем
        console.warn("⚠️ Сервер вернул ошибку, откатываем изменения");
        await loadLeastFavoriteExercises();
        return false;
      }
    } catch (err) {
      // Если сеть пропала во время запроса — не откатываем
      if (err instanceof TypeError && err.message === "Failed to fetch") {
        console.log("📴 Сеть пропала во время запроса, оставляем изменения");
        return true;
      }

      // Другие ошибки — откатываем
      console.error("❌ Ошибка синхронизации, откатываем изменения");
      await loadLeastFavoriteExercises();
      setError("network", "Не удалось изменить нелюбимые");
      return false;
    }
  };

  // ==================== ПЕРВОНАЧАЛЬНАЯ ЗАГРУЗКА ====================
  useEffect(() => {
    const init = async () => {
      await loadAllExercises();
      await loadFavoriteExercises();
      await loadLeastFavoriteExercises();
    };
    init();
  }, []);

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
