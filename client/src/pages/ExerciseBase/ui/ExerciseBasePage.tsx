import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { Exercise } from "@/shared/api/types";
import "./ExerciseBasePage.scss";
import groupingByMusclesIcon from "@/assets/icon/groupingByMuscles.svg";
import sortingIcon from "@/assets/icon/sorting.svg";
import dislikeIcon from "@/assets/icon/dislike-blue.svg";
import dislikeFilledIcon from "@/assets/icon/dislike-red.svg";
import {
  MUSCLE_SUPERGROUPS,
  MUSCLE_SUPERGROUP_LABELS,
  MUSCLE_GROUP_LABELS,
} from "../common/utils/muscleGroupInterpreter";
import { useExercises } from "@/shared/hooks/useExercises";
import { useError } from "@/shared/hooks/useError";
import { InfoPage } from "@/shared/ui/components/ErrorUI/ui/InfoPage";
import { logger } from "@/lib/utils/logger";
import { favoriteApi, leastFavoriteApi } from "@/shared/api";
import toast from "react-hot-toast";

// ======================================================================
// 🔧 ТИПЫ
// ======================================================================

type SupergroupKey = keyof typeof MUSCLE_SUPERGROUPS;
type MuscleGroup =
  (typeof MUSCLE_SUPERGROUPS)[keyof typeof MUSCLE_SUPERGROUPS][number];

/**
 * Упрощенный тип для избранного (без secondaryMuscles и т.д.)
 */
type FavoriteExercise = Omit<
  Exercise,
  "secondaryMuscles" | "movementPatterns" | "trainingFocus"
>;

// ======================================================================
// 🎯 ОСНОВНОЙ КОМПОНЕНТ
// ======================================================================

