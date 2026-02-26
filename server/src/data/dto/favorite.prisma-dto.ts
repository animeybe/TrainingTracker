export interface FavoriteExercisePrismaDto {
  readonly id: string;
  readonly userId: string;
  readonly exerciseId: string;
  readonly createdAt: Date;
}

export function isFavoriteExercisePrismaDto(
  obj: unknown,
): obj is FavoriteExercisePrismaDto {
  const dto = obj as Record<string, unknown>;
  return (
    typeof dto.id === "string" &&
    typeof dto.userId === "string" &&
    typeof dto.exerciseId === "string" &&
    dto.createdAt instanceof Date &&
    !isNaN(dto.createdAt.getTime())
  );
}
