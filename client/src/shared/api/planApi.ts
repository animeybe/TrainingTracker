// api/planApi.ts
import { apiRequest } from "./index";
import type {
  RecommendSplitResponse,
  GeneratePlanRequest,
  WeekPlanResponse,
  TodayPlanResponse,
  GetUserPlansResponse,
} from "./types";

export const planApi = {
  // POST /api/plan/recommend — без параметров, профиль из токена
  recommendSplit: (): Promise<{ data: RecommendSplitResponse }> =>
    apiRequest("/plan/recommend", { method: "POST" }),

  // POST /api/plan/generate
  generatePlan: (data?: GeneratePlanRequest): Promise<WeekPlanResponse> =>
    apiRequest("/plan/generate", {
      method: "POST",
      body: JSON.stringify(data || {}),
    }),

  // POST /api/plan/today
  getTodayPlan: (
    wellbeing?: "BAD" | "NORMAL" | "GOOD",
  ): Promise<TodayPlanResponse> =>
    apiRequest("/plan/today", {
      method: "POST",
      body: JSON.stringify({ wellbeing: wellbeing || "NORMAL" }),
    }),

  // GET /api/plan/max-week
  getMaxWeek: (): Promise<{ maxWeek: number; currentWeek: number }> =>
    apiRequest("/plan/max-week"),

  // GET /api/plan/:userId/:week
  getPlan: (userId: string, week: number): Promise<WeekPlanResponse> =>
    apiRequest(`/plan/${userId}/${week}`),

  // POST /api/plan/user-plans — без параметров
  getUserPlans: (): Promise<GetUserPlansResponse> =>
    apiRequest("/plan/user-plans", { method: "POST" }),

  // DELETE /api/plan
  deletePlan: (): Promise<{ success: boolean }> =>
    apiRequest("/plan", { method: "DELETE" }),
};
