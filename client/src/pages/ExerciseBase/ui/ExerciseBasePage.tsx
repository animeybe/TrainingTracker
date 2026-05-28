// pages/ExerciseBasePage.tsx
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
import toast from "react-hot-toast";
import { ExercisePreferencesModal } from "@/shared/ui/components/ExercisePreferencesModal/ExercisePreferencesModal";
import type { Exercise } from "@/shared/api/types";

type SupergroupKey = keyof typeof MUSCLE_SUPERGROUPS;
type MuscleGroup =
  (typeof MUSCLE_SUPERGROUPS)[keyof typeof MUSCLE_SUPERGROUPS][number];

export function ExerciseBasePage() {
  const {
    allExercises: exercises,
    favoriteExercises,
    leastFavoriteExercises,
    loadingExercises,
    toggleFavorite,
    toggleLeastFavorite,
  } = useExercises();
  const { currentError: localError, clearError } = useError();

  const [search, setSearch] = useState("");
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);
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
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  );

  const sortingRef = useRef<HTMLDivElement>(null);

  // ==================== API FUNCTIONS ====================
  const isFavorite = useCallback(
    (exerciseId: string): boolean => {
      return favoriteExercises?.some((fav) => fav.id === exerciseId) ?? false;
    },
    [favoriteExercises],
  );

  const isLeastFavorite = useCallback(
    (exerciseId: string): boolean => {
      return (
        leastFavoriteExercises?.some((lf) => lf.id === exerciseId) ?? false
      );
    },
    [leastFavoriteExercises],
  );

  const handleToggleFavorite = useCallback(
    async (exerciseId: string) => {
      if (isLeastFavorite(exerciseId)) {
        toast.error("Упражнение уже в нелюбимых! Сначала уберите его");
        return;
      }
      await toggleFavorite(exerciseId);
    },
    [isLeastFavorite, toggleFavorite],
  );

  const handleToggleLeastFavorite = useCallback(
    async (exerciseId: string) => {
      if (isFavorite(exerciseId)) {
        toast.error("Упражнение уже в избранном! Сначала уберите его");
        return;
      }
      await toggleLeastFavorite(exerciseId);
    },
    [isFavorite, toggleLeastFavorite],
  );

  // ==================== COMPUTED / MEMO ====================
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

  const groupedExercises = useMemo(() => {
    if (!sortedExercises.length) return [];
    // Группировка выключена — показываем все
    if (!groupingEnabled) return sortedExercises;
    // Выбрана конкретная мышца — показываем упражнения для неё
    if (selectedMuscleGroup) {
      return sortedExercises.filter((exercise) => {
        const secondary = exercise.secondaryMuscles || [];
        return secondary.includes(selectedMuscleGroup);
      });
    }
    // Выбрана супергруппа или ничего — НЕ показываем упражнения
    return [];
  }, [groupingEnabled, selectedMuscleGroup, sortedExercises]);

  const handlePreferencesModalOpen = useCallback(() => {
    setIsPreferencesModalOpen(true);
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

  useEffect(() => {
    localStorage.setItem(
      "exerciseBaseGroupingEnabled",
      JSON.stringify(groupingEnabled),
    );
  }, [groupingEnabled]);

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
      if (e.key === "Escape") setIsSortingOpen(false);
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
        retryAction={() => clearError()}
      />
    );
  }

  return (
    <div className="exercise-base-content">
      <div className="exercise-base-header">
        <div className="exercise-base-header-left">
          <span className="exercise-base-header-left__exercise-count">
            Упражнения ({exercises?.length ?? 0})
          </span>
          <button
            className="exercise-base-header-left__exercise-preferences-count"
            onClick={handlePreferencesModalOpen}
            title="Ваши предпочтения">
            Мои предпочтения:{" "}
            {`${favoriteExercises?.length ?? 0} / ${leastFavoriteExercises?.length ?? 0}`}
          </button>
        </div>

        {groupingEnabled && selectedSupergroup && (
          <button
            className="exercise-base-header__back-btn"
            onClick={() => {
              if (selectedMuscleGroup) setSelectedMuscleGroup(null);
              else setSelectedSupergroup(null);
            }}
            title="Назад"
            type="button">
            ← Назад
          </button>
        )}

        <div className="exercise-base-header-right">
          <button
            type="button"
            className={`exercise-base-header-right__grouping-muscles-btn ${groupingEnabled ? "active" : ""}`}
            onClick={toggleGrouping}
            title={
              groupingEnabled
                ? "Выключить группировку"
                : "Включить группировку по мышцам"
            }>
            <img src={groupingByMusclesIcon} alt="Группировка по мышцам" />
          </button>

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

          <input
            type="text"
            placeholder="Поиск по названию/мышцам..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="exercise-base-header-right__search"
          />
        </div>
      </div>

      {groupingEnabled && (
        <div className="muscle-grouping-ui">
          {!selectedSupergroup && !selectedMuscleGroup && (
            <div className="supergroups-grid">
              {Object.entries(MUSCLE_SUPERGROUP_LABELS).map(([key, label]) => (
                <div
                  key={key}
                  className={`muscle-supergroup-card ${selectedSupergroup === key ? "active" : ""}`}
                  onClick={() => selectSupergroup(key as SupergroupKey)}
                  role="button"
                  tabIndex={0}>
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
                    className={`muscle-group-card ${selectedMuscleGroup === muscleGroup ? "active" : ""}`}
                    onClick={() => selectMuscleGroup(muscleGroup)}
                    role="button"
                    tabIndex={0}>
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

      <div className="exercise-base-grid">
        {groupedExercises.length > 0 ? (
          groupedExercises.map((exercise) => (
            <div
              key={exercise.id}
              className="exercise-base-grid-card"
              onClick={() => setSelectedExercise(exercise)}>
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
                  </div>
                </div>

                <button
                  type="button"
                  className={`exercise-base-grid-card__favorite-button ${isFavorite(exercise.id) ? "active" : ""}`}
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
                  className={`exercise-base-grid-card__least-favorite-button ${isLeastFavorite(exercise.id) ? "active" : ""}`}
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

      {/* Модальное окно упражнения */}
      {selectedExercise && (
        <div
          className="exercise-detail-overlay"
          onClick={() => setSelectedExercise(null)}>
          <div
            className="exercise-detail-modal"
            onClick={(e) => e.stopPropagation()}>
            <button
              className="exercise-detail-modal__close"
              onClick={() => setSelectedExercise(null)}
              type="button">
              ×
            </button>

            {/* Фото */}
            <div className="exercise-detail-modal__image">
              {selectedExercise.imageUrl ? (
                <img
                  src={selectedExercise.imageUrl}
                  alt={selectedExercise.name}
                />
              ) : (
                <div className="exercise-detail-modal__image-placeholder">
                  <span>📷</span>
                  <span>Нет фото</span>
                </div>
              )}
            </div>

            {/* Название */}
            <h2 className="exercise-detail-modal__title">
              {selectedExercise.name}
            </h2>

            {/* Теги */}
            <div className="exercise-detail-modal__tags">
              <span className="exercise-detail-modal__tag exercise-detail-modal__tag--muscle">
                {MUSCLE_GROUP_LABELS[selectedExercise.primaryMuscleGroup] ||
                  selectedExercise.primaryMuscleGroup}
              </span>
              <span className="exercise-detail-modal__tag exercise-detail-modal__tag--difficulty">
                {selectedExercise.difficulty === "EASY"
                  ? "Лёгкая"
                  : selectedExercise.difficulty === "MEDIUM"
                    ? "Средняя"
                    : "Сложная"}
              </span>
              {selectedExercise.secondaryMuscles?.map((m) => (
                <span
                  key={m}
                  className="exercise-detail-modal__tag exercise-detail-modal__tag--secondary">
                  {MUSCLE_GROUP_LABELS[m] || m}
                </span>
              ))}
            </div>

            {/* Описание */}
            <div className="exercise-detail-modal__description">
              <h3>Описание</h3>
              <p>{selectedExercise.description || "Описание отсутствует"}</p>
            </div>

            {/* Видео */}
            <div className="exercise-detail-modal__video">
              <h3>Видео-инструкция</h3>
              {selectedExercise.videoUrl ? (
                <iframe
                  src={selectedExercise.videoUrl}
                  title={selectedExercise.name}
                  allowFullScreen
                />
              ) : (
                <div className="exercise-detail-modal__video-placeholder">
                  <span>🎬</span>
                  <span>Видео отсутствует</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isPreferencesModalOpen && (
        <ExercisePreferencesModal
          favoriteExercises={favoriteExercises || []}
          leastFavoriteExercises={leastFavoriteExercises || []}
          isLoading={
            loadingExercises.favorites || loadingExercises.leastFavorites
          }
          onClose={() => setIsPreferencesModalOpen(false)}
        />
      )}
    </div>
  );
}
