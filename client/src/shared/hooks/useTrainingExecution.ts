// hooks/useTrainingExecution.ts
import { useState, useEffect, useCallback } from "react";
import {
  type TrainingDayExecution,
  type TrainingExerciseExecution,
  type CreateTrainingDayExecution,
  type CreateTrainingExerciseExecution,
  trainingExecutionApi,
} from "@/shared/api/trainingExecutionApi";
import { useError } from "./useError";
import { useTrainingPlan } from "./useTrainingPlan";

function normalizeExecutionDate(date: Date): string {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay.toISOString();
}

interface UseTrainingExecutionReturn {
  // День тренировки
  dayExecution: TrainingDayExecution | null;
  weekExecutions: TrainingDayExecution[];
  loadingDay: boolean;
  savingDay: boolean;

  // Упражнения
  exerciseExecutions: TrainingExerciseExecution[];
  loadingExercises: boolean;
  savingExercises: boolean;

  // Actions
  loadDayExecution: (
    week: number,
    dayOfWeek: number,
    executionDate?: string,
  ) => Promise<void>;
  loadWeekExecutions: (week: number) => Promise<void>;
  saveDayExecution: (
    data: CreateTrainingDayExecution,
  ) => Promise<TrainingDayExecution>;
  loadExercisesByDay: (executionId: string) => Promise<void>;
  saveExerciseExecutions: (
    data: CreateTrainingExerciseExecution[],
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
  const currentWeek = weekPlan?.week ?? 1;

  // States
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

  // ==================== LOAD DAY EXECUTION ====================
  const loadDayExecution = useCallback(
    async (week: number, dayOfWeek: number, executionDate?: string) => {
      setLoadingDay(true);
      clearError();

      try {
        const isoDate = executionDate
          ? normalizeExecutionDate(new Date(executionDate))
          : normalizeExecutionDate(new Date());

        const response = await trainingExecutionApi.getDayByWeekDayDate({
          week,
          dayOfWeek,
          executionDate: isoDate,
        });
        setDayExecution(response);
      } catch (error) {
        console.error("❌ loadDayExecution ERROR:", error);
        if (error instanceof Error && error.message.includes("404")) {
          setDayExecution(null);
        } else {
          setError("network", "Не удалось загрузить выполнение дня тренировки");
          setDayExecution(null);
        }
      } finally {
        setLoadingDay(false);
      }
    },
    [clearError, setError],
  );

  // ==================== LOAD WEEK EXECUTIONS ====================
  const loadWeekExecutions = useCallback(
    async (week: number) => {
      console.log("🔥 loadWeekExecutions CALLED!", week);
      setLoadingDay(true);
      clearError();

      try {
        const response = await trainingExecutionApi.getDaysByWeek(week);
        console.log("✅ loadWeekExecutions SUCCESS", response.length);
        setWeekExecutions(response);
      } catch (error) {
        console.error("❌ loadWeekExecutions ERROR:", error);
        setError("network", "Не удалось загрузить выполнения недели");
      } finally {
        setLoadingDay(false);
      }
    },
    [clearError, setError],
  );

  // ==================== SAVE DAY EXECUTION ====================
  const saveDayExecution = useCallback(
    async (data: CreateTrainingDayExecution): Promise<TrainingDayExecution> => {
      setSavingDay(true);
      clearError();

      try {
        // Normalize executionDate before save
        const normalizedData = {
          ...data,
          executionDate: normalizeExecutionDate(new Date(data.executionDate)),
        };

        const result = await trainingExecutionApi.createDay(normalizedData);
        setDayExecution(result);
        return result;
      } catch (error) {
        console.error("❌ saveDayExecution ERROR:", error);
        setError("network", "Не удалось сохранить день тренировки");
        throw error;
      } finally {
        setSavingDay(false);
      }
    },
    [clearError, setError],
  );

  // ==================== LOAD EXERCISES BY DAY ====================
  const loadExercisesByDay = useCallback(
    async (executionId: string) => {
      if (!executionId) {
        console.log("⚠️ loadExercisesByDay: no executionId");
        return;
      }
      console.log("🔥 loadExercisesByDay CALLED!", executionId);
      setLoadingExercises(true);
      clearError();

      try {
        const response =
          await trainingExecutionApi.getExercisesByDay(executionId);
        console.log("✅ loadExercisesByDay SUCCESS", response.length);
        setExerciseExecutions(response);
      } catch (error) {
        console.error("❌ loadExercisesByDay ERROR:", error);
        setError("network", "Не удалось загрузить упражнения");
      } finally {
        setLoadingExercises(false);
      }
    },
    [clearError, setError],
  );

  // ==================== SAVE EXERCISES ====================
  const saveExerciseExecutions = useCallback(
    async (data: CreateTrainingExerciseExecution[]) => {
      console.log("🔥 saveExerciseExecutions CALLED!", data.length);
      setSavingExercises(true);
      clearError();

      try {
        const results = await trainingExecutionApi.createExercises(data);
        console.log("✅ saveExerciseExecutions SUCCESS", results.length);
        setExerciseExecutions((prev) => [...prev, ...results]);
      } catch (error) {
        console.error("❌ saveExerciseExecutions ERROR:", error);
        setError("network", "Не удалось сохранить упражнения");
        throw error;
      } finally {
        setSavingExercises(false);
      }
    },
    [clearError, setError],
  );

  // ==================== UPDATE DATE EXECUTION ====================
  const updateDayExecution = useCallback(
    async (id: string, data: { notes?: string | null }) => {
      setSavingDay(true);
      clearError();

      try {
        const response = await trainingExecutionApi.updateDay(id, data);
        setDayExecution(response);
        return response;
      } catch (error) {
        console.error("❌ updateDayExecution ERROR:", error);
        setError("network", "Не удалось обновить день тренировки");
        throw error;
      } finally {
        setSavingDay(false);
      }
    },
    [clearError, setError],
  );

  // ==================== REFETCH ALL ====================
  const refetchAll = useCallback(async () => {
    console.log("🔥 refetchAll CALLED!");
    if (dayExecution) {
      await loadDayExecution(
        dayExecution.week,
        dayExecution.dayOfWeek,
        dayExecution.executionDate,
      );
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

  // ==================== INITIAL LOAD ====================
  useEffect(() => {
    console.log("🚀 useTrainingExecution useEffect TRIGGERED!", {
      currentWeek,
      initialDayIndex,
    });
    loadDayExecution(currentWeek, initialDayIndex);
    loadWeekExecutions(currentWeek);
  }, [currentWeek, initialDayIndex, loadDayExecution, loadWeekExecutions]);

  // ==================== LOAD EXERCISES WHEN DAY CHANGES ====================
  useEffect(() => {
    console.log("🔄 dayExecution changed:", dayExecution?.id || "null");
    if (dayExecution?.id) {
      loadExercisesByDay(dayExecution.id);
    } else {
      setExerciseExecutions([]);
    }
  }, [dayExecution?.id, loadExercisesByDay]);

  return {
    // Data
    dayExecution,
    weekExecutions,
    exerciseExecutions,

    // Loading states
    loadingDay,
    savingDay,
    loadingExercises,
    savingExercises,

    // Actions
    loadDayExecution,
    loadWeekExecutions,
    saveDayExecution,
    loadExercisesByDay,
    saveExerciseExecutions,
    updateDayExecution,
    refetchAll,
  };
};
