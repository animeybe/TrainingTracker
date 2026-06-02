// api/planApi.ts
import { apiRequest } from "./index";
import type {
  RecommendSplitResponse,
  GeneratePlanRequest,
  WeekPlanResponse,
  TodayPlanResponse,
  GetUserPlansResponse,
} from "./types";

// Тип для ответа при добавлении упражнения
interface AddExerciseResponse {
  id: string;
  planId: string;
  exerciseId: string;
  dayOfWeek: number;
  orderInDay: number;
  sets: number;
  repsRange: [number, number];
}

export const planApi = {
  // POST /api/plan/recommend — рекомендовать сплит
  recommendSplit: (): Promise<{ data: RecommendSplitResponse }> =>
    apiRequest("/plan/recommend", { method: "POST" }),

  // POST /api/plan/generate — сгенерировать план
  generatePlan: (data?: GeneratePlanRequest): Promise<WeekPlanResponse> =>
    apiRequest("/plan/generate", {
      method: "POST",
      body: JSON.stringify(data || {}),
    }),

  // POST /api/plan/today — план на сегодня
  getTodayPlan: (
    wellbeing?: "BAD" | "NORMAL" | "GOOD",
  ): Promise<TodayPlanResponse> =>
    apiRequest("/plan/today", {
      method: "POST",
      body: JSON.stringify({ wellbeing: wellbeing || "NORMAL" }),
    }),

  // GET /api/plan/max-week — максимальная неделя
  getMaxWeek: (): Promise<{ maxWeek: number; currentWeek: number }> =>
    apiRequest("/plan/max-week"),

  // GET /api/plan/:userId/:week — план пользователя на неделю
  getPlan: (userId: string, week: number): Promise<WeekPlanResponse> =>
    apiRequest(`/plan/${userId}/${week}`),

  // POST /api/plan/user-plans — все планы пользователя
  getUserPlans: (): Promise<GetUserPlansResponse> =>
    apiRequest("/plan/user-plans", { method: "POST" }),

  // DELETE /api/plan — удалить план
  deletePlan: (): Promise<{ success: boolean }> =>
    apiRequest("/plan", { method: "DELETE" }),

  // POST /api/plan/exercises — добавить упражнение в план
  addExerciseToPlan: (data: {
    planId: string;
    exerciseId: string;
    dayOfWeek: number;
    sets: number;
    repsRange: [number, number];
    orderInDay?: number;
  }): Promise<AddExerciseResponse> =>
    apiRequest("/plan/exercises", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // DELETE /api/plan/exercises/:exerciseId — удалить упражнение из плана
  removeExerciseFromPlan: (
    exerciseId: string,
    planId: string,
    dayOfWeek: number,
  ): Promise<{ success: boolean }> =>
    apiRequest(
      `/plan/exercises/${exerciseId}?planId=${planId}&dayOfWeek=${dayOfWeek}`,
      {
        method: "DELETE",
      },
    ),

  // PUT /api/plan/toggle-day — сменить тип дня
  toggleDayType: (data: {
    week: number;
    dayOfWeek: number;
    dayType?: string;
  }): Promise<{ success: boolean; newType: string; message: string }> =>
    apiRequest("/plan/toggle-day", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};
