// hooks/useTrainingPlan.ts
/**
 * useTrainingPlan — центральный хук управления тренировочным планом.
 *
 * Отвечает за:
 *   - Загрузку недельного плана (API → state + localStorage)
 *   - Генерацию нового плана
 *   - Удаление плана (с очисткой SW cache + localStorage)
 *   - Переключение дней (selectDay, setTodayPlanDirectly)
 *   - Wellbeing (самочувствие) с модалкой
 *   - Офлайн-режим: при недоступности API план берётся из localStorage
 *
 * Кэширование:
 *   - localStorage: plan_{userId}_{week} (до 7 дней)
 *   - Service Worker: api-cache (StaleWhileRevalidate для GET /api/plan/*)
 *
 * Важно: deleteSwCache НЕ используется при обычной загрузке —
 *         это позволяет SW отдавать план офлайн. Очистка кэша SW
 *         происходит только при deletePlan.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { planApi } from "@/shared/api/planApi";
import { exerciseApi } from "@/shared/api/exerciseApi";
import { userStateApi } from "@/shared/api/userStateApi";
import { useProfile } from "@/shared/hooks/useProfile";
import { logger } from "@/lib/utils/logger";
import {
  getUserIdFromToken,
  checkProfileInCompleteness,
  getTodayString,
  getDayTypeRu,
} from "@/lib/utils";
import type {
  Exercise,
  TodayPlanResponse,
  WeekPlan,
  Wellbeing,
  TrainingDay,
} from "../api/types";

// ═══════════════════════════════════════════════════════════════
// ТИПЫ
// ═══════════════════════════════════════════════════════════════

interface GeneratePlanParams {
  forcingNewWeek?: boolean;
  preferredSplit?: string;
}

interface UseTrainingPlanReturn {
  weekPlan: WeekPlan | null;
  todayPlan: TodayPlanResponse | null;
  exercises: Exercise[];
  today: { dayIndex: number; dayOfWeek: string };
  currentWeek: number | null;
  wellbeing: Wellbeing;
  loadingPlan: boolean;
  loadingTodayPlan: boolean;
  isProfileIncomplete: boolean;
  generatePlan: (params?: GeneratePlanParams) => Promise<void>;
  refreshPlan: () => Promise<WeekPlan | null>;
  loadTodayPlan: (wellbeing: Wellbeing) => Promise<void>;
  setWellbeing: (wellbeing: Wellbeing) => void;
  selectDay: (dayIndex: number) => void;
  setTodayPlanDirectly: (day: TrainingDay | null | undefined) => void;
  showWellbeingModal: boolean;
  showWellbeingWarning: boolean;
  wellbeingWarningAction: Wellbeing | null;
  handleWellbeingChange: (wellbeing: Wellbeing) => void;
  confirmWellbeingChange: () => void;
  openWellbeingModal: () => void;
  maxWeek: number | null;
  isNextWeekPlanStale: boolean;
  dismissWellbeingWarning: () => void;
  loadPlanFromCacheOnly: (week: number) => WeekPlan | null;
  deletePlan: () => Promise<void>;
}

// ═══════════════════════════════════════════════════════════════
// УТИЛИТЫ КЭШИРОВАНИЯ (localStorage)
// ═══════════════════════════════════════════════════════════════

/** Ключ для localStorage: plan_{userId}_{week} */
const getPlanCacheKey = (userId: string, week: number): string =>
  `plan_${userId}_${week}`;

/**
 * Сохранить план в localStorage с меткой времени.
 * Используется как офлайн-фолбек, когда SW-кэш недоступен.
 */
const savePlanToCache = (userId: string, plan: WeekPlan): void => {
  try {
    const cacheKey = getPlanCacheKey(userId, plan.week);
    localStorage.setItem(
      cacheKey,
      JSON.stringify({ data: plan, timestamp: Date.now(), week: plan.week }),
    );
  } catch (error) {
    console.error("Ошибка сохранения плана в кэш:", error);
  }
};

/**
 * Загрузить план из localStorage.
 * Возвращает null, если кэш отсутствует или устарел (>7 дней).
 */
