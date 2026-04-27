// hooks/useTrainingPlan.ts
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
} from "../api/types";

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
  isNextWeekPlanStale: boolean;
  dismissWellbeingWarning: () => void;
}

export const useTrainingPlan = (): UseTrainingPlanReturn => {
  const userId = getUserIdFromToken();
  const { profile } = useProfile();

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

  const initialLoadDone = useRef(false);

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

  const todayString = useMemo(() => getTodayString(), []);

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
        logger.error("loadTodayPlan failed", error as Error);
      } finally {
        setLoadingTodayPlan(false);
      }
    },
    [profile],
  );

  // ── Главная загрузка (ВСЕ запросы последовательно) ──
  useEffect(() => {
    if (!userId || initialLoadDone.current) return;
    initialLoadDone.current = true;

    (async () => {
      setLoadingPlan(true);
      try {
        // 1. Упражнения
        const exResponse = await exerciseApi.getAllExercises();
        setExercises(
          Array.isArray(exResponse) ? exResponse : (exResponse?.data ?? []),
        );

        // 2. userState
        let week = 1;
        try {
          const userState = await userStateApi.getCurrentWeek();
          week = userState?.currentWeek ?? 1;
          setCurrentWeek(week);
        } catch {
          setCurrentWeek(1);
        }

        // 3. maxWeek
        try {
          const maxData = await planApi.getMaxWeek();
          setMaxWeek(maxData.maxWeek);
        } catch {
          setMaxWeek(week);
        }

        // 4. План
        try {
          const plan = (await planApi.getPlan(
            userId,
            week,
          )) as unknown as WeekPlan | null;
          console.log(
            "✅ План загружен:",
            plan
              ? `week=${plan.week}, days=${plan.trainingDays?.length}`
              : "НЕТ",
          );
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
        } catch {
          setWeekPlan(null);
        }

        // 5. Wellbeing
        const stored = getStoredWellbeingToday();
        if (stored) setWellbeing(stored);
        else setShowWellbeingModal(true);

        setIsProfileIncomplete(!checkProfileInCompleteness(profile));
      } finally {
        setLoadingPlan(false);
      }
    })();
  }, [userId]); // eslint-disable-line

  // ── Wellbeing ────────────────────────────────────────
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

  // ── Проверка устаревания ────────────────────────────
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

  // ── Генерация плана ─────────────────────────────────
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
      try {
        const response = await planApi.generatePlan({
          wellbeing,
          week: forcingNewWeek ? currentWeek + 1 : currentWeek,
        });

        // apiRequest уже вернул data.data, поэтому response — это WeekPlan
        const plan = response as unknown as WeekPlan;

        setWeekPlan(plan);
        setCurrentWeek(plan.week);
        setMaxWeek((prev) => Math.max(prev ?? 0, plan.week));

        // Установи todayPlan из нового плана
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

        if (forcingNewWeek) {
          await userStateApi.updateCurrentWeek(plan.week);
        }
      } catch (error: unknown) {
        logger.error("generatePlan failed", error as Error);
      } finally {
        setLoadingPlan(false);
      }
    },
    [userId, profile, loadingPlan, currentWeek, wellbeing, today.dayIndex],
  );

  const openWellbeingModal = useCallback(() => setShowWellbeingModal(true), []);

  useEffect(() => {
    setIsProfileIncomplete(!checkProfileInCompleteness(profile));
  }, [profile]);

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
    dismissWellbeingWarning,
  };
};
