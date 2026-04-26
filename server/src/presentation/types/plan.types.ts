// presentation/types/plan.types.ts
import { TrainingSplit, Wellbeing } from "../../common/types/enums.types";
import {
  LocalWeekPlan,
  LocalTrainingPlan,
} from "../../domain/types/training.types";

// ─── Запросы ────────────────────────────────────────

export interface RecommendSplitRequestDto {
  // Пустой — профиль из токена
}

export interface GeneratePlanRequestDto {
  week?: number;
  wellbeing?: Wellbeing;
}

export interface TodayPlanRequestDto {
  wellbeing?: Wellbeing;
}

export interface GetUserPlansRequestDto {
  userId: string;
}

export interface SaveUserPlanRequestDto {
  week: number;
  wellbeing?: Wellbeing;
}

// ─── Ответы ─────────────────────────────────────────

export interface RecommendSplitResponseDto {
  split: TrainingSplit;
  daysPerWeek: number;
  description: string;
  score: number;
  message: string;
}

export interface TodayPlanResponseDto {
  today: LocalTrainingPlan | null;
  wellbeingAdjusted: boolean;
  message: string;
}

export interface UserPlanSummaryDto {
  id: string;
  week: number;
  split: TrainingSplit;
  createdAt: string;
}

export interface GetUserPlansResponseDto {
  plans: UserPlanSummaryDto[];
}

// ─── Унифицированные ответы ─────────────────────────

export type PlanResponse = { data: LocalWeekPlan | null } | { error: string };

export type RecommendSplitResponse =
  | { data: RecommendSplitResponseDto }
  | { error: string };

export type TodayPlanResponse =
  | { data: TodayPlanResponseDto }
  | { error: string };

export type GetUserPlansResponse =
  | { data: GetUserPlansResponseDto }
  | { error: string };
