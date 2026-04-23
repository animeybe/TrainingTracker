// shared/api/trainingExecutionApi.ts
import { apiRequest } from "./index";

export interface TrainingDayExecution {
  id: string;
  userId: string;
  week: number;
  dayOfWeek: number;
  executionDate: string;
  wellbeingToday: string;
  notes: string | null;
  createdAt: string;
}

export interface CreateTrainingExerciseExecution {
  executionId: string;
  exerciseId: string;
  sets: number;
  reps: number;
  orderInDay: number;
  notes?: string;
}

export interface TrainingExerciseExecution extends CreateTrainingExerciseExecution {
  id: string;
}

export interface CreateTrainingDayExecution {
  week: number;
  dayOfWeek: number;
  executionDate: string;
  wellbeingToday: string;
  notes?: string | null;
}

// Тип для query параметров GET /days
interface GetDayByWeekDayDateParams {
  week: number;
  dayOfWeek: number;
  executionDate: string;
}

export const trainingExecutionApi = {
  // День тренировки
  createDay: (
    data: CreateTrainingDayExecution,
  ): Promise<TrainingDayExecution> =>
    apiRequest("/training-executions/days", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateDay: (
    id: string,
    data: Partial<TrainingDayExecution>,
  ): Promise<TrainingDayExecution> =>
    apiRequest(`/training-executions/days/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // ✅ Query string строим вручную (строго типизировано)
  getDayByWeekDayDate: (
    params: GetDayByWeekDayDateParams,
  ): Promise<TrainingDayExecution> => {
    const query = new URLSearchParams({
      week: params.week.toString(),
      dayOfWeek: params.dayOfWeek.toString(),
      executionDate: params.executionDate,
    }).toString();

    return apiRequest(`/training-executions/days?${query}`);
  },

  getDaysByWeek: (week: number): Promise<TrainingDayExecution[]> =>
    apiRequest(`/training-executions/days/week/${week}`),

  // Упражнения
  createExercises: (
    data: CreateTrainingExerciseExecution[],
  ): Promise<TrainingExerciseExecution[]> =>
    apiRequest("/training-executions/exercises", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateExercise: (
    id: string,
    data: Partial<TrainingExerciseExecution>,
  ): Promise<TrainingExerciseExecution> =>
    apiRequest(`/training-executions/exercises/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  getExercisesByDay: (
    executionId: string,
  ): Promise<TrainingExerciseExecution[]> =>
    apiRequest(`/training-executions/exercises/day/${executionId}`),
};
