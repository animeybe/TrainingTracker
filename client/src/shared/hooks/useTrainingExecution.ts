// hooks/useTrainingExecution.ts
/**
 * useTrainingExecution — управление выполнением тренировки.
 *
 * Архитектура офлайн-режима:
 *   - Мутации (start, finish, addExercise, updateDay) → apiRequest
 *   - apiRequest сам сохраняет в IndexedDB очередь при офлайне
 *   - Хук НЕ дублирует addToQueue — только создаёт локальные объекты для UI
 *   - При онлайне: сначала processQueue, потом загрузка свежих данных
 */

import { useState, useEffect, useCallback } from "react";
import { useError } from "./useError";
import { useTrainingPlan } from "./useTrainingPlan";
import { ApiError } from "../api";
import type {
  CreateTrainingDayExecution,
  CreateTrainingExerciseExecution,
  TrainingDayExecution,
  TrainingExerciseExecution,
} from "../api/types";
import { trainingExecutionApi } from "../api";
import toast from "react-hot-toast";

interface UseTrainingExecutionReturn {
  dayExecution: TrainingDayExecution | null;
  weekExecutions: TrainingDayExecution[];
  loadingDay: boolean;
  savingDay: boolean;
  exerciseExecutions: TrainingExerciseExecution[];
  loadingExercises: boolean;
  savingExercises: boolean;
  serverResponded: boolean;
  loadDayExecution: (week: number, dayOfWeek: number) => Promise<void>;
  loadWeekExecutions: (week: number) => Promise<void>;
  startTraining: (
    data: CreateTrainingDayExecution,
  ) => Promise<TrainingDayExecution>;
  finishTraining: (id: string) => Promise<TrainingDayExecution>;
  loadExercisesByDay: (executionId: string) => Promise<void>;
  addExercises: (
    data: CreateTrainingExerciseExecution | CreateTrainingExerciseExecution[],
  ) => Promise<void>;
  updateDayExecution: (
    id: string,
    data: { notes?: string | null },
  ) => Promise<TrainingDayExecution>;
  refetchAll: () => Promise<void>;
}

