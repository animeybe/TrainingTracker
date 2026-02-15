import { Lifestyle, Goal } from "@prisma/client";

export interface UserProfileDto {
  readonly id: string;
  readonly userId: string;
  readonly weight: number | null;
  readonly height: number | null;
  readonly age: number | null;
  readonly lifestyle: Lifestyle | null;
  readonly goal: Goal | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export function isUserProfileDto(obj: unknown): obj is UserProfileDto {
  const dto = obj as Record<string, unknown>;
  return (
    typeof dto.id === "string" &&
    typeof dto.userId === "string" &&
    (typeof dto.weight === "number" || dto.weight === null) &&
    (typeof dto.height === "number" || dto.height === null) &&
    (typeof dto.age === "number" || dto.age === null) &&
    (typeof dto.lifestyle === "string" || dto.lifestyle === null) &&
    (typeof dto.goal === "string" || dto.goal === null) &&
    dto.createdAt instanceof Date &&
    dto.updatedAt instanceof Date
  );
}
