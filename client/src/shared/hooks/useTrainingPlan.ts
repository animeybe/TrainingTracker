import { useState, useEffect, useCallback, useMemo } from "react";
import { planApi, exerciseApi } from "@/shared/api";
import { useProfile } from "@/shared/hooks/useProfile";
import type {
  WeekPlanResponse,
  TodayPlanResponse,
  Exercise,
  Wellbeing,
} from "@/shared/api/types";
import { logger } from "@/lib/utils/logger";
import {
  getUserIdFromToken,
  checkProfileCompleteness,
  getTodayString,
  getDayTypeRu,
} from "../../lib/utils";

interface UseTrainingPlanReturn {
  weekPlan: WeekPlanResponse | null;
  todayPlan: TodayPlanResponse | null;
  exercises: Exercise[];
  today: { dayIndex: number; dayOfWeek: string };
  currentWeek: number;
  wellbeing: Wellbeing;

  loadingPlan: boolean;
  loadingTodayPlan: boolean;
  isProfileIncomplete: boolean;

  generatePlan: () => Promise<void>;
  loadTodayPlan: (wellbeing: Wellbeing) => Promise<void>;
  setWellbeing: (wellbeing: Wellbeing) => void;
  selectDay: (dayIndex: number) => void;

  showWellbeingModal: boolean;
  showWellbeingWarning: boolean;
  wellbeingWarningAction: Wellbeing | null;

  handleWellbeingChange: (wellbeing: Wellbeing) => void;
  confirmWellbeingChange: () => void;

  openWellbeingModal: () => void;
}

export const useTrainingPlan = (
  initialWeek: number = 1,
): UseTrainingPlanReturn => {
  const userId = getUserIdFromToken();
  const { profile } = useProfile();

  const [weekPlan, setWeekPlan] = useState<WeekPlanResponse | null>(null);
  const [todayPlan, setTodayPlan] = useState<TodayPlanResponse | null>(null);
  const [currentWeek] = useState(initialWeek);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingTodayPlan, setLoadingTodayPlan] = useState(false);
  const [wellbeing, setWellbeing] = useState<Wellbeing>("NORMAL");
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(true);
  const [showWellbeingModal, setShowWellbeingModal] = useState(false);
  const [showWellbeingWarning, setShowWellbeingWarning] = useState(false);
  const [wellbeingWarningAction, setWellbeingWarningAction] =
    useState<Wellbeing | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  // ==================== COMPUTED ====================
  const today = useMemo(() => {
    const date = new Date();
    const jsDay = date.getDay();
    const backendDayIndex = jsDay === 0 ? 6 : jsDay - 1;
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

  // ==================== API ====================
  const loadExercises = useCallback(async () => {
    if (exercises.length > 0) return;
    try {
      const response = await exerciseApi.getAllExercises();
      setExercises(Array.isArray(response) ? response : (response?.data ?? []));
    } catch (error: unknown) {
      logger.error("loadExercises failed", error as Error);
    }
  }, [exercises.length]);

  const loadTodayPlan = useCallback(
    async (currentWellbeing: Wellbeing) => {
      if (checkProfileCompleteness(profile)) return;

      setLoadingTodayPlan(true);
      try {
        const response = await planApi.getTodayAdjusted(currentWellbeing);
        setTodayPlan(response);
      } catch (error: unknown) {
        if (error instanceof Error && error.message?.includes("400")) {
          setTodayPlan(null);
          return;
        }
        logger.error("loadTodayPlan failed", error as Error);
      } finally {
        setLoadingTodayPlan(false);
      }
    },
    [profile],
  );

  const generatePlan = useCallback(async () => {
    if (!userId || checkProfileCompleteness(profile) || loadingPlan) return;

    setLoadingPlan(true);
    try {
      const response = await planApi.generatePlan({
        split: { name: "PPL" as const, days: [] },
        wellbeing,
        week: currentWeek,
      });
      setWeekPlan(response);
      await loadTodayPlan(wellbeing);
    } catch (error: unknown) {
      logger.error("generatePlan failed", error as Error);
    } finally {
      setLoadingPlan(false);
    }
  }, [userId, profile, loadingPlan, wellbeing, currentWeek, loadTodayPlan]);

  // ==================== WELLBEING ====================
  const setStoredWellbeingToday = useCallback((w: Wellbeing) => {
    const today = getTodayString();
    const stored = JSON.parse(localStorage.getItem("wellbeingHistory") || "{}");
    stored[today] = w;
    localStorage.setItem("wellbeingHistory", JSON.stringify(stored));
  }, []);

  const getStoredWellbeingToday = useCallback((): Wellbeing | null => {
    const stored = JSON.parse(localStorage.getItem("wellbeingHistory") || "{}");
    return stored[getTodayString()] ?? null;
  }, []);

  const handleWellbeingChange = useCallback((w: Wellbeing) => {
    if (w === "BAD" || w === "GOOD") {
      setWellbeingWarningAction(w);
      setShowWellbeingWarning(true);
    } else {
      handleWellbeingSubmit(w);
    }
  }, []);

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

  const confirmWellbeingChange = useCallback(() => {
    if (wellbeingWarningAction) handleWellbeingSubmit(wellbeingWarningAction);
  }, [wellbeingWarningAction, handleWellbeingSubmit]);

  const selectDay = useCallback(
    (dayIndex: number) => {
      if (!weekPlan?.trainingDays) return;
      const dayPlan = weekPlan.trainingDays.find(
        (day) => day.dayOfWeek === dayIndex,
      );
      setTodayPlan({
        today: dayPlan || {
          dayIndex,
          dayOfWeek: dayIndex,
          dayType: "rest" as const,
          exercises: [],
          coverage: 0,
          estimatedDuration: 0,
          warnings: [],
        },
        wellbeingAdjusted: false,
        message: dayPlan ? `День ${dayIndex + 1}` : "Отдых",
      });
    },
    [weekPlan],
  );

  // ==================== INITIAL LOAD ====================
  const loadInitialData = useCallback(async () => {
    if (!userId) return;

    await Promise.allSettled([loadExercises()]);

    try {
      const plan = await planApi.getPlan(userId, currentWeek);
      setWeekPlan(plan);
      const todayDayPlan = plan.trainingDays?.find(
        (day) => day.dayOfWeek === today.dayIndex,
      );
      if (todayDayPlan) {
        setTodayPlan({
          today: todayDayPlan,
          wellbeingAdjusted: false,
          message: `Сегодня: ${getDayTypeRu(todayDayPlan.dayType)}`,
        });
      }
    } catch {
      setWeekPlan(null);
    }

    const todayWellbeing = getStoredWellbeingToday();
    if (todayWellbeing) {
      setWellbeing(todayWellbeing);
    } else {
      setShowWellbeingModal(true);
    }

    setIsProfileIncomplete(checkProfileCompleteness(profile));
  }, [
    userId,
    currentWeek,
    today.dayIndex,
    loadExercises,
    profile,
    getStoredWellbeingToday,
  ]);

  useEffect(() => {
    loadInitialData();
  }, [userId, loadInitialData]);

  useEffect(() => {
    setIsProfileIncomplete(checkProfileCompleteness(profile));
  }, [profile]);

  // ==================== ACTION ====================
  const openWellbeingModal = useCallback(() => {
    setShowWellbeingModal(true);
  }, []);

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
    loadTodayPlan,
    setWellbeing,
    selectDay,
    showWellbeingModal,
    showWellbeingWarning,
    wellbeingWarningAction,
    handleWellbeingChange,
    confirmWellbeingChange,
    openWellbeingModal,
  };
};
