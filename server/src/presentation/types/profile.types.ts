import { Lifestyle, Goal } from "@prisma/client";
import { ApiResponse } from "./common.types";

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
  weight: number;
  height: number;
  age: number;
  lifestyle: Lifestyle | null;
  goal: Goal | null;
  bmi: number | null;
  bmiCategory: string;
  isWeightSet: boolean;
  isHeightSet: boolean;
  isAgeSet: boolean;
  isLifestyleSet: boolean;
  isGoalSet: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProfileResponse = ApiResponse<ProfileResponseDto>;