export function ExerciseBasePage() {
  // ==================== CORE STATE ====================
  const {
    allExercises: exercises,
    favoriteExercises: rawFavoriteExercises,
    leastFavoriteExercises,
    loadingExercises,
    refetchFavorites,
    refetchLeastFavorites,
  } = useExercises();
  const { currentError: localError, setError, clearError } = useError();

  // Нормализуем избранное и нелюбимое (только валидные упражнения)
  const [favoriteList, setFavoriteList] = useState<FavoriteExercise[]>([]);
  const [leastFavoriteList, setLeastFavoriteList] = useState<Exercise[]>([]);

  // ==================== UI STATE ====================
  const [search, setSearch] = useState("");
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const [groupingEnabled, setGroupingEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("exerciseBaseGroupingEnabled");
      return saved ? JSON.parse(saved) : false;
    } catch {
      logger.warn("Failed to load grouping settings");
      return false;
    }
  });
  const [selectedSupergroup, setSelectedSupergroup] =
    useState<SupergroupKey | null>(null);
  const [selectedMuscleGroup, setSelectedMuscleGroup] =
    useState<MuscleGroup | null>(null);
  const [isSortingOpen, setIsSortingOpen] = useState(false);
  const [sortType, setSortType] = useState<"name" | "muscle" | "difficulty">(
    "name",
  );

  // ==================== REFS ====================
  const sortingRef = useRef<HTMLDivElement>(null);

  // ==================== NORMALIZE FAVORITES ====================
  useEffect(() => {
    if (!exercises || !rawFavoriteExercises) return;

    const validFavorites: FavoriteExercise[] = rawFavoriteExercises.filter(
      (fav) => exercises.some((ex) => ex.id === fav.id),
    );
    setFavoriteList(validFavorites);
  }, [exercises, rawFavoriteExercises]);

  useEffect(() => {
    if (!exercises || !leastFavoriteExercises) return;
    const validLeastFavorites = leastFavoriteExercises.filter((lf) =>
      exercises.some((ex) => ex.id === lf.id),
    );
    setLeastFavoriteList(validLeastFavorites);
  }, [exercises, leastFavoriteExercises]);

  // ==================== API FUNCTIONS ====================
  /**
   * Проверка избранного
   */
  const isFavorite = useCallback(
    (exerciseId: string): boolean => {
      return favoriteList.some((fav) => fav.id === exerciseId);
    },
    [favoriteList],
  );

  // Проверка нелюбимого
  const isLeastFavorite = useCallback(
    (exerciseId: string): boolean => {
      return leastFavoriteList.some((lf) => lf.id === exerciseId);
    },
    [leastFavoriteList],
  );

  /**
   * Toggle избранного (оптимистично)
   * UI меняется МГНОВЕННО (0ms)
   * Сервер фоном (параллельно)
   * Ошибка = ОТКАТ к старому состоянию
   */
  const handleToggleFavorite = useCallback(
    async (exerciseId: string) => {
      if (isLeastFavorite(exerciseId)) {
        toast.error("Упражнение уже в нелюбимых! Сначала уберите его");
        return;
      }

      const wasFavorite = isFavorite(exerciseId);
      const previousFavorites = favoriteList; // СНАПШОТ для отката

      logger.debug("handleToggleFavorite optimistic", {
        exerciseId,
        wasFavorite,
      });

      // 1. ОПТИМИСТИЧНО — UI СРАЗУ! (0ms)
      let optimisticFavorites: FavoriteExercise[];
      if (wasFavorite) {
        // Мгновенно убираем
        optimisticFavorites = favoriteList.filter(
          (fav) => fav.id !== exerciseId,
        );
      } else {
        // Мгновенно добавляем
        const exercise = exercises?.find((ex) => ex.id === exerciseId);
        if (!exercise) {
          logger.warn("Exercise not found for optimistic add", { exerciseId });
          return;
        }

        optimisticFavorites = [
          {
            id: exercise.id,
            name: exercise.name,
            primaryMuscleGroup: exercise.primaryMuscleGroup,
            difficulty: exercise.difficulty,
            description: exercise.description || null,
            imageUrl: exercise.imageUrl || null,
            videoUrl: exercise.videoUrl || null,
          },
          ...favoriteList,
        ];
      }

      // UI ОБНОВЛЯЕТСЯ СРАЗУ!
      setFavoriteList(optimisticFavorites);
      logger.debug("Optimistic UI update", {
        exerciseId,
        newCount: optimisticFavorites.length,
      });

      // 2. ФОНОМ сервер (НЕ блокирует UI)
      try {
        const toggleResult = await favoriteApi.toggleFavorite({ exerciseId });
        await refetchFavorites();

        if (!toggleResult.success) {
          throw new Error(`toggleFavorite failed: success=false`);
        }

        logger.debug("✅ Server confirmed", { exerciseId });
      } catch (error: unknown) {
        // ОТКАТ к предыдущему состоянию!
        setFavoriteList(previousFavorites);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logger.error("❌ Optimistic rollback", {
          exerciseId,
          error: errorMessage,
        });

        setError(
          "network",
          "Сервер отклонил изменение, состояние восстановлено",
        );
      }
    },
    [
      isLeastFavorite,
      isFavorite,
      favoriteList,
      exercises,
      refetchFavorites,
      setError,
    ],
  );

  // Toggle нелюбимого (оптимистично)
  const handleToggleLeastFavorite = useCallback(
    async (exerciseId: string) => {
      if (isFavorite(exerciseId)) {
        toast.error("Упражнение уже в избранном! Сначала уберите его");
        return;
      }

      const wasLeastFavorite = isLeastFavorite(exerciseId);
      const previousLeastFavorites = leastFavoriteList;

      const exercise = exercises?.find((ex) => ex.id === exerciseId);
      if (!exercise) return;

      // ОПТИМИСТИЧНО
      const optimisticLeastFavorites = wasLeastFavorite
        ? leastFavoriteList.filter((lf) => lf.id !== exerciseId)
        : [exercise, ...leastFavoriteList];

      setLeastFavoriteList(optimisticLeastFavorites);

      // СЕРВЕР
      try {
        await leastFavoriteApi.toggleLeastFavorite({ exerciseId });
        await refetchLeastFavorites();
      } catch {
        setLeastFavoriteList(previousLeastFavorites);
        setError("network", "Сервер отклонил изменение");
      }
    },
    [
      isFavorite,
      isLeastFavorite,
      leastFavoriteList,
      exercises,
      refetchLeastFavorites,
      setError,
    ],
  );

  // ==================== COMPUTED / MEMO ====================
  /**
   * Фильтр по поиску (название + мышцы)
   */
  const filteredExercises = useMemo(() => {
    if (!exercises) return [];

    if (!search.trim()) return exercises;

    const lowerSearch = search.toLowerCase();
    return exercises.filter((ex) => {
      const nameMatch = ex.name.toLowerCase().includes(lowerSearch);
      const muscleRu =
        MUSCLE_GROUP_LABELS[ex.primaryMuscleGroup]?.toLowerCase() || "";
      const muscleEn = ex.primaryMuscleGroup.toLowerCase();
      const muscleMatch =
        muscleRu.includes(lowerSearch) || muscleEn.includes(lowerSearch);
      return nameMatch || muscleMatch;
    });
  }, [exercises, search]);

  /**
   * Сортировка (по имени/мышцам/сложности)
   */
  const sortedExercises = useMemo(() => {
    const safeExercises = exercises ?? [];
    const filtered =
      search.trim() && filteredExercises.length > 0
        ? filteredExercises
        : safeExercises;

    return [...filtered].sort((a, b) => {
      switch (sortType) {
        case "name":
          return a.name.localeCompare(b.name);
        case "muscle":
          return (
            MUSCLE_GROUP_LABELS[a.primaryMuscleGroup]?.localeCompare(
              MUSCLE_GROUP_LABELS[b.primaryMuscleGroup] || "",
            ) || a.primaryMuscleGroup.localeCompare(b.primaryMuscleGroup)
          );
        case "difficulty": {
          const diffOrder: Record<string, number> = {
            EASY: 1,
            MEDIUM: 2,
            HARD: 3,
          };
          return (
            (diffOrder[a.difficulty || "EASY"] || 0) -
            (diffOrder[b.difficulty || "EASY"] || 0)
          );
        }
        default:
          return 0;
      }
    });
  }, [exercises, filteredExercises, search, sortType]);

  /**
   * Группировка по мышцам (супергруппы → группы)
   */
  const groupedExercises = useMemo(() => {
    if (!sortedExercises.length) return sortedExercises;

    if (!groupingEnabled) return sortedExercises;

    if (selectedMuscleGroup) {
      return sortedExercises.filter((exercise) => {
        const secondary = exercise.secondaryMuscles || [];
        return secondary.includes(selectedMuscleGroup);
      });
    }

    if (selectedSupergroup) {
      const supergroupMuscles = MUSCLE_SUPERGROUPS[selectedSupergroup];
      return sortedExercises.filter((exercise) => {
        const secondary = exercise.secondaryMuscles || [];
        return supergroupMuscles.some((muscle) => secondary.includes(muscle));
      });
    }

    return sortedExercises;
  }, [
    groupingEnabled,
    selectedSupergroup,
    selectedMuscleGroup,
    sortedExercises,
  ]);

  // ==================== EVENT HANDLERS ====================
  const handleFavoritesClick = useCallback(() => {
    setIsFavoritesModalOpen(true);
  }, []);

  const handleSortingClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSortingOpen((prev) => !prev);
  };

  const toggleGrouping = () => {
    const newState = !groupingEnabled;
    setGroupingEnabled(newState);
    setSelectedSupergroup(null);
    setSelectedMuscleGroup(null);
  };

  const selectSupergroup = (supergroup: SupergroupKey) => {
    setSelectedSupergroup((prev) => (prev === supergroup ? null : supergroup));
    setSelectedMuscleGroup(null);
  };

  const selectMuscleGroup = (muscleGroup: MuscleGroup) => {
    setSelectedMuscleGroup((prev) =>
      prev === muscleGroup ? null : muscleGroup,
    );
  };

  // ==================== USE EFFECTS ====================
  // 💾 Сохранение группировки
  useEffect(() => {
    localStorage.setItem(
      "exerciseBaseGroupingEnabled",
      JSON.stringify(groupingEnabled),
    );
  }, [groupingEnabled]);

  // 🖱️ Закрытие сортировки (outside click + Escape)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sortingRef.current &&
        !sortingRef.current.contains(event.target as Node)
      ) {
        setIsSortingOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSortingOpen(false);
      }
    };

    if (isSortingOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [isSortingOpen]);

  // ==================== RENDER ====================
  // Дублирующийся if удален — один loading check
  if (
    (loadingExercises.all || loadingExercises.favorites) &&
    (!exercises || exercises.length === 0)
  ) {
    return <InfoPage type="loading" />;
  }

  if (localError) {
    return (
      <InfoPage
        type={localError.type}
        message={localError.message}
        retryAction={() => {
          clearError();
        }}
      />
    );
  }

  return (
    <div className="exercise-base-content">
      {/* 📊 HEADER: счетчики + controls */}
      <div className="exercise-base-header">
        <div className="exercise-base-header-left">
          <span className="exercise-base-header-left__exercise-count">
            Упражнения ({exercises?.length ?? 0})
          </span>
          <button
            type="button"
            className="exercise-base-header-left__exercise-favorite-count"
            onClick={handleFavoritesClick}
            title="Показать избранное">
            Избранное: {favoriteList.length}
          </button>
        </div>

        {/* ← Back в группировке */}
        {groupingEnabled && selectedSupergroup && (
          <button
            className="exercise-base-header__back-btn"
            onClick={() => {
              if (selectedMuscleGroup) {
                setSelectedMuscleGroup(null);
              } else {
                setSelectedSupergroup(null);
              }
            }}
            title="Назад"
            type="button">
            ← Назад
          </button>
        )}

        <div className="exercise-base-header-right">
          {/* 🎛️ Группировка мышц */}
          <button
            type="button"
            className={`exercise-base-header-right__grouping-muscles-btn ${
              groupingEnabled
                ? "exercise-base-header-right__grouping-muscles-btn_active"
                : ""
            }`}
            onClick={toggleGrouping}
            title={
              groupingEnabled
                ? "Выключить группировку"
                : "Включить группировку по мышцам"
            }>
            <img src={groupingByMusclesIcon} alt="Группировка по мышцам" />
          </button>

          {/* 🔄 Сортировка */}
          <div
            className="exercise-base-header-right__sorting-container"
            ref={sortingRef}>
            <img
              className="exercise-base-header-right__sorting-btn"
              src={sortingIcon}
              alt="Сортировка"
              onClick={handleSortingClick}
            />
            {isSortingOpen && (
              <div className="exercise-base-header-right__sorting-dropdown">
                <button
                  className={`sorting-option ${sortType === "name" ? "active" : ""}`}
                  onClick={() => {
                    setSortType("name");
                    setIsSortingOpen(false);
                  }}
                  type="button">
                  По названию
                </button>
                <button
                  className={`sorting-option ${sortType === "muscle" ? "active" : ""}`}
                  onClick={() => {
                    setSortType("muscle");
                    setIsSortingOpen(false);
                  }}
                  type="button">
                  По мышцам
                </button>
                <button
                  className={`sorting-option ${sortType === "difficulty" ? "active" : ""}`}
                  onClick={() => {
                    setSortType("difficulty");
                    setIsSortingOpen(false);
                  }}
                  type="button">
                  По сложности
                </button>
              </div>
            )}
          </div>

          {/* 🔍 Поиск */}
          <input
            type="text"
            placeholder="Поиск по названию/мышцам..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="exercise-base-header-right__search"
          />
        </div>
      </div>

      {/* 🧠 ГРУППИРОВКА МЫШЦ */}
      {groupingEnabled && (
        <div className="muscle-grouping-ui">
          {!selectedSupergroup && !selectedMuscleGroup && (
            <div className="supergroups-grid">
              {Object.entries(MUSCLE_SUPERGROUP_LABELS).map(([key, label]) => (
                <div
                  key={key}
                  className={`muscle-supergroup-card ${
                    selectedSupergroup === key ? "active" : ""
                  }`}
                  onClick={() => selectSupergroup(key as SupergroupKey)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      selectSupergroup(key as SupergroupKey);
                    }
                  }}>
                  <div className="muscle-supergroup-card__content">
                    <h3 className="muscle-supergroup-card__title">{label}</h3>
                    <div className="muscle-supergroup-card__muscles-count">
                      {MUSCLE_SUPERGROUPS[key as SupergroupKey].length} мышц
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedSupergroup && !selectedMuscleGroup && (
            <div className="muscle-groups-grid">
              {MUSCLE_SUPERGROUPS[selectedSupergroup as SupergroupKey].map(
                (muscleGroup) => (
                  <div
                    key={muscleGroup}
                    className={`muscle-group-card ${
                      selectedMuscleGroup === muscleGroup ? "active" : ""
                    }`}
                    onClick={() => selectMuscleGroup(muscleGroup)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        selectMuscleGroup(muscleGroup);
                      }
                    }}>
                    <div className="muscle-group-card__content">
                      <h4 className="muscle-group-card__title">
                        {MUSCLE_GROUP_LABELS[muscleGroup]}
                      </h4>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      )}

      {/* 💪 ГРИД УПРАЖНЕНИЙ */}
      <div className="exercise-base-grid">
        {groupedExercises.length > 0 ? (
          groupedExercises.map((exercise) => (
            <div key={exercise.id} className="exercise-base-grid-card">
              <div className="exercise-base-grid-card-content">
                <div className="exercise-base-grid-card-info">
                  <h3 className="exercise-base-grid-card-info__name">
                    {exercise.name}
                  </h3>
                  <div className="exercise-base-grid-card-info-add">
                    <span className="exercise-base-grid-card-info-add__muscle-group">
                      {MUSCLE_GROUP_LABELS[exercise.primaryMuscleGroup] ||
                        exercise.primaryMuscleGroup}
                    </span>
                    <span className="exercise-base-grid-card-info-add__difficulty">
                      {exercise.difficulty}
                    </span>
                    {exercise.description && (
                      <div className="exercise-base-grid-card-info-add__desc">
                        <p className="exercise-desc">{exercise.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ❤️ Избранное + ❌ Нелюбимое */}
                <button
                  type="button"
                  className={`exercise-base-grid-card__favorite-button ${
                    isFavorite(exercise.id)
                      ? "exercise-base-grid-card__favorite-button_active"
                      : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFavorite(exercise.id);
                  }}
                  disabled={loadingExercises.favorites || loadingExercises.all}
                  title={
                    isFavorite(exercise.id)
                      ? "Убрать из избранного"
                      : "Добавить в избранное"
                  }>
                  {isFavorite(exercise.id) ? "❤️" : "🤍"}
                </button>

                <button
                  type="button"
                  className={`exercise-base-grid-card__least-favorite-button ${
                    isLeastFavorite(exercise.id)
                      ? "exercise-base-grid-card__least-favorite-button_active"
                      : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleLeastFavorite(exercise.id);
                  }}
                  disabled={
                    loadingExercises.leastFavorites || loadingExercises.all
                  }
                  title={
                    isLeastFavorite(exercise.id)
                      ? "Убрать из нелюбимых"
                      : "Добавить в нелюбимые"
                  }>
                  <img
                    src={
                      isLeastFavorite(exercise.id)
                        ? dislikeFilledIcon
                        : dislikeIcon
                    }
                    alt="Нелюбимое"
                    width={26}
                    height={26}
                  />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-exercises">Упражнения не найдены</div>
        )}
      </div>

      {/* 💖 МОДАЛКА ИЗБРАННОГО */}
      {isFavoritesModalOpen && (
        <div
          className="favorites-modal-overlay"
          onClick={() => setIsFavoritesModalOpen(false)}>
          <div className="favorites-modal" onClick={(e) => e.stopPropagation()}>
            <div className="favorites-modal__header">
              <h2 className="favorites-modal__title">
                Избранное ({favoriteList.length})
              </h2>
              <button
                className="favorites-modal__close"
                onClick={() => setIsFavoritesModalOpen(false)}
                title="Закрыть"
                type="button">
                ×
              </button>
            </div>

            <div className="favorites-modal__content">
              {loadingExercises.favorites ? (
                <div className="favorites-modal__loading">🔄 Загружаем...</div>
              ) : favoriteList.length === 0 ? (
                <div className="favorites-modal__empty">
                  ❤️ Добавь упражнения в избранное
                </div>
              ) : (
                <ul className="favorites-modal__list">
                  {favoriteList.map((favorite) => (
                    <li key={favorite.id} className="favorites-modal__item">
                      <span className="favorites-modal__item-name">
                        {favorite.name}
                      </span>
                      <span className="favorites-modal__item-muscle">
                        ({MUSCLE_GROUP_LABELS[favorite.primaryMuscleGroup]})
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
