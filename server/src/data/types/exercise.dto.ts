import { MuscleGroup, Difficulty, ExerciseType } from '@prisma/client';

export interface ExerciseDto {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly muscleGroup: MuscleGroup;
  readonly secondaryMuscles: MuscleGroup[];
  readonly type: ExerciseType;
  readonly difficulty: Difficulty;
  readonly imageUrl: string | null;
  readonly videoUrl: string | null;
}

export function isExerciseDto(obj: unknown): obj is ExerciseDto {
  const dto = obj as Record<string, unknown>;
  return (
    typeof dto.id === 'string' &&
    typeof dto.name === 'string' &&
    (typeof dto.description === 'string' || dto.description === null) &&
    typeof dto.muscleGroup === 'string' &&
    Array.isArray(dto.secondaryMuscles) &&
    typeof dto.type === 'string' &&
    typeof dto.difficulty === 'string' &&
    (typeof dto.imageUrl === 'string' || dto.imageUrl === null) &&
    (typeof dto.videoUrl === 'string' || dto.videoUrl === null)
  );
}
