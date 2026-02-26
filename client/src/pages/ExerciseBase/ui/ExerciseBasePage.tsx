import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { exerciseApi, favoriteApi } from "@/shared/api";
import type { Exercise } from "@/shared/api/types";
import "./ExerciseBasePage.scss";
import { InfoPage } from "@/pages";
import groupingByMusclesIcon from "@/assets/icon/groupingByMuscles.svg";
import sortingIcon from "@/assets/icon/sorting.svg";
import {
  MUSCLE_SUPERGROUPS,
  MUSCLE_SUPERGROUP_LABELS,
  MUSCLE_GROUP_LABELS,
} from "../models/muscleGroupInterpreter";

type SupergroupKey = keyof typeof MUSCLE_SUPERGROUPS;
type MuscleGroup =
  (typeof MUSCLE_SUPERGROUPS)[keyof typeof MUSCLE_SUPERGROUPS][number];

export function ExerciseBasePage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [favoriteList, setFavoriteList] = useState<Exercise[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState<boolean>(false);
  const [isLoadingExercises, setIsLoadingExercises] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);

  const [groupingEnabled, setGroupingEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("exerciseBaseGroupingEnabled");
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  const [selectedSupergroup, setSelectedSupergroup] =
    useState<SupergroupKey | null>(null);
  const [selectedMuscleGroup, setSelectedMuscleGroup] =
    useState<MuscleGroup | null>(null);

  const [isSortingOpen, setIsSortingOpen] = useState(false);
  const [sortType, setSortType] = useState<
    "name" | "muscle" | "difficulty" | "type"
  >("name");
  const sortingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("exerciseBaseGroupingEnabled");
      if (saved !== null) {
        setGroupingEnabled(JSON.parse(saved));
      }
    } catch {
      setError("Не удалось загрузить настройки группировки");
    }

    const loadExercises = async (retries = 2) => {
      setIsLoadingExercises(true);
      try {
        const response = await exerciseApi.getAll();
        setExercises(Array.isArray(response) ? response : response.data || []);
      } catch {
        if (retries > 0) {
          setTimeout(() => loadExercises(retries - 1), 1000);
        } else {
          setError("Не вышло загрузить список упражнений, извините :(");
        }
      } finally {
        setIsLoadingExercises(false);
      }
    };
    loadExercises();
  }, []);

  useEffect(() => {
    if (!exercises.length) return;

    const loadFavorites = async (retries = 2) => {
      setIsLoadingFavorites(true);
      try {
        const response = await favoriteApi.getFavorites();
        const data = Array.isArray(response) ? response : response.data || [];
        setFavoriteList(data);
      } catch {
        if (retries > 0) {
          setTimeout(() => loadFavorites(retries - 1), 1000);
        } else {
          setError("Невозможно загрузить избранное, извините :(");
        }
      } finally {
        setIsLoadingFavorites(false);
      }
    };

    loadFavorites();
  }, [exercises]);

  const isFavorite = useCallback(
    (exerciseId: string): boolean => {
      return favoriteList.some((fav) => fav.id === exerciseId);
    },
    [favoriteList],
  );

  const handleToggleFavorite = async (exerciseId: string) => {
    const wasFavorite = isFavorite(exerciseId);
    setFavoriteList((prev) => {
      if (wasFavorite) {
        console.log("🗑️ Удаляем:", exerciseId);
        return prev.filter((fav) => fav.id !== exerciseId);
      } else {
        console.log("⭐ Добавляем:", exerciseId);
        const exercise = exercises.find((ex) => ex.id === exerciseId);
        if (exercise) {
          return [
            {
              id: exerciseId,
              name: exercise.name,
              muscleGroup: exercise.muscleGroup,
              type: exercise.type,
              difficulty: exercise.difficulty || ("beginner" as const),
            },
            ...prev,
          ];
        }
      }
      return prev;
    });

    try {
      await favoriteApi.toggleFavorite(exerciseId);
      console.log("✅ API OK:", exerciseId);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("❌ API Error (UI сохранено):", errorMessage);
    }
  };

  const handleFavoritesClick = useCallback(() => {
    setIsFavoritesModalOpen(true);
  }, []);

  const filteredExercises = useMemo(() => {
    if (!search.trim()) return exercises;

    const lowerSearch = search.toLowerCase();

    return exercises.filter((ex) => {
      const nameMatch = ex.name.toLowerCase().includes(lowerSearch);
      const muscleRu = MUSCLE_GROUP_LABELS[ex.muscleGroup]?.toLowerCase() || "";
      const muscleEn = ex.muscleGroup.split("_").join(" ")?.toLowerCase() || "";
      const muscleMatch =
        muscleRu.includes(lowerSearch) || muscleEn.includes(lowerSearch);
      const typeMatch = ex.type.toLowerCase().includes(lowerSearch);
      const difficultyMatch =
        ex.difficulty?.toLowerCase().includes(lowerSearch) || false;

      return nameMatch || muscleMatch || typeMatch || difficultyMatch;
    });
  }, [exercises, search]);

  const handleSortingClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSortingOpen((prev) => !prev);
  };

  const sortedExercises = useMemo(() => {
    const filtered = search.trim() ? filteredExercises : exercises;

    return [...filtered].sort((a, b) => {
      switch (sortType) {
        case "name": {
          return a.name.localeCompare(b.name);
        }
        case "muscle": {
          return (
            MUSCLE_GROUP_LABELS[a.muscleGroup]?.localeCompare(
              MUSCLE_GROUP_LABELS[b.muscleGroup] || "",
            ) || 0
          );
        }
        case "difficulty": {
          const diffOrder: Record<string, number> = {
            beginner: 1,
            intermediate: 2,
            advanced: 3,
          };
          return (
            (diffOrder[a.difficulty || "beginner"] || 0) -
            (diffOrder[b.difficulty || "beginner"] || 0)
          );
        }
        case "type": {
          return a.type.localeCompare(b.type);
        }
        default:
          return 0;
      }
    });
  }, [exercises, filteredExercises, search, sortType]);

  // Логика группировки по мышцам
  const groupedExercises = useMemo(() => {
    if (!groupingEnabled) {
      return sortedExercises; // Уровень 1: все упражнения
    }

    if (selectedMuscleGroup) {
      // Уровень 3: конкретная группа мышц
      return sortedExercises.filter(
        (ex) => ex.muscleGroup === selectedMuscleGroup,
      );
    }

    if (selectedSupergroup) {
      const supergroupMuscles = MUSCLE_SUPERGROUPS[selectedSupergroup];
      return sortedExercises.filter((ex) => {
        return supergroupMuscles.some((muscle) => muscle === ex.muscleGroup);
      });
    }

    // Уровень 1: все упражнения с группировкой включенной (но без выбора)
    return sortedExercises;
  }, [
    groupingEnabled,
    selectedSupergroup,
    selectedMuscleGroup,
    sortedExercises,
  ]);

  const toggleGrouping = () => {
    const newState = !groupingEnabled;
    setGroupingEnabled(newState);
    setSelectedSupergroup(null);
    setSelectedMuscleGroup(null);
  };

  const selectSupergroup = (supergroup: SupergroupKey) => {
    setSelectedSupergroup((prev) => (prev === supergroup ? null : supergroup));
    setSelectedMuscleGroup(null); // Сбрасываем выбор мышцы при выборе супергруппы
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

  if (isLoadingExercises || isLoadingFavorites) {
    return <InfoPage type="loading" />;
  }

  if (error) {
    return <InfoPage type="error" errorText={error} />;
  }

  return (
    <div className="exercise-base-content">
      <div className="exercise-base-header">
        <div className="exercise-base-header-left">
          <span className="exercise-base-header-left__exercise-count">
            Упражнения ({exercises.length})
          </span>
          <button
            type="button"
            className="exercise-base-header-left__exercise-favorite-count"
            onClick={handleFavoritesClick}
            title="Показать избранное">
            Избранное: {favoriteList.length}
          </button>
        </div>

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
            title="Назад">
            ← Назад
          </button>
        )}

        <div className="exercise-base-header-right">
          {/* Кнопка группировки по мышцам */}
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

          {/* Сортировка */}
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
                  }}>
                  По названию
                </button>
                <button
                  className={`sorting-option ${sortType === "muscle" ? "active" : ""}`}
                  onClick={() => {
                    setSortType("muscle");
                    setIsSortingOpen(false);
                  }}>
                  По мышцам
                </button>
                <button
                  className={`sorting-option ${sortType === "difficulty" ? "active" : ""}`}
                  onClick={() => {
                    setSortType("difficulty");
                    setIsSortingOpen(false);
                  }}>
                  По сложности
                </button>
                <button
                  className={`sorting-option ${sortType === "type" ? "active" : ""}`}
                  onClick={() => {
                    setSortType("type");
                    setIsSortingOpen(false);
                  }}>
                  По типу
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

      {/* UI группировки по мышцам - КАРТОЧКИ */}
      {groupingEnabled && (
        <div className="muscle-grouping-ui">
          {/* Супергруппы мышц - КАРТОЧКИ */}
          {!selectedSupergroup && !selectedMuscleGroup && (
            <div className="supergroups-grid">
              {Object.entries(MUSCLE_SUPERGROUP_LABELS).map(([key, label]) => (
                <div
                  key={key}
                  className={`muscle-supergroup-card ${selectedSupergroup === key ? "active" : ""}`}
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

          {/* Группы мышц внутри супергруппы - КАРТОЧКИ */}
          {selectedSupergroup && !selectedMuscleGroup && (
            <div className="muscle-groups-grid">
              {MUSCLE_SUPERGROUPS[selectedSupergroup as SupergroupKey].map(
                (muscleGroup) => (
                  <div
                    key={muscleGroup}
                    className={`muscle-group-card ${selectedMuscleGroup === muscleGroup ? "active" : ""}`}
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

      {/* Сетка контента - ЛОГИКА 3 УРОВНЕЙ */}
      {!groupingEnabled ? (
        // ГРУППИРОВКА ВЫКЛЮЧЕНА - показываем ВСЕ упражнения
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
                        {MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
                      </span>
                      <span className="exercise-base-grid-card-info-add__type">
                        {exercise.type}
                      </span>
                      <span className="exercise-base-grid-card-info-add__difficulty">
                        {exercise.difficulty}
                      </span>
                      <div className="exercise-base-grid-card-info-add__desc">
                        {exercise.description && (
                          <p className="exercise-desc">
                            {exercise.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

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
                    disabled={isLoadingFavorites || isLoadingExercises}
                    title={
                      isFavorite(exercise.id)
                        ? "Убрать из избранного"
                        : "Добавить в избранное"
                    }>
                    {isFavorite(exercise.id) ? "❤️" : "🤍"}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-exercises">Упражнения не найдены</div>
          )}
        </div>
      ) : selectedMuscleGroup ? (
        // УРОВЕНЬ 3: упражнения конкретной группы мышц
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
                        {MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
                      </span>
                      <span className="exercise-base-grid-card-info-add__type">
                        {exercise.type}
                      </span>
                      <span className="exercise-base-grid-card-info-add__difficulty">
                        {exercise.difficulty}
                      </span>
                      <div className="exercise-base-grid-card-info-add__desc">
                        {exercise.description && (
                          <p className="exercise-desc">
                            {exercise.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

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
                    disabled={isLoadingFavorites || isLoadingExercises}
                    title={
                      isFavorite(exercise.id)
                        ? "Убрать из избранного"
                        : "Добавить в избранное"
                    }>
                    {isFavorite(exercise.id) ? "❤️" : "🤍"}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-exercises">Упражнения не найдены</div>
          )}
        </div>
      ) : null}

      {/* МОДАЛЬНОЕ ОКНО ИЗБРАННОГО */}
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
                title="Закрыть">
                ×
              </button>
            </div>

            <div className="favorites-modal__content">
              {isLoadingFavorites ? (
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
                        ({MUSCLE_GROUP_LABELS[favorite.muscleGroup]})
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
