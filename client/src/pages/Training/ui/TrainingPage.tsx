import "./TrainingPage.scss";
import { useState, useEffect, useCallback, useMemo } from "react";
import { planApi, exerciseApi, profileApi } from "@/shared/api";
import type {
  WeekPlanResponse,
  Wellbeing,
  TodayPlanResponse,
  ProfileData,
  Exercise,
  ExerciseListResponse,
} from "@/shared/api/types";
import {
  getDayTypeRu,
  getSplitNameRu,
} from "../common/utils/training-split-utils";
import { InfoPage } from "@/shared/ui/components/ErrorUI/ui/InfoPage";
import { logger } from "@/lib/utils/logger";
import type { ErrorType } from "@/shared/ui/components/ErrorUI/model/types";

// ======================================================================
// УТИЛИТЫ
// ======================================================================

/**
 * Извлекает userId из JWT токена localStorage
 * @returns userId | null
 */
const getUserIdFromToken = (): string | null => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.userId;
  } catch {
    logger.warn("getUserIdFromToken failed - invalid token");
    return null;
  }
};

/**
 * Проверяет полноту профиля для генерации плана
 * @param profile - данные профиля
 * @returns true если неполный
 */
const checkProfileCompleteness = (profile: ProfileData | null): boolean => {
  if (!profile) return true;
  return [
    profile.age,
    profile.weight,
    profile.height,
    profile.goal,
    profile.lifestyle,
  ].some((field) => field == null);
};

/**
 * Форматирует дату в YYYY-MM-DD (для localStorage wellbeing)
 */
const getTodayString = () => new Date().toISOString().split("T")[0];

// ======================================================================
// ОСНОВНОЙ КОМПОНЕНТ
// ======================================================================

