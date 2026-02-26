import { Lifestyle, Goal } from "../../common/types/enums.types";

const VALID_LIFESTYLES = ["IMMOBILE", "LIGHT", "AVERAGE", "HARD"] as const;
const VALID_GOALS = [
  "LOSE_WEIGHT",
  "MAINTAIN_WEIGHT",
  "GAIN_WEIGHT",
  "GAIN_MUSCLE_MASS",
] as const;

export interface UserProfilePrismaDto {
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

export function isUserProfilePrismaDto(
  obj: unknown,
): obj is UserProfilePrismaDto {
  const dto = obj as Record<string, unknown>;

  return (
    typeof dto.id === "string" &&
    typeof dto.userId === "string" &&
    (typeof dto.weight === "number" || dto.weight === null) &&
    (typeof dto.height === "number" || dto.height === null) &&
    (typeof dto.age === "number" || dto.age === null) &&
    // Lifestyle валидация
    (typeof dto.lifestyle === "string"
      ? VALID_LIFESTYLES.includes(dto.lifestyle as any)
      : dto.lifestyle === null) &&
    // Goal валидация
    (typeof dto.goal === "string"
      ? VALID_GOALS.includes(dto.goal as any)
      : dto.goal === null) &&
    // Dates
    dto.createdAt instanceof Date &&
    !isNaN(dto.createdAt.getTime()) &&
    dto.updatedAt instanceof Date &&
    !isNaN(dto.updatedAt.getTime())
  );
}
