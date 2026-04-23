// api/planApi.ts - ПОЛНЫЙ ФАЙЛ
import { apiRequest } from "./index";
import type {
  RecommendSplitResponse,
  GeneratePlanRequest,
  WeekPlanResponse,
  TodayPlanResponse,
  GetUserPlansRequest,
  GetUserPlansResponse,
} from "./types";

export const planApi = {
  recommendSplit: (data: {
    goal: "GAIN_MUSCLE" | "LOSE_FAT";
    experience: "NEWBIE" | "INTERMEDIATE" | "ADVANCED";
    daysPerWeek?: number;
  }): Promise<RecommendSplitResponse> =>
    apiRequest("/plan/recommend", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  generatePlan: (data: GeneratePlanRequest): Promise<WeekPlanResponse> =>
    apiRequest("/plan/generate", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getTodayAdjusted: (
    wellbeing: "BAD" | "NORMAL" | "GOOD",
  ): Promise<TodayPlanResponse> =>
    apiRequest("/plan/today", {
      method: "POST",
      body: JSON.stringify({ wellbeing }),
    }),

  getUserPlans: (data: GetUserPlansRequest): Promise<GetUserPlansResponse> =>
    apiRequest("/plan/user-plans", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getPlan: (userId: string, week: number): Promise<WeekPlanResponse> =>
    apiRequest(`/plan/${userId}/${week}`, {
      method: "GET",
    }),

  getMaxWeek(): Promise<{ maxWeek: number }> {
    return apiRequest("/plan/max-week", {
      method: "GET",
    });
  },
};
