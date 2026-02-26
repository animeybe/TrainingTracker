import { apiRequest } from "./index";
import type { WeekPlanResponse, TrainingSplit, Wellbeing } from "./types";

export const planApi = {
  recommendSplit: (): Promise<{ split: TrainingSplit }> =>
    apiRequest("/plan/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }),

  generatePlan: (
    wellbeing: Wellbeing = "normal",
    week: number = 1,
    split?: TrainingSplit,
  ): Promise<WeekPlanResponse> =>
    apiRequest<WeekPlanResponse>("/plan/generate", {
      method: "POST",
      body: JSON.stringify({ wellbeing, week, split }),
    }),

  getTodayAdjusted: (
    wellbeing: Wellbeing,
  ): Promise<{
    message: string;
    wellbeing: Wellbeing;
    adjusted: boolean;
    multiplier: number;
    adjustedSets: number;
  }> =>
    apiRequest("/plan/today", {
      method: "POST",
      body: JSON.stringify({ wellbeing }),
    }),
};
