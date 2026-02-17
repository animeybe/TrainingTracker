import FavoriteStarEmpty from "@/assets/icon/favorite-star-empty.svg";
import FavoriteStarFilled from "@/assets/icon/favorite-star-filled.svg";
import { exerciseApi } from "@/shared/api/authApi";
import { favoriteApi } from "@/shared/api/authApi";
import {
  MUSCLE_GROUP_LABELS,
  MUSCLE_SUPERGROUPS,
  MUSCLE_SUPERGROUP_LABELS,
} from "../models/muscleGroupInterpreter";
import "./ExerciseBasePage.scss";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Exercise } from "@/types/exercise.types";
import type { FavoriteListResponse } from "@/types/favorite.type";

export function ExerciseBasePage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [favoriteList, setFavoriteList] = useState<
    FavoriteListResponse["data"]
  >([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  const [selectedSuperGroup, setSelectedSuperGroup] = useState<string | null>(
    null,
  );
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(
    null,
  );

  // 1. Загрузка упражнений
  useEffect(() => {
    const loadExercises = async () => {
      try {
        const response = await exerciseApi.getAll();
        setExercises(response.data);
      } catch (error) {
        console.error("Упражнения недоступны:", error);
      }
    };
    loadExercises();
  }, []);

  // 2. Загрузка избранного (опционально, graceful degradation)
  useEffect(() => {
    if (!exercises.length) return;

    const loadFavorites = async (retries = 2) => {
      setLoadingFavorites(true);
      try {
        const response = await favoriteApi.getFavorites();
        setFavoriteList(response.data);
      } catch (error) {
        if (retries > 0) {
          setTimeout(() => loadFavorites(retries - 1), 1000);
        } else {
          console.warn("Избранное недоступно:", error);
          setFavoriteList([]);
        }
      } finally {
        setLoadingFavorites(false);
      }
    };

    loadFavorites();
  }, [exercises.length]); // После упражнений

  const isFavorite = useCallback(
    (exerciseId: string): boolean => {
      return favoriteList.some((fav) => fav.id === exerciseId);
    },
    [favoriteList],
  );

  const handleToggleFavorite = async (exerciseId: string) => {
    try {
      await favoriteApi.toggle(exerciseId);

      setFavoriteList((prev) => {
        const isInFavorites = prev.some((fav) => fav.id === exerciseId);

        if (isInFavorites) {
          // Удаляем из избранного
          return prev.filter((fav) => fav.id !== exerciseId);
        } else {
          // Добавляем в избранное (берем данные из exercises)
          const exercise = exercises.find((ex) => ex.id === exerciseId);
          if (exercise) {
            return [
              {
                id: exerciseId,
                name: exercise.name,
                muscleGroup: exercise.muscleGroup,
                type: exercise.type,
                daysInFavorites: 0, // Можно запросить с бэка
              },
              ...prev,
            ];
          }
        }
        return prev;
      });
    } catch (error) {
      console.error("Ошибка toggle избранного:", error);
    }
  };

  const exerciseCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    exercises.forEach((exercise) => {
      const group = exercise.muscleGroup ?? "";
      counts[group] = (counts[group] ?? 0) + 1;
    });
    return counts;
  }, [exercises]);

  const filteredExercises = useMemo(
    () =>
      selectedMuscleGroup
        ? exercises.filter((ex) => ex.muscleGroup === selectedMuscleGroup)
        : [],
    [exercises, selectedMuscleGroup],
  );

  return (
    <section className="exercise-content">
      <ul
        className={`exercise-list exercise-list-${!selectedSuperGroup && !selectedMuscleGroup ? "supergroup" : selectedSuperGroup && !selectedMuscleGroup ? "group" : "exercise"}`}>
        {!selectedSuperGroup && !selectedMuscleGroup && (
          <>
            {Object.entries(MUSCLE_SUPERGROUPS).map(
              ([superGroupKey, muscleKeys]) => (
                <li
                  key={superGroupKey}
                  className="exercise-list-supergroup__item exercise-list__item"
                  onClick={() => setSelectedSuperGroup(superGroupKey)}>
                  <span className="exercise-list-supergroup__item-name exercise-list__item-name">
                    {MUSCLE_SUPERGROUP_LABELS[superGroupKey]}
                  </span>
                  <span className="exercise-list-supergroup__item-muscle-count exercise-list__item-muscle-count">
                    ({muscleKeys.length} мышц)
                  </span>
                </li>
              ),
            )}
          </>
        )}

        {selectedSuperGroup && !selectedMuscleGroup && (
          <>
            <li
              className="exercise-list__back-button"
              onClick={() => setSelectedSuperGroup(null)}>
              ← Все группы
            </li>

            {MUSCLE_SUPERGROUPS[
              selectedSuperGroup as keyof typeof MUSCLE_SUPERGROUPS
            ]?.map((muscleKey) => (
              <li
                key={muscleKey}
                className="exercise-list-group__item exercise-list__item"
                onClick={() => setSelectedMuscleGroup(muscleKey)}>
                <span className="exercise-list-supergroup__item-name exercise-list__item-name">
                  {MUSCLE_GROUP_LABELS[muscleKey] || muscleKey}
                </span>
                <span className="exercise-list-supergroup__item-muscle-count exercise-list__item-muscle-count">
                  ({exerciseCounts[muscleKey] ?? 0} упражнений)
                </span>
              </li>
            ))}
          </>
        )}

        {selectedMuscleGroup && (
          <>
            <li
              className="exercise-list__back-button"
              onClick={() => setSelectedMuscleGroup(null)}>
              ←{" "}
              {MUSCLE_GROUP_LABELS[selectedMuscleGroup] || selectedMuscleGroup}
            </li>

            {filteredExercises.map((exercise) => (
              <li
                key={exercise.id}
                className="exercise-list-exercise__item exercise-list__item">
                <span className="exercise-list-supergroup__item-name exercise-list__item-name">
                  {exercise.name}
                </span>
                <button
                  type="button"
                  className="exercise-list-exercise__favorite-star"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFavorite(exercise.id);
                  }}
                  disabled={loadingFavorites}
                  title={
                    isFavorite(exercise.id)
                      ? "Убрать из избранного"
                      : "Добавить в избранное"
                  }>
                  <img
                    className="exercise-list-exercise__favorite-star-1"
                    src={
                      isFavorite(exercise.id)
                        ? FavoriteStarFilled
                        : FavoriteStarEmpty
                    }
                    alt={
                      isFavorite(exercise.id)
                        ? "В избранном"
                        : "Добавить в избранное"
                    }
                  />
                </button>
              </li>
            ))}

            {filteredExercises.length === 0 && (
              <li className="exercise-list__item no-results">
                Упражнений для этой группы пока нет
              </li>
            )}
          </>
        )}
      </ul>
    </section>
  );
}