const loadPlanFromCache = (
  userId: string,
  week: number,
  maxAgeDays: number = 7,
): WeekPlan | null => {
  try {
    const cacheKey = getPlanCacheKey(userId, week);
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const daysDiff = Math.floor((Date.now() - timestamp) / 86400000);

    if (daysDiff > maxAgeDays) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    return data;
  } catch {
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════
// ХУК
// ═══════════════════════════════════════════════════════════════

export const useTrainingPlan = (): UseTrainingPlanReturn => {
  const userId = getUserIdFromToken();
  const { profile } = useProfile();

  // ── Состояние ──────────────────────────────────────────
  const [weekPlan, setWeekPlan] = useState<WeekPlan | null>(null);
  const [todayPlan, setTodayPlan] = useState<TodayPlanResponse | null>(null);
  const [currentWeek, setCurrentWeek] = useState<number | null>(null);
  const [maxWeek, setMaxWeek] = useState<number | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingTodayPlan, setLoadingTodayPlan] = useState(false);
  const [wellbeing, setWellbeing] = useState<Wellbeing>("NORMAL");
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(true);
  const [showWellbeingModal, setShowWellbeingModal] = useState(false);
  const [showWellbeingWarning, setShowWellbeingWarning] = useState(false);
  const [wellbeingWarningAction, setWellbeingWarningAction] =
    useState<Wellbeing | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  // Защита от повторной инициализации (StrictMode)
  const initialLoadDone = useRef(false);

  // ── Сегодняшний день (мемоизирован) ────────────────────
  const today = useMemo(() => {
    const date = new Date();
    const jsDay = date.getDay(); // 0 = вс, 1 = пн, ...
    const backendDayIndex = jsDay === 0 ? 6 : jsDay - 1; // 0 = пн, 6 = вс
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

  const todayString = useMemo(() => getTodayString(), []);

  // ── Wellbeing: чтение/запись в localStorage ────────────
  const getStoredWellbeingToday = useCallback((): Wellbeing | null => {
    const stored = JSON.parse(localStorage.getItem("wellbeingHistory") || "{}");
    return stored[todayString] ?? null;
  }, [todayString]);

  const setStoredWellbeingToday = useCallback(
    (w: Wellbeing) => {
      const stored = JSON.parse(
        localStorage.getItem("wellbeingHistory") || "{}",
      );
      stored[todayString] = w;
      localStorage.setItem("wellbeingHistory", JSON.stringify(stored));
    },
    [todayString],
  );

  // ── Загрузка today-плана ───────────────────────────────
  const loadTodayPlan = useCallback(
    async (currentWellbeing: Wellbeing) => {
      if (!checkProfileInCompleteness(profile)) return;
      setLoadingTodayPlan(true);
      try {
        const response = await planApi.getTodayPlan(currentWellbeing);
        setTodayPlan(response);
      } catch (error: unknown) {
        if (error instanceof Error && error.message?.includes("400")) {
          setTodayPlan(null);
          return;
        }
        // 404 — план не найден, не ошибка
        if (error instanceof Error && !error.message.includes("404")) {
          logger.error("loadTodayPlan failed", error as Error);
        }
      } finally {
        setLoadingTodayPlan(false);
      }
    },
    [profile],
  );

  // ── Загрузка плана ТОЛЬКО из localStorage ──────────────
  const loadPlanFromCacheOnly = useCallback(
    (week: number): WeekPlan | null => {
      if (!userId) return null;
      const cachedPlan = loadPlanFromCache(userId, week);
      if (cachedPlan) {
        setWeekPlan(cachedPlan);
        return cachedPlan;
      }
      setWeekPlan(null);
      return null;
    },
    [userId],
  );

  // ── Прямая установка todayPlan (без API) ───────────────
  const setTodayPlanDirectly = useCallback(
    (day: TrainingDay | null | undefined) => {
      setTodayPlan({
        data: {
          today: day ?? null,
          wellbeingAdjusted: false,
          message: day ? `День: ${getDayTypeRu(day.dayType)}` : "День отдыха",
        },
      });
    },
    [],
  );

  // ═══════════════════════════════════════════════════════════
  // REFRESH — перезагрузка плана без генерации
  //
  // Используется после мутаций (toggle-day, add/remove exercise)
  // чтобы подтянуть актуальный план с сервера.
  // При офлайне — fallback на localStorage.
  // ═══════════════════════════════════════════════════════════
  const refreshPlan = useCallback(async () => {
    if (!userId || currentWeek == null) return null;

    try {
      // Небольшая задержка — даём серверу время сохранить изменения
      await new Promise((resolve) => setTimeout(resolve, 100));

      const response = await planApi.getPlan(userId, currentWeek);
      const plan = response as unknown as WeekPlan | null;

      if (plan) {
        // Нормализуем planId (сервер может вернуть в разных полях)
        plan.planId =
          plan.planId ||
          ((plan as unknown as Record<string, unknown>).planId as string);
        setWeekPlan(plan);
        savePlanToCache(userId, plan);
      }
      return plan;
    } catch (error) {
      if (error instanceof Error && error.message.includes("fetch")) {
        const cached = loadPlanFromCache(userId, currentWeek);
        if (cached) {
          setWeekPlan(cached);
          return cached;
        }
      }
      // 404 — план не найден, это не ошибка
      if (error instanceof Error && !error.message.includes("404")) {
        logger.error("refreshPlan failed", error as Error);
      }
      return null;
    }
  }, [userId, currentWeek]);

  // ═══════════════════════════════════════════════════════════
  // ГЛАВНАЯ ЗАГРУЗКА (useEffect при mount)
  //
  // Порядок:
  //   1. Упражнения (из API)
  //   2. userState → currentWeek
  //   3. maxWeek
  //   4. План на currentWeek (API → state + localStorage)
  //      При ошибке — fallback на localStorage
  //   5. Wellbeing из localStorage
  //
  // Важно: НЕ используем deleteSwCache здесь —
  //        это позволяет SW отдавать план офлайн.
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (!userId || initialLoadDone.current) return;
    initialLoadDone.current = true;

    (async () => {
      setLoadingPlan(true);

      // 1. Упражнения (не критично для плана, берём из localStorage при офлайне)
      try {
        const exResponse = await exerciseApi.getAllExercises();
        setExercises(
          Array.isArray(exResponse) ? exResponse : (exResponse?.data ?? []),
        );
      } catch {
        console.log(
          "📴 Упражнения не загрузились из API, пробуем localStorage",
        );
        try {
          const cached = localStorage.getItem("all_exercises_cache");
          if (cached) {
            const { data } = JSON.parse(cached);
            setExercises(data || []);
            console.log("📦 Упражнения загружены из localStorage");
          }
        } catch {
          console.log("📴 Упражнения не найдены в localStorage");
        }
      }

      // 2. Текущая неделя
      let week = 1;
      try {
        const userState = await userStateApi.getCurrentWeek();
        week = userState?.currentWeek ?? 1;
      } catch {
        week = 1;
      }
      setCurrentWeek(week);
      localStorage.setItem("currentWeek", String(week));

      // 3. maxWeek
      try {
        const maxData = await planApi.getMaxWeek();
        setMaxWeek(maxData.maxWeek);
      } catch {
        setMaxWeek(week);
      }

      // 4. План (критично — пробуем API, затем localStorage)
      try {
        const plan = (await planApi.getPlan(
          userId,
          week,
        )) as unknown as WeekPlan | null;
        if (plan) {
          plan.planId =
            plan.planId ||
            ((plan as unknown as Record<string, unknown>).planId as string);
          savePlanToCache(userId, plan);
          setWeekPlan(plan);
          if (plan?.trainingDays?.length) {
            const todayDayPlan = plan.trainingDays.find(
              (d) => d.dayOfWeek === today.dayIndex,
            );
            if (todayDayPlan) {
              setTodayPlan({
                data: {
                  today: todayDayPlan,
                  wellbeingAdjusted: false,
                  message: `Сегодня: ${getDayTypeRu(todayDayPlan.dayType)}`,
                },
              });
            }
          }
        } else {
          setWeekPlan(null);
        }
      } catch {
        console.log("📴 План не загрузился из API, пробуем localStorage");
        const cachedPlan = loadPlanFromCache(userId, week);
        if (cachedPlan) {
          cachedPlan.planId =
            cachedPlan.planId ||
            ((cachedPlan as unknown as Record<string, unknown>)
              .planId as string);
          setWeekPlan(cachedPlan);
          console.log("📦 План загружен из localStorage");
          if (cachedPlan?.trainingDays?.length) {
            const todayDayPlan = cachedPlan.trainingDays.find(
              (d) => d.dayOfWeek === today.dayIndex,
            );
            if (todayDayPlan) {
              setTodayPlan({
                data: {
                  today: todayDayPlan,
                  wellbeingAdjusted: false,
                  message: `Сегодня: ${getDayTypeRu(todayDayPlan.dayType)}`,
                },
              });
            }
          }
        } else {
          console.log("📴 План не найден ни в API, ни в localStorage");
          setWeekPlan(null);
        }
      }

      // 5. Wellbeing
      const stored = getStoredWellbeingToday();
      if (stored) setWellbeing(stored);
      else setShowWellbeingModal(true);

      setIsProfileIncomplete(!checkProfileInCompleteness(profile));
      setLoadingPlan(false);
    })();
  }, [userId]); // eslint-disable-line

  // ═══════════════════════════════════════════════════════════
  // WELLBEING — обработчики модалки
  // ═══════════════════════════════════════════════════════════

  const handleWellbeingSubmit = useCallback(
    async (newWellbeing: Wellbeing) => {
      setShowWellbeingModal(false);
      setWellbeing(newWellbeing);
      setStoredWellbeingToday(newWellbeing);
      setShowWellbeingWarning(false);
      setWellbeingWarningAction(null);
      await loadTodayPlan(newWellbeing);
    },
    [loadTodayPlan, setStoredWellbeingToday],
  );

  const handleWellbeingChange = useCallback(
    (w: Wellbeing) => {
      // GOOD и BAD требуют подтверждения (план изменится)
      if (w === "BAD" || w === "GOOD") {
        setWellbeingWarningAction(w);
        setShowWellbeingWarning(true);
      } else {
        handleWellbeingSubmit(w);
      }
    },
    [handleWellbeingSubmit],
  );

  const dismissWellbeingWarning = useCallback(() => {
    setShowWellbeingWarning(false);
    setWellbeingWarningAction(null);
  }, []);

  const confirmWellbeingChange = useCallback(() => {
    if (wellbeingWarningAction) handleWellbeingSubmit(wellbeingWarningAction);
  }, [wellbeingWarningAction, handleWellbeingSubmit]);

  // ── Выбор дня в календаре ──────────────────────────────
  const selectDay = useCallback(
    (dayIndex: number) => {
      if (!weekPlan?.trainingDays) return;
      const dayPlan = weekPlan.trainingDays.find(
        (d) => d.dayOfWeek === dayIndex,
      );
      setTodayPlan({
        data: {
          today: dayPlan ?? null,
          wellbeingAdjusted: false,
          message: dayPlan
            ? `День ${dayIndex + 1}: ${getDayTypeRu(dayPlan.dayType)}`
            : "День отдыха",
        },
      });
    },
    [weekPlan],
  );

  // ── Проверка «не пора ли обновить план» ────────────────
  const lastPlanDate = useMemo(() => {
    if (!weekPlan?.generatedAt) return null;
    const date = new Date(weekPlan.generatedAt);
    return isNaN(date.getTime()) ? null : date;
  }, [weekPlan]);

  const daysDiff = useMemo(() => {
    if (!lastPlanDate) return 0;
    return Math.floor((Date.now() - lastPlanDate.getTime()) / 86400000);
  }, [lastPlanDate]);

  const isNextWeekPlanStale = useMemo(() => daysDiff > 7, [daysDiff]);

  // ═══════════════════════════════════════════════════════════
  // GENERATE — создание нового плана
  //
  // Вызывает API generatePlan, сохраняет результат в state
  // и localStorage. Старый кэш localStorage очищается.
  // SW-кэш НЕ трогаем — он обновится сам через StaleWhileRevalidate.
  // ═══════════════════════════════════════════════════════════
  const generatePlan = useCallback(
    async (params?: GeneratePlanParams) => {
      const forcingNewWeek = params?.forcingNewWeek ?? false;
      const preferredSplit = params?.preferredSplit ?? "UPPER_LOWER";

      if (
        !userId ||
        !checkProfileInCompleteness(profile) ||
        loadingPlan ||
        currentWeek == null
      )
        return;

      setLoadingPlan(true);
      try {
        const response = await planApi.generatePlan({
          wellbeing,
          week: forcingNewWeek ? currentWeek + 1 : currentWeek,
          preferredSplit,
        });
        const plan = response as unknown as WeekPlan;

        // Очищаем старый localStorage-кэш планов
        if (userId) {
          Object.keys(localStorage).forEach((key) => {
            if (key.includes("plan_")) localStorage.removeItem(key);
          });
        }

        // Нормализуем planId
        plan.planId =
          plan.planId ||
          ((plan as unknown as Record<string, unknown>).planId as string);

        setWeekPlan(plan);
        savePlanToCache(userId, plan);
        setCurrentWeek(plan.week);
        localStorage.setItem("currentWeek", String(plan.week));
        setMaxWeek((prev) => Math.max(prev ?? 0, plan.week));

        // Если сегодня тренировочный день — показываем
        if (plan?.trainingDays?.length) {
          const todayDayPlan = plan.trainingDays.find(
            (d) => d.dayOfWeek === today.dayIndex,
          );
          if (todayDayPlan) {
            setTodayPlan({
              data: {
                today: todayDayPlan,
                wellbeingAdjusted: false,
                message: `Сегодня: ${getDayTypeRu(todayDayPlan.dayType)}`,
              },
            });
          }
        }

        if (forcingNewWeek) await userStateApi.updateCurrentWeek(plan.week);
      } catch (error: unknown) {
        logger.error("generatePlan failed", error as Error);
      } finally {
        setLoadingPlan(false);
      }
    },
    [userId, profile, loadingPlan, currentWeek, wellbeing, today.dayIndex],
  );

  // ═══════════════════════════════════════════════════════════
  // DELETE — полное удаление плана
  //
  // 1. Удаляет план на сервере (API)
  // 2. Очищает ВЕСЬ кэш SW, связанный с /api/plan/
  // 3. Очищает localStorage (plan, training, wellbeing)
  // 4. Сбрасывает состояние в null / week 1
  // 5. Сбрасывает initialLoadDone — при следующем заходе
  //    страница перезагрузит данные с сервера
  //
  // Офлайн: даже если API недоступен, локальные данные очищаются.
  // ═══════════════════════════════════════════════════════════
  const deletePlan = useCallback(async () => {
    try {
      await planApi.deletePlan();
    } catch (error) {
      logger.error("deletePlan API failed", error as Error);
      // Даже если API вернул ошибку — очищаем локальные данные
    } finally {
      // Очищаем кэш Service Worker для всех запросов плана
      if ("caches" in window) {
        try {
          const cache = await caches.open("api-cache");
          const keys = await cache.keys();
          for (const request of keys) {
            if (
              request.url.includes(`/api/plan/`) ||
              request.url.includes(`/api/plan?`)
            ) {
              await cache.delete(request);
              console.log("🗑 Удалён из кэша SW:", request.url);
            }
          }
        } catch (err) {
          console.error("Ошибка очистки кэша SW:", err);
        }
      }

      // Очищаем localStorage (офлайн-фолбек)
      if (userId) {
        Object.keys(localStorage).forEach((key) => {
          if (
            key.includes("plan_") ||
            key.includes("training") ||
            key.includes("wellbeing")
          ) {
            localStorage.removeItem(key);
          }
        });
      }

      // Сбрасываем состояние
      setWeekPlan(null);
      setTodayPlan(null);
      setCurrentWeek(1);
      localStorage.setItem("currentWeek", "1");
      initialLoadDone.current = false;
    }
  }, [userId]);

  const openWellbeingModal = useCallback(() => setShowWellbeingModal(true), []);

  // Следим за полнотой профиля
  useEffect(() => {
    setIsProfileIncomplete(!checkProfileInCompleteness(profile));
  }, [profile]);

  // ═══════════════════════════════════════════════════════════
  // ВОЗВРАТ
  // ═══════════════════════════════════════════════════════════

  return {
    weekPlan,
    todayPlan,
    exercises,
    today,
    currentWeek,
    wellbeing,
    loadingPlan,
    loadingTodayPlan,
    isProfileIncomplete,
    generatePlan,
    refreshPlan,
    loadTodayPlan,
    setWellbeing,
    selectDay,
    setTodayPlanDirectly,
    showWellbeingModal,
    showWellbeingWarning,
    wellbeingWarningAction,
    handleWellbeingChange,
    confirmWellbeingChange,
    openWellbeingModal,
    maxWeek,
    isNextWeekPlanStale,
    dismissWellbeingWarning,
    loadPlanFromCacheOnly,
    deletePlan,
  };
};
