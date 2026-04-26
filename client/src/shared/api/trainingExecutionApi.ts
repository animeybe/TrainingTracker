// api/trainingExecutionApi.ts
import { apiRequest } from "./index";
import type {
  TrainingDayExecution,
  CreateTrainingDayExecution,
  TrainingExerciseExecution,
  CreateTrainingExerciseExecution,
} from "./types";

export const trainingExecutionApi = {
  // ═══════════════ ДНИ ТРЕНИРОВОК ═══════════════

  // POST /api/training-executions/days — начать тренировку
  startTraining: (
    data: CreateTrainingDayExecution,
  ): Promise<TrainingDayExecution> =>
    apiRequest("/training-executions/days", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // PUT /api/training-executions/days/:id/finish — завершить тренировку
  finishTraining: (id: string): Promise<TrainingDayExecution> =>
    apiRequest(`/training-executions/days/${id}/finish`, {
      method: "PUT",
    }),

  // PUT /api/training-executions/days/:id — обновить день
  updateDay: (
    id: string,
    data: Partial<CreateTrainingDayExecution>,
  ): Promise<TrainingDayExecution> =>
    apiRequest(`/training-executions/days/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // GET /api/training-executions/days/:id
  getDayById: (id: string): Promise<TrainingDayExecution> =>
    apiRequest(`/training-executions/days/${id}`),

  // GET /api/training-executions/days?week=&dayOfWeek=
  getDayByWeekDay: (
    week: number,
    dayOfWeek: number,
  ): Promise<TrainingDayExecution> => {
    const query = new URLSearchParams({
      week: String(week),
      dayOfWeek: String(dayOfWeek),
    });
    return apiRequest(`/training-executions/days?${query}`);
  },

  // GET /api/training-executions/days/week/:week
  getDaysByWeek: (week: number): Promise<TrainingDayExecution[]> =>
    apiRequest(`/training-executions/days/week/${week}`),

  // GET /api/training-executions/days/user — все дни пользователя
  getAllDays: (): Promise<TrainingDayExecution[]> =>
    apiRequest("/training-executions/days/user"),

  // ═══════════════ УПРАЖНЕНИЯ ═══════════════

  // POST /api/training-executions/exercises — добавить (одно или массив)
  addExercises: (
    data: CreateTrainingExerciseExecution | CreateTrainingExerciseExecution[],
  ): Promise<TrainingExerciseExecution[]> =>
    apiRequest("/training-executions/exercises", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // PUT /api/training-executions/exercises/:id
  updateExercise: (
    id: string,
    data: Partial<CreateTrainingExerciseExecution>,
  ): Promise<TrainingExerciseExecution> =>
    apiRequest(`/training-executions/exercises/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // GET /api/training-executions/exercises/:id
  getExerciseById: (id: string): Promise<TrainingExerciseExecution> =>
    apiRequest(`/training-executions/exercises/${id}`),

  // GET /api/training-executions/exercises/day/:executionId
  getExercisesByDay: (
    executionId: string,
  ): Promise<TrainingExerciseExecution[]> =>
    apiRequest(`/training-executions/exercises/day/${executionId}`),
};
