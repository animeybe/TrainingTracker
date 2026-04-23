import { useState, useEffect, useCallback, useMemo } from "react";
import { planApi, exerciseApi, userStateApi } from "@/shared/api";
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
  WeekPlanResponse,
  Wellbeing,
} from "../api/types";

interface UseTrainingPlanReturn {
  weekPlan: WeekPlanResponse | null;
  todayPlan: TodayPlanResponse | null;
  exercises: Exercise[];
  today: { dayIndex: number; dayOfWeek: string };

  currentWeek: number | null;
  wellbeing: Wellbeing;

  loadingPlan: boolean;
  loadingTodayPlan: boolean;
  isProfileIncomplete: boolean;

  generatePlan: (params?: { forcingNewWeek?: boolean }) => Promise<void>;
  loadTodayPlan: (wellbeing: Wellbeing) => Promise<void>;
  setWellbeing: (wellbeing: Wellbeing) => void;
  selectDay: (dayIndex: number) => void;

  showWellbeingModal: boolean;
  showWellbeingWarning: boolean;
  wellbeingWarningAction: Wellbeing | null;

  handleWellbeingChange: (wellbeing: Wellbeing) => void;
  confirmWellbeingChange: () => void;
  openWellbeingModal: () => void;

  maxWeek: number | null;

  // без isMonday
  isNextWeekPlanStale: boolean;
}

export const useTrainingPlan = (): UseTrainingPlanReturn => {
  const userId = getUserIdFromToken();
  const { profile } = useProfile();

  const [weekPlan, setWeekPlan] = useState<WeekPlanResponse | null>(null);
  const [todayPlan, setTodayPlan] = useState<TodayPlanResponse | null>(null);
  const [currentWeek, _setCurrentWeek] = useState<number | null>(null);
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
      if (!checkProfileInCompleteness(profile)) return;

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

  const loadMaxWeek = useCallback(async () => {
    if (!userId) return;

    try {
      const { maxWeek } = await planApi.getMaxWeek();
      setMaxWeek(maxWeek);
    } catch (error) {
      logger.error("useTrainingPlan: failed to fetch maxWeek", error as Error);
      setMaxWeek(0);
    }
  }, [userId]);

  const loadUserState = useCallback(async () => {
    if (!userId) return;

    try {
      const userState = await userStateApi.getCurrentWeek();
      _setCurrentWeek(userState.currentWeek);
    } catch (error) {
      logger.error(
        "useTrainingPlan: failed to fetch userState",
        error as Error,
      );
      _setCurrentWeek(1);
    }
  }, [userId]);

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
          dayType: "rest",
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

  // ==================== LOADING USER STATE & PLAN ====================

  const loadInitialData = useCallback(async () => {
    if (!userId) return;

    await Promise.allSettled([loadExercises(), loadMaxWeek()]);

    try {
      const userState = await userStateApi.getCurrentWeek();
      _setCurrentWeek(userState.currentWeek ?? 1);
    } catch (error) {
      logger.error(
        "useTrainingPlan: failed to fetch userState.week",
        error as Error,
      );
      _setCurrentWeek(1);
    }

    if (currentWeek) {
      try {
        const plan = await planApi.getPlan(
          userId,
          Math.min(currentWeek, maxWeek ?? 1),
        );
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
      } catch (error) {
        logger.error("loadPlan failed", error as Error);
        setWeekPlan(null);
      }
    }

    const todayWellbeing = getStoredWellbeingToday();
    if (todayWellbeing) {
      setWellbeing(todayWellbeing);
    } else {
      setShowWellbeingModal(true);
    }

    setIsProfileIncomplete(!checkProfileInCompleteness(profile));
  }, [
    userId,
    currentWeek,
    maxWeek,
    today.dayIndex,
    loadExercises,
    profile,
    getStoredWellbeingToday,
    loadMaxWeek,
  ]);

  // ==================== LOGIKA: > 7 дней от generatedAt ====================

  // у тебя есть только generatedAt, нет createdAt
  const lastPlanDate = useMemo(() => {
    if (!weekPlan?.generatedAt) return null;
    const date = new Date(weekPlan.generatedAt);
    if (isNaN(date.getTime())) return null;
    return date;
  }, [weekPlan]);

  const now = useMemo(() => new Date(), []);

  const daysDiff = useMemo(() => {
    if (!lastPlanDate) return 0;
    const diffMs = now.getTime() - lastPlanDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [lastPlanDate, now]);

  // План устарел, если прошло более 7 дней от generatedAt
  const isNextWeekPlanStale = useMemo(() => {
    return daysDiff > 7;
  }, [daysDiff]);

  // ==================== GENERATE PLAN ====================

  const generatePlan = useCallback(
    async (params?: { forcingNewWeek?: boolean }) => {
      const forcingNewWeek = params?.forcingNewWeek ?? false;

      if (
        !userId ||
        !checkProfileInCompleteness(profile) ||
        loadingPlan ||
        currentWeek == null
      )
        return;

      setLoadingPlan(true);

      const weekToGenerate = forcingNewWeek ? currentWeek + 1 : currentWeek;

      try {
        const response = await planApi.generatePlan({
          split: { name: "PPL" as const, days: [] },
          wellbeing,
          week: weekToGenerate,
        });
        setWeekPlan(response);
        await loadTodayPlan(wellbeing);

        if (forcingNewWeek) {
          await userStateApi.updateCurrentWeek(response.week);
          _setCurrentWeek(response.week);

          if (maxWeek == null || maxWeek < response.week) {
            setMaxWeek(response.week);
          }
        }
      } catch (error: unknown) {
        logger.error("generatePlan failed", error as Error);
      } finally {
        setLoadingPlan(false);
      }
    },
    [
      userId,
      profile,
      loadingPlan,
      currentWeek,
      wellbeing,
      loadTodayPlan,
      maxWeek,
    ],
  );

  // ==================== WELLBEING MODAL HELPERS ====================

  const openWellbeingModal = useCallback(() => {
    setShowWellbeingModal(true);
    console.log("weekPlan", weekPlan);
    console.log("weekPlan.generatedAt", weekPlan?.generatedAt);
    console.log("daysDiff", daysDiff);
    console.log("isNextWeekPlanStale", isNextWeekPlanStale);
  }, []);

  // ==================== INITIAL LOAD ====================

  useEffect(() => {
    loadInitialData();
  }, [userId, loadInitialData]);

  useEffect(() => {
    setIsProfileIncomplete(!checkProfileInCompleteness(profile));
  }, [profile]);

  useEffect(() => {
    loadMaxWeek();
    loadUserState();
  }, [userId, loadMaxWeek, loadUserState]);

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
    maxWeek,
    isNextWeekPlanStale,
  };
};
