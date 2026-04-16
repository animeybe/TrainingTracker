// types/profile.types.ts
import type { Lifestyle, Goal } from "@prisma/client";
import type { ApiResponse } from "./common.types";

export interface ProfileUpdateRequestDto {
  weight?: number;
  height?: number;
  age?: number;
  lifestyle?: Lifestyle;
  goal?: Goal;
}

export interface ProfileResponseDto {
  id: string;
  userId: string;
  weight: number | null;
  height: number | null;
  age: number | null;
  lifestyle: Lifestyle | null;
  goal: Goal | null;
  bmi: number | null;
  bmiCategory: string | null;
  isWeightSet: boolean;
  isAgeSet: boolean;
  isHeightSet: boolean;
  isLifestyleSet: boolean;
  isGoalSet: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProfileResponse = ApiResponse<ProfileResponseDto>;
