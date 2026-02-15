export interface FavoriteExerciseDto {
  readonly id: string;
  readonly userId: string;
  readonly exerciseId: string;
  readonly createdAt: Date;
}

export function isFavoriteExerciseDto(
  obj: unknown,
): obj is FavoriteExerciseDto {
  const dto = obj as Record<string, unknown>;
  return (
    typeof dto.id === "string" &&
    typeof dto.userId === "string" &&
    typeof dto.exerciseId === "string" &&
    dto.createdAt instanceof Date
  );
}
