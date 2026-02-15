import { Lifestyle, Goal } from "@prisma/client";

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
  login: string;
  role: string;
  weight: number;
  height: number;
  age: number;
  lifestyle: Lifestyle | null;
  goal: Goal | null;
  bmi: number;
  bmiCategory: string;
}