export function TrainingPage() {
  // ==================== STATE ====================
  const userId = getUserIdFromToken();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [weekPlan, setWeekPlan] = useState<WeekPlanResponse | null>(null);
  const [todayPlan, setTodayPlan] = useState<TodayPlanResponse | null>(null);
  const [currentWeek] = useState(1);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<{
    type: ErrorType;
    message?: string;
  } | null>(null);
  const [todayLoading, setTodayLoading] = useState(false);
  const [wellbeing, setWellbeing] = useState<Wellbeing>("NORMAL");
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(true);
  const [showWellbeingModal, setShowWellbeingModal] = useState(false);
  const [showWellbeingWarning, setShowWellbeingWarning] = useState(false);
  const [wellbeingWarningAction, setWellbeingWarningAction] =
    useState<Wellbeing | null>(null);
  const [, setCanGoPrevWeek] = useState(false);
  const [, setCanGoNextWeek] = useState(true);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  // ==================== COMPUTED ====================
  // Текущий день недели (backend: 0=пн...6=вс)
  const today = useMemo(() => {
    const date = new Date();
    const jsDay = date.getDay(); // JS: 0=вс...6=сб
    const backendDayIndex = jsDay === 0 ? 6 : jsDay - 1; // → backend: 0=пн...6=вс

    return {
      dayIndex: backendDayIndex,
      dayOfWeek: [
        "Понедельник",
        "Вторник",
        "Среда",
        "Четверг",
        "Пятница",
        "Суббота",
        "Воскресенье",
      ][backendDayIndex],
    };
  }, []);

  // ==================== API FUNCTIONS ====================
  /**
   * Загружает упражнения (один раз)
   */
  const loadExercises = useCallback(async () => {
    if (exercises.length > 0) {
      logger.debug("loadExercises skipped: already loaded");
      return;
    }

    logger.debug("loadExercises started");
    try {
      const response = await exerciseApi.getAllExercises();
      const exerciseList: Exercise[] = Array.isArray(response)
        ? response
        : (response?.data ?? []);

      logger.debug("exerciseApi.getAllExercises success", {
        count: exerciseList.length,
        total: (response as ExerciseListResponse)?.total || 0,
      });

      setExercises(exerciseList);
    } catch (error) {
      logger.error("loadExercises failed", { error });
      setExercises([]); // Graceful degradation
      setLocalError({
        type: "network",
        message: "Не удалось загрузить упражнения",
      });
    }
  }, [exercises.length]);

  /**
   * Загружает профиль пользователя
   */
  const loadProfile = useCallback(async () => {
    if (!userId) {
      logger.debug("loadProfile skipped: no userId");
      return;
    }

    logger.debug("loadProfile started", { userId });
    try {
      const data = await profileApi.getProfile();
      logger.debug("profileApi.getProfile success", {
        age: data.age,
        goal: data.goal,
      });
      setProfile(data);

      const incomplete = checkProfileCompleteness(data);
      setIsProfileIncomplete(incomplete);
    } catch (error) {
      logger.error("loadProfile failed", { error });
      setLocalError({
        type: "network",
        message: "Не удалось загрузить профиль",
      });
    }
  }, [userId]);

  /**
   * Загружает план за конкретную неделю (с обработкой 404)
   */
  // const loadWeekPlanFromDB = useCallback(
  //   async (week: number, uid: string): Promise<boolean> => {
  //     if (!uid || !profile) {
  //       logger.debug("loadWeekPlanFromDB skipped", {
  //         week,
  //         hasProfile: !!profile,
  //       });
  //       return false;
  //     }

  //     try {
  //       const plan = await planApi.getPlan(uid, week);
  //       logger.debug("planApi.getPlan success", { week, planExists: !!plan });
  //       setWeekPlan(plan);
  //       return true;
  //     } catch (error: unknown) {
  //       if (error.message?.includes("404")) {
  //         logger.debug("loadWeekPlanFromDB 404 - no plan", { week, uid });
  //         setWeekPlan(null);
  //         return false; // Нормально!
  //       }
  //       logger.error("loadWeekPlanFromDB failed", { week, uid, error });
  //       setLocalError({
  //         type: "network",
  //         message: "Не удалось загрузить план",
  //       });
  //       setWeekPlan(null);
  //       return false;
  //     }
  //   },
  //   [profile],
  // );

  /**
   * Корректирует план на сегодня по wellbeing (требует полный профиль!)
   */
  const loadTodayPlan = useCallback(
    async (currentWellbeing: Wellbeing) => {
      if (!profile || checkProfileCompleteness(profile)) {
        logger.debug("loadTodayPlan skipped - profile incomplete", {
          hasProfile: !!profile,
          wellbeing: currentWellbeing,
        });
        return;
      }

      setTodayLoading(true);
      logger.debug("loadTodayPlan started", { wellbeing: currentWellbeing });

      try {
        const response = await planApi.getTodayAdjusted(currentWellbeing);
        logger.debug("planApi.getTodayAdjusted success");
        setTodayPlan(response);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        logger.error("loadTodayPlan failed", {
          wellbeing: currentWellbeing,
          error: errorMessage,
        });

        if (errorMessage.includes("400") || errorMessage.includes("HTTP 400")) {
          logger.debug("loadTodayPlan 400 - backend validation");
          setTodayPlan(null);
          return;
        }

        setLocalError({
          type: "network",
          message: "Не удалось скорректировать план",
        });
      } finally {
        setTodayLoading(false);
      }
    },
    [profile],
  );

  /**
   * Генерирует новый недельный план
   */
  const handleGeneratePlan = useCallback(async () => {
    if (!userId || !profile || loading || checkProfileCompleteness(profile)) {
      logger.debug("handleGeneratePlan skipped", {
        hasUserId: !!userId,
        profileComplete: !checkProfileCompleteness(profile),
        loading,
      });
      return;
    }

    setLoading(true);
    logger.debug("handleGeneratePlan started", {
      week: currentWeek,
      wellbeing,
    });

    try {
      const response = await planApi.generatePlan({
        split: { name: "PPL" as const, days: [] },
        wellbeing,
        week: currentWeek,
      });
      logger.debug("planApi.generatePlan success");
      setWeekPlan(response);

      // НЕ дублируем loadWeekPlanFromDB — response свежий!
      await loadTodayPlan(wellbeing);
    } catch (error) {
      logger.error("handleGeneratePlan failed", { error });
      setLocalError({ type: "500", message: "Ошибка генерации плана" });
    } finally {
      setLoading(false);
    }
  }, [userId, profile, loading, currentWeek, wellbeing, loadTodayPlan]);

  /**
   * Сохраняет wellbeing в localStorage
   */
  const setStoredWellbeingToday = useCallback((w: Wellbeing): void => {
    const today = getTodayString();
    const storedRaw = localStorage.getItem("wellbeingHistory") || "{}";
    const stored = JSON.parse(storedRaw) as Record<string, Wellbeing>;
    stored[today] = w;
    logger.debug("setStoredWellbeingToday", { today, wellbeing: w });
    localStorage.setItem("wellbeingHistory", JSON.stringify(stored));
  }, []);

  /**
   * Читает wellbeing за сегодня из localStorage
   */
  const getStoredWellbeingToday = useCallback((): Wellbeing | null => {
    const storedRaw = localStorage.getItem("wellbeingHistory") || "{}";
    logger.debug("getStoredWellbeingToday raw", {
      raw: storedRaw.slice(0, 50),
    });

    const stored = JSON.parse(storedRaw) as Record<string, Wellbeing>;
    const today = getTodayString();
    const result = stored[today] ?? null;
    logger.debug("getStoredWellbeingToday", { today, result });
    return result;
  }, []);

  // ==================== INITIAL LOAD ====================
  /**
   * Первая загрузка: профиль + упражнения + попытка плана
   */
  const loadInitialData = useCallback(async () => {
    try {
      logger.debug("FirstLoad started");

      // Параллельно профиль + упражнения
      await Promise.allSettled([loadProfile(), loadExercises()]);

      // Безопасная попытка загрузить план (404 = OK)
      let plan: WeekPlanResponse | null = null;
      try {
        plan = await planApi.getPlan(userId!, currentWeek);
        logger.debug("FirstLoad planApi.getPlan SUCCESS");
      } catch {
        logger.debug("FirstLoad no plan - 404 OK", { week: currentWeek });
      }
      setWeekPlan(plan);

      // Если план есть — today план из него
      if (plan?.trainingDays) {
        const todayDayPlan = plan.trainingDays.find(
          (day) => day.dayOfWeek === today.dayIndex,
        );
        if (todayDayPlan) {
          setTodayPlan({
            today: todayDayPlan,
            wellbeingAdjusted: false,
            message: `Сегодня: ${getDayTypeRu(todayDayPlan.dayType)}`,
          });
        }
      }

      // Wellbeing: если есть в localStorage — set (НЕ loadTodayPlan!)
      const todayWellbeing = getStoredWellbeingToday();
      if (todayWellbeing) {
        setWellbeing(todayWellbeing);
        logger.debug("todayWellbeing restored from localStorage");
      } else {
        setShowWellbeingModal(true);
      }
    } catch (error) {
      logger.error("FirstLoad CRITICAL failed", { error });
      setLocalError({ type: "network", message: "Ошибка начальной загрузки" });
    }
  }, [
    userId,
    currentWeek,
    today.dayIndex,
    loadProfile,
    loadExercises,
    getStoredWellbeingToday,
  ]);

  // ==================== USE EFFECTS ====================
  // 🚀 Первая загрузка при монтировании
  useEffect(() => {
    if (!userId) {
      logger.debug("FirstLoad skipped: no userId");
      return;
    }
    loadInitialData();
  }, [userId, loadInitialData]); // Стабильные deps!

  // 📊 Логи состояния (DEV only)
  useEffect(() => {
    if (import.meta.env.DEV) {
      logger.debug("TrainingPage state", {
        userId,
        profile: profile ? { age: profile.age, goal: profile.goal } : null,
        weekPlan: weekPlan
          ? {
              week: weekPlan.week,
              trainingDaysCount: weekPlan.trainingDays?.length,
            }
          : null,
        todayPlan: !!todayPlan,
        wellbeing,
      });
    }
  }, [userId, profile, weekPlan, todayPlan, wellbeing]);

  // Навигация по неделям
  useEffect(() => {
    if (!weekPlan) {
      setCanGoPrevWeek(false);
      setCanGoNextWeek(false);
      return;
    }

    setCanGoPrevWeek(currentWeek > 1);
    setCanGoNextWeek(true); // Всегда можно вперед
    logger.debug("Week navigation", {
      currentWeek,
      canGoPrevWeek: currentWeek > 1,
      canGoNextWeek: true,
    });
  }, [weekPlan, currentWeek]);

  // ==================== WELLBEING HANDLERS ====================
  const handleWellbeingSubmit = useCallback(
    async (newWellbeing: Wellbeing) => {
      logger.debug("handleWellbeingSubmit", { newWellbeing });
      setShowWellbeingModal(false);
      setWellbeing(newWellbeing);
      setStoredWellbeingToday(newWellbeing);
      setShowWellbeingWarning(false);
      setWellbeingWarningAction(null);

      // loadTodayPlan ТОЛЬКО здесь — после выбора!
      await loadTodayPlan(newWellbeing);
    },
    [loadTodayPlan, setStoredWellbeingToday],
  );

  const confirmWellbeingChange = () => {
    logger.debug("confirmWellbeingChange", { wellbeingWarningAction });
    if (wellbeingWarningAction) {
      handleWellbeingSubmit(wellbeingWarningAction);
    }
  };

  const handleWellbeingChange = (w: Wellbeing) => {
    logger.debug("handleWellbeingChange", { w });
    setWellbeingWarningAction(w);
    if (w === "BAD" || w === "GOOD") {
      setShowWellbeingWarning(true); // Подтверждение
    } else {
      handleWellbeingSubmit(w); // NORMAL = сразу
    }
  };

  // ==================== RENDER ====================
  if (localError) {
    return (
      <InfoPage
        type={localError.type}
        message={localError.message}
        retryAction={() => {
          setLocalError(null);
          loadInitialData();
        }}
      />
    );
  }

  return (
    <div className="training-page">
      {/* 1. ПЛАН ЕСТЬ = календарь + today */}
      {weekPlan && (
        <div className="training-page__plan">
          <div className="training-page__plan-header">
            <h1 className="training-page__plan-title">
              Недельный план: {getSplitNameRu(weekPlan.split.name)}
            </h1>
            <p className="training-page__plan-subtitle">
              Неделя {weekPlan.week}
            </p>
          </div>

          {/* Сегодняшний день */}
          <div className="training-page__today">
            <h2 className="training-page__today-day">
              {todayPlan?.today
                ? [
                    "Понедельник",
                    "Вторник",
                    "Среда",
                    "Четверг",
                    "Пятница",
                    "Суббота",
                    "Воскресенье",
                  ][todayPlan.today.dayIndex]
                : "Неизвестный день"}
            </h2>

            {/* Перевыбрать wellbeing (только сегодня) */}
            {todayPlan?.today?.dayIndex === today.dayIndex && (
              <div className="training-page__today-controls">
                <div className="training-page__current-wellbeing">
                  <span className="current-wellbeing-label">Самочувствие:</span>
                  <span
                    className={`current-wellbeing-badge wellbeing-${wellbeing.toLowerCase()}`}>
                    {wellbeing === "BAD"
                      ? "😷 Плохо"
                      : wellbeing === "NORMAL"
                        ? "🙂 Нормально"
                        : "💪 Отлично"}
                  </span>
                </div>
                <button
                  className="training-page__change-wellbeing-btn"
                  onClick={() => setShowWellbeingModal(true)}>
                  Перевыбрать
                </button>
              </div>
            )}

            {todayLoading ? (
              <p className="training-page__today-message">
                Загружаем план на сегодня...
              </p>
            ) : (
              <p className="training-page__today-message">
                {todayPlan?.today?.exercises.length
                  ? "План на сегодня:"
                  : "Сегодня можете отдохнуть :)"}
              </p>
            )}

            <div className="training-page__today-exercises">
              {todayPlan?.today?.exercises?.length ? (
                todayPlan.today.exercises.map((ex, idx) => {
                  const exercise = exercises.find(
                    (e) => e.id === ex.exerciseId,
                  );
                  return (
                    <div key={idx} className="training-page__today-exercise">
                      <span className="training-page__exercise-name">
                        {exercise?.name || "Неизвестное упражнение"}
                      </span>
                      <span className="training-page__exercise-info">
                        {ex.sets} подхода × {ex.targetRepsRange[0]}–
                        {ex.targetRepsRange[1]} повторений
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="training-page__today-rest">
                  Отдых — можно бег, прогулку или лёгкую растяжку 🌿
                </p>
              )}
            </div>
          </div>

          {/* 📊 Календарь */}
          <div className="training-page__calendar">
            {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((dayName, idx) => {
              const dayIndex = idx;
              const dayPlan = weekPlan.trainingDays?.find(
                (day) => day.dayOfWeek === dayIndex,
              );

              return (
                <div
                  key={dayIndex}
                  className={`training-page__day-cell ${
                    todayPlan?.today?.dayIndex === dayIndex
                      ? "training-page__day-cell--selected"
                      : ""
                  }`}
                  onClick={() => {
                    const selectedDayData = dayPlan || {
                      dayIndex,
                      dayOfWeek: dayIndex,
                      dayType: "rest" as const,
                      exercises: [],
                      coverage: 0,
                      estimatedDuration: 0,
                      warnings: [],
                    };
                    setTodayPlan({
                      today: selectedDayData,
                      wellbeingAdjusted: false,
                      message: dayPlan
                        ? `День ${dayName}: ${getDayTypeRu(dayPlan.dayType)}`
                        : `Отдых ${dayName}`,
                    });
                  }}>
                  <span className="training-page__day-name">{dayName}</span>
                  {dayPlan ? (
                    <span className="training-page__day-type">
                      {getDayTypeRu(dayPlan.dayType)}
                    </span>
                  ) : (
                    <span className="training-page__day-status">Отдых</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. ПЛАНА НЕТ = профиль + кнопка генерации */}
      {!weekPlan && (
        <div className="training-page__no-plan">
          <div className="training-page__profile">
            <h3 className="training-page__profile-title">Ваши данные</h3>
            <div className="training-page__profile-row">
              <span className="training-page__profile-label">Возраст:</span>
              <span>{profile?.age ?? "Пока пусто"}</span>
            </div>
            <div className="training-page__profile-row">
              <span className="training-page__profile-label">Вес:</span>
              <span>{profile?.weight ?? "Пока пусто"} кг</span>
            </div>
            <div className="training-page__profile-row">
              <span className="training-page__profile-label">Рост:</span>
              <span>{profile?.height ?? "Пока пусто"} см</span>
            </div>
            <div className="training-page__profile-row">
              <span className="training-page__profile-label">Цель:</span>
              <span>{profile?.goal ?? "Пока не указана"}</span>
            </div>
            <div className="training-page__profile-row">
              <span className="training-page__profile-label">Образ жизни:</span>
              <span>{profile?.lifestyle ?? "Пока не указан"}</span>
            </div>
            <div className="training-page__profile-row">
              <span className="training-page__profile-label">BMI:</span>
              <span>
                {profile?.bmi?.toFixed(1) ?? "Не расчитан"} (
                {profile?.bmiCategory ?? "–"})
              </span>
            </div>
          </div>

          {isProfileIncomplete && (
            <p className="training-page__error">
              Перед тем как создать план — полностью заполните профиль
            </p>
          )}

          <div className="training-page__controls">
            <button
              className="training-page__generate-btn"
              onClick={handleGeneratePlan}
              disabled={loading || isProfileIncomplete}
              type="button">
              {loading
                ? "Создаём план..."
                : isProfileIncomplete
                  ? "План не доступен — профиль не заполнен"
                  : "Создать индивидуальный план на неделю"}
            </button>
          </div>
        </div>
      )}

      {/* 🩺 МОДАЛКА WELLBEING */}
      {showWellbeingModal && (
        <div
          className="training-page__modal-overlay"
          onClick={() => setShowWellbeingModal(false)}>
          <div
            className="training-page__modal"
            onClick={(e) => e.stopPropagation()}>
            <h2 className="training-page__modal-title">
              Как самочувствие сегодня?
            </h2>
            <div className="training-page__modal-buttons">
              <button
                className={`training-page__modal-btn ${wellbeing === "BAD" ? "training-page__modal-btn--selected" : ""}`}
                onClick={() => handleWellbeingChange("BAD")}
                type="button">
                😷 Плохо
              </button>
              <button
                className={`training-page__modal-btn ${wellbeing === "NORMAL" ? "training-page__modal-btn--selected" : ""}`}
                onClick={() => handleWellbeingChange("NORMAL")}
                type="button">
                🙂 Нормально
              </button>
              <button
                className={`training-page__modal-btn ${wellbeing === "GOOD" ? "training-page__modal-btn--selected" : ""}`}
                onClick={() => handleWellbeingChange("GOOD")}
                type="button">
                💪 Отлично
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⚠️ ПОДТВЕРЖДЕНИЕ BAD/GOOD */}
      {showWellbeingWarning && (
        <div
          className="training-page__warning-overlay"
          onClick={() => {
            setShowWellbeingWarning(false);
            setWellbeingWarningAction(null);
          }}>
          <div
            className="training-page__warning-modal"
            onClick={(e) => e.stopPropagation()}>
            <p className="training-page__warning-text">
              {wellbeingWarningAction === "GOOD"
                ? "План станет сложнее?"
                : "План станет проще?"}
            </p>
            <button
              className="training-page__warning-btn"
              onClick={confirmWellbeingChange}>
              Да
            </button>
            <button
              className="training-page__warning-btn"
              onClick={() => {
                setShowWellbeingWarning(false);
                setWellbeingWarningAction(null);
              }}>
              Нет
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
