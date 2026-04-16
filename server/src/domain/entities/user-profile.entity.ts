// domain/entities/user-profile.entity.ts
import type { Lifestyle, Goal } from "../../common/types/enums.types";

export type UserProfileEntity = {
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

export type CreateUserProfileEntity = {
  userId: string;
  weight: number | null;
  height: number | null;
  age: number | null;
  lifestyle: Lifestyle | null;
  goal: Goal | null;
};

export type UpdateUserProfileEntity = Partial<
  Omit<UserProfileEntity, "id" | "userId" | "createdAt" | "updatedAt">
>;
