// data/dtos/user-profile.prisma-dto.ts
import type { Lifestyle, Goal } from "../../common/types/enums.types";

export type UserProfileDto = {
  id: string;
  userId: string;
  weight: number | null;
  height: number | null;
  age: number | null;
  lifestyle: Lifestyle | null;
  goal: Goal | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateUserProfileDto = {
  userId: string;
  weight: number | null;
  height: number | null;
  age: number | null;
  lifestyle: Lifestyle | null;
  goal: Goal | null;
};

export type UpdateUserProfileDto = {
  weight?: number | null;
  height?: number | null;
  age?: number | null;
  lifestyle?: Lifestyle | null;
  goal?: Goal | null;
};
