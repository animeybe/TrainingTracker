import {
  MuscleGroup,
  TrainingSplit,
  Wellbeing,
} from "../../common/types/enums.types";
import {
  DayType,
  ExerciseSet,
  LocalWeekPlan,
} from "../../domain/types/training.types";
import { Goal, Lifestyle, Difficulty } from "../../common/types/enums.types";
import { TypedTrainingSplit } from "../../common/types/rec-sys.types.types";

export interface PlanResponseDto {
  week: number;
  split: TypedTrainingSplit;
  days: PlanDayResponseDto[];
  userData: {
    bmi: number;
    age: number;
    goal: Goal;
    lifestyle: Lifestyle;
    difficulty: Difficulty;
    estimated1RM: number;
    totalVolume: number;
  };
  progression: {
    weekOffset: number;
    wellbeingAdjusted: boolean;
  };
  generatedAt: string;
  wellbeing: Wellbeing;
}

export interface PlanDayResponseDto {
  dayType: DayType;
  dayIndex: number;
  exercises: ExerciseSet[];
  targetMuscles: MuscleGroup[];
  coverage: number;
  estimatedDuration: number;
  volumeLoad: number;
  warnings: string[];
}

export interface RecommendSplitRequestDto {
  goal: Goal;
  experience: "NEWBIE" | "INTERMEDIATE" | "ADVANCED";
  daysPerWeek?: number;
}

export interface RecommendSplitResponseDto {
  split: TrainingSplit;
  daysPerWeek: number;
  description: string;
  score: number;
  message: string;
}

export interface GeneratePlanRequestDto {
  split: TypedTrainingSplit;
  week?: number;
  wellbeing?: "BAD" | "NORMAL" | "GOOD";
}

export interface TodayPlanRequestDto {
  wellbeing?: "BAD" | "NORMAL" | "GOOD";
}

export interface TodayPlanResponseDto {
  today: PlanDayResponseDto | null;
  wellbeingAdjusted: boolean;
  message: string;
}

export type PlanResponse =
  | {
      data: LocalWeekPlan | null;
    }
  | {
      error: string;
    };

export type RecommendSplitResponse =
  | { data: RecommendSplitResponseDto }
  | { error: string };

export interface GetUserPlansRequestDto {
  userId: string;
}

export interface UserPlanSummaryDto {
  id: string;
  week: number;
  split: string;
  score: number;
  createdAt: string;
}

export interface GetUserPlansResponseDto {
  plans: UserPlanSummaryDto[];
}

export interface SaveUserPlanRequestDto {
  userId: string;
  plan: {
    week: number;
    split: TypedTrainingSplit;
    progression: { wellbeingAdjusted?: boolean };
  };
}

export type GetUserPlansResponse =
  | { data: GetUserPlansResponseDto }
  | { error: string };
export type SaveUserPlanResponse =
  | { success: boolean; message?: string }
  | { error: string };