export const useTrainingExecution = (
  initialDayIndex: number,
): UseTrainingExecutionReturn => {
  const { clearError } = useError();
  const { weekPlan } = useTrainingPlan();
  const [currentWeek, setCurrentWeek] = useState<number>(1);

  const [dayExecution, setDayExecution] = useState<TrainingDayExecution | null>(
    null,
  );
  const [weekExecutions, setWeekExecutions] = useState<TrainingDayExecution[]>(
    [],
  );
  const [exerciseExecutions, setExerciseExecutions] = useState<
    TrainingExerciseExecution[]
  >([]);

  const [loadingDay, setLoadingDay] = useState(false);
  const [savingDay, setSavingDay] = useState(false);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [savingExercises, setSavingExercises] = useState(false);
  const [serverResponded, setServerResponded] = useState(false);

  // ─── Загрузка выполнения дня ──────────────────────────
  const loadDayExecution = useCallback(
    async (week: number, dayOfWeek: number) => {
      setLoadingDay(true);
      clearError();
      try {
        const data = await trainingExecutionApi.getDayByWeekDay(
          week,
          dayOfWeek,
        );
        setDayExecution(data);
        setServerResponded(true);
      } catch (error) {
        setDayExecution(null);
        setExerciseExecutions([]);
        // ApiError с status > 0 — реальный ответ сервера (включая 404)
        // ApiError с status === 0 — сетевая ошибка (офлайн)
        setServerResponded(error instanceof ApiError && error.status > 0);
      } finally {
        setLoadingDay(false);
      }
    },
    [clearError],
  );

  // ─── Загрузка всех выполнений за неделю ───────────────
  const loadWeekExecutions = useCallback(
    async (week: number) => {
      setLoadingDay(true);
      clearError();
      try {
        const data = await trainingExecutionApi.getDaysByWeek(week);
        setWeekExecutions(data);
      } catch {
        // Офлайн — не критично
      } finally {
        setLoadingDay(false);
      }
    },
    [clearError],
  );

  // ─── Начать тренировку ────────────────────────────────
  const startTraining = useCallback(
    async (data: CreateTrainingDayExecution): Promise<TrainingDayExecution> => {
      setSavingDay(true);
      clearError();

      // Добавляем временный id для отслеживания в очереди
      const localId = `local-${Date.now()}`;
      const dataWithId = { ...data, tempId: localId };

      try {
        const result = await trainingExecutionApi.startTraining(dataWithId);
        setDayExecution(result);
        toast.success("🚀 Тренировка начата!");
        return result;
      } catch {
        const localExecution: TrainingDayExecution = {
          id: localId,
          userId: "",
          week: data.week,
          dayOfWeek: data.dayOfWeek,
          wellbeingToday: data.wellbeingToday || "NORMAL",
          startTime: new Date().toISOString(),
          endTime: null,
          notes: data.notes || null,
          createdAt: new Date().toISOString(),
        };
        setDayExecution(localExecution);
        toast.success("📴 Тренировка сохранена локально.", { duration: 4000 });
        return localExecution;
      } finally {
        setSavingDay(false);
      }
    },
    [clearError],
  );

  // ─── Завершить тренировку ─────────────────────────────
  const finishTraining = useCallback(
    async (id: string): Promise<TrainingDayExecution> => {
      setSavingDay(true);
      clearError();
      try {
        const result = await trainingExecutionApi.finishTraining(id);
        setDayExecution(result);
        toast.success("✅ Тренировка завершена!");
        return result;
      } catch {
        setDayExecution((prev) =>
          prev ? { ...prev, endTime: new Date().toISOString() } : prev,
        );
        toast.success("📴 Завершение тренировки сохранено.", {
          duration: 4000,
        });
        throw new Error("offline");
      } finally {
        setSavingDay(false);
      }
    },
    [clearError],
  );

  // ─── Загрузить упражнения дня ─────────────────────────
  const loadExercisesByDay = useCallback(
    async (executionId: string) => {
      if (!executionId) return;
      setLoadingExercises(true);
      clearError();
      try {
        const data = await trainingExecutionApi.getExercisesByDay(executionId);
        setExerciseExecutions(data);
      } catch {
        // Офлайн — упражнения будут восстановлены из localStorage
      } finally {
        setLoadingExercises(false);
      }
    },
    [clearError],
  );

  // ─── Добавить упражнения ──────────────────────────────
  const addExercises = useCallback(
    async (
      data: CreateTrainingExerciseExecution | CreateTrainingExerciseExecution[],
    ) => {
      setSavingExercises(true);
      clearError();

      try {
        const results = await trainingExecutionApi.addExercises(data);
        setExerciseExecutions((prev) => [...prev, ...results]);
        toast.success("✅ Упражнения сохранены!");
      } catch {
        toast.success(
          "📴 Упражнения сохранены локально. Синхронизируются при появлении сети.",
          { duration: 4000 },
        );
        throw new Error("offline");
      } finally {
        setSavingExercises(false);
      }
    },
    [clearError],
  );

  // ─── Обновить заметки дня ─────────────────────────────
  const updateDayExecution = useCallback(
    async (id: string, data: { notes?: string | null }) => {
      setSavingDay(true);
      clearError();

      try {
        const result = await trainingExecutionApi.updateDay(id, data);
        setDayExecution(result);
        return result;
      } catch {
        toast.success("📴 Заметки сохранены локально.", { duration: 3000 });
        throw new Error("offline");
      } finally {
        setSavingDay(false);
      }
    },
    [clearError],
  );

  // ─── Автообновление при появлении сети ────────────────
  useEffect(() => {
    const handleOnline = async () => {
      // Сначала синхронизируем офлайн-очередь
      try {
        const { processQueue } = await import("@/lib/offline/offlineQueue");
        await processQueue();
      } catch {
        /* очередь недоступна */
      }

      // Потом загружаем актуальные данные с сервера
      loadDayExecution(currentWeek, initialDayIndex);
      loadWeekExecutions(currentWeek);
    };

    const handleQueueProcessed = () => {
      setTimeout(() => {
        loadDayExecution(currentWeek, initialDayIndex);
        loadWeekExecutions(currentWeek);
      }, 500);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline-queue-processed", handleQueueProcessed);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener(
        "offline-queue-processed",
        handleQueueProcessed,
      );
    };
  }, [currentWeek, initialDayIndex, loadDayExecution, loadWeekExecutions]);

  const refetchAll = useCallback(async () => {
    if (dayExecution) {
      await loadDayExecution(dayExecution.week, dayExecution.dayOfWeek);
    }
    await loadWeekExecutions(currentWeek);
    if (dayExecution?.id) {
      await loadExercisesByDay(dayExecution.id);
    }
  }, [
    dayExecution,
    currentWeek,
    loadDayExecution,
    loadWeekExecutions,
    loadExercisesByDay,
  ]);

  // ─── Первичная загрузка ───────────────────────────────
  useEffect(() => {
    loadDayExecution(currentWeek, initialDayIndex);
    loadWeekExecutions(currentWeek);
  }, [currentWeek, initialDayIndex, loadDayExecution, loadWeekExecutions]);

  // ─── Загрузка упражнений при изменении dayExecution ───
  useEffect(() => {
    if (dayExecution?.id) {
      loadExercisesByDay(dayExecution.id);
    } else {
      setExerciseExecutions([]);
    }
  }, [dayExecution?.id, loadExercisesByDay]);

  useEffect(() => {
    if (weekPlan?.week) {
      setCurrentWeek(weekPlan.week);
    }
  }, [weekPlan?.week]);

  return {
    dayExecution,
    weekExecutions,
    exerciseExecutions,
    loadingDay,
    savingDay,
    loadingExercises,
    savingExercises,
    serverResponded,
    loadDayExecution,
    loadWeekExecutions,
    startTraining,
    finishTraining,
    loadExercisesByDay,
    addExercises,
    updateDayExecution,
    refetchAll,
  };
};
