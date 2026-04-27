import { useState, useEffect, useCallback } from "react";
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
}

export const useExercises = (): UseExercisesReturn => {
  const { setError, clearError } = useError();

  // States
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

  const loadAllExercises = useCallback(async () => {
    setLoadingExercises((prev) => ({ ...prev, all: true }));
    clearError();
    try {
      const data = await exerciseApi.getAllExercises();
      const allData = Array.isArray(data) ? data : (data?.data ?? null);
      setAllExercises(allData);
    } catch {
      const msg = "Ошибка при загрузке списка упражнений";
      setError("network", msg);
    } finally {
      setLoadingExercises((prev) => ({ ...prev, all: false }));
    }
  }, [setError, clearError]);

  const loadFavoriteExercises = useCallback(async () => {
    setLoadingExercises((prev) => ({ ...prev, favorites: true }));
    clearError();

    try {
      const data = await favoriteApi.getFavorites();
      const favoritesData = Array.isArray(data) ? data : (data?.data ?? null);
      setFavoriteExercises(favoritesData);
    } catch {
      setError("network", "Ошибка при загрузке избранного");
    } finally {
      setLoadingExercises((prev) => ({ ...prev, favorites: false }));
    }
  }, [setError, clearError]);

  const loadLeastFavoriteExercises = useCallback(async () => {
    setLoadingExercises((prev) => ({ ...prev, leastFavorites: true }));
    clearError();
    try {
      const data = await leastFavoriteApi.getLeastFavorites();

      const leastFavoritesData = Array.isArray(data)
        ? data
        : (data?.data ?? null);

      setLeastFavoriteExercises(leastFavoritesData);
    } catch {
      const msg = "Ошибка при загрузке нелюбимых упражнений";
      setError("network", msg);
    } finally {
      setLoadingExercises((prev) => ({ ...prev, leastFavorites: false }));
    }
  }, [setError, clearError]);

  useEffect(() => {
    loadAllExercises();
    loadFavoriteExercises();
    loadLeastFavoriteExercises();
  }, []);

  return {
    allExercises,
    favoriteExercises,
    leastFavoriteExercises,
    loadingExercises,
    refetchAll: loadAllExercises,
    refetchFavorites: loadFavoriteExercises,
    refetchLeastFavorites: loadLeastFavoriteExercises,
  };
};
