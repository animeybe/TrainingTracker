// types/profile.types.ts
import type { ApiResponse } from "./common.types";
import { Gender, Goal, Lifestyle } from "../../common/types/enums.types";

export interface ProfileUpdateRequestDto {
  weight?: number;
  height?: number;
  gender?: Gender;
  age?: number;
  lifestyle?: Lifestyle;
  goal?: Goal;
}

export interface ProfileResponseDto {
  id: string;
  userId: string;
  weight: number | null;
  height: number | null;
  gender: Gender | null;
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
