// hooks/useTrainingExecution.ts
import { useState, useEffect, useCallback } from "react";
import { useError } from "./useError";
import { useTrainingPlan } from "./useTrainingPlan";
import type {
  CreateTrainingDayExecution,
  CreateTrainingExerciseExecution,
  TrainingDayExecution,
  TrainingExerciseExecution,
} from "../api/types";
import { trainingExecutionApi } from "../api";

interface UseTrainingExecutionReturn {
  dayExecution: TrainingDayExecution | null;
  weekExecutions: TrainingDayExecution[];
  loadingDay: boolean;
  savingDay: boolean;

  exerciseExecutions: TrainingExerciseExecution[];
  loadingExercises: boolean;
  savingExercises: boolean;

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
  const { setError, clearError } = useError();
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

  // Загрузить выполнение дня по неделе и дню
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
      } catch (error) {
        if (error instanceof Error && error.message.includes("404")) {
          setDayExecution(null);
        } else {
          setError("network", "Не удалось загрузить выполнение дня");
          setDayExecution(null);
        }
      } finally {
        setLoadingDay(false);
      }
    },
    [clearError, setError],
  );

  // Загрузить все выполнения за неделю
  const loadWeekExecutions = useCallback(
    async (week: number) => {
      setLoadingDay(true);
      clearError();

      try {
        const data = await trainingExecutionApi.getDaysByWeek(week);
        setWeekExecutions(data);
      } catch {
        setError("network", "Не удалось загрузить выполнения недели");
      } finally {
        setLoadingDay(false);
      }
    },
    [clearError, setError],
  );

  // Начать тренировку
  const startTraining = useCallback(
    async (data: CreateTrainingDayExecution): Promise<TrainingDayExecution> => {
      setSavingDay(true);
      clearError();

      try {
        const result = await trainingExecutionApi.startTraining(data);
        setDayExecution(result);
        return result;
      } catch (error) {
        setError("network", "Не удалось начать тренировку");
        throw error;
      } finally {
        setSavingDay(false);
      }
    },
    [clearError, setError],
  );

  // Завершить тренировку
  const finishTraining = useCallback(
    async (id: string): Promise<TrainingDayExecution> => {
      setSavingDay(true);
      clearError();

      try {
        const result = await trainingExecutionApi.finishTraining(id);
        setDayExecution(result);
        return result;
      } catch (error) {
        setError("network", "Не удалось завершить тренировку");
        throw error;
      } finally {
        setSavingDay(false);
      }
    },
    [clearError, setError],
  );

  // Загрузить упражнения дня
  const loadExercisesByDay = useCallback(
    async (executionId: string) => {
      if (!executionId) return;

      setLoadingExercises(true);
      clearError();

      try {
        const data = await trainingExecutionApi.getExercisesByDay(executionId);
        setExerciseExecutions(data);
      } catch {
        setError("network", "Не удалось загрузить упражнения");
      } finally {
        setLoadingExercises(false);
      }
    },
    [clearError, setError],
  );

  // Добавить упражнения (одно или массив)
  const addExercises = useCallback(
    async (
      data: CreateTrainingExerciseExecution | CreateTrainingExerciseExecution[],
    ) => {
      setSavingExercises(true);
      clearError();

      try {
        const results = await trainingExecutionApi.addExercises(data);
        setExerciseExecutions((prev) => [...prev, ...results]);
      } catch (error) {
        setError("network", "Не удалось сохранить упражнения");
        throw error;
      } finally {
        setSavingExercises(false);
      }
    },
    [clearError, setError],
  );

  // Обновить заметки дня
  const updateDayExecution = useCallback(
    async (id: string, data: { notes?: string | null }) => {
      setSavingDay(true);
      clearError();

      try {
        const result = await trainingExecutionApi.updateDay(id, data);
        setDayExecution(result);
        return result;
      } catch (error) {
        setError("network", "Не удалось обновить день тренировки");
        throw error;
      } finally {
        setSavingDay(false);
      }
    },
    [clearError, setError],
  );

  // Перезагрузить все данные
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

  // Первичная загрузка
  useEffect(() => {
    loadDayExecution(currentWeek, initialDayIndex);
    loadWeekExecutions(currentWeek);
  }, [currentWeek, initialDayIndex, loadDayExecution, loadWeekExecutions]);

  // Загрузка упражнений при изменении дня
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
