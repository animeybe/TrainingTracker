import {
  MuscleGroup,
  ExerciseType,
  Difficulty,
} from "../../common/types/enums.types";

const VALID_MUSCLE_GROUPS = [
  "NECK",
  "TRAPEZIUS_UPPER",
  "TRAPEZIUS_LOWER",
  "DELTOIDS_ANTERIOR",
  "DELTOIDS_MEDIAL",
  "DELTOIDS_POSTERIOR",
  "CHEST_UPPER",
  "CHEST_MIDDLE",
  "CHEST_LOWER",
  "LATS",
  "RHOMBOIDS_UPPER",
  "RHOMBOIDS_LOWER",
  "TERES_MAJOR",
  "TERES_MINOR",
  "ERECTOR_SPINAE_UPPER",
  "ERECTOR_SPINAE_LOWER",
  "BICEPS_LONG_HEAD",
  "BICEPS_SHORT_HEAD",
  "TRICEPS_LONG_HEAD",
  "TRICEPS_MEDIAL_HEAD",
  "TRICEPS_LATERAL_HEAD",
  "FOREARMS_FLEXORS",
  "FOREARMS_EXTENSORS",
  "ABS_UPPER",
  "ABS_LOWER",
  "OBLIQUES",
  "GLUTES_MAXIMUS",
  "GLUTES_MEDIAS",
  "ABDUCTORS",
  "ADDUCTORS",
  "QUADS_VASTUS_LATERALIS",
  "QUADS_VASTUS_MEDIALIS",
  "QUADS_RECTUS_FEMORIS",
  "HAMSTRINGS",
  "CALVES_GASTROCNEMIUS",
  "CALVES_SOLEUS",
] as const;

const VALID_EXERCISE_TYPES = ["PUSH", "PULL", "LEGS", "OTHERS"] as const;
const VALID_DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;

export interface ExercisePrismaDto {
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

export function isExercisePrismaDto(obj: unknown): obj is ExercisePrismaDto {
  const dto = obj as Record<string, unknown>;

  return (
    // Базовые проверки
    typeof dto.id === "string" &&
    dto.id.length > 0 &&
    typeof dto.name === "string" &&
    dto.name.length > 0 &&
    (typeof dto.description === "string" || dto.description === null) &&
    // MuscleGroup валидация
    typeof dto.muscleGroup === "string" &&
    VALID_MUSCLE_GROUPS.includes(dto.muscleGroup as any) &&
    // secondaryMuscles массив валидных MuscleGroup
    Array.isArray(dto.secondaryMuscles) &&
    dto.secondaryMuscles.every(
      (m: unknown) =>
        typeof m === "string" && VALID_MUSCLE_GROUPS.includes(m as any),
    ) &&
    // ExerciseType валидация
    typeof dto.type === "string" &&
    VALID_EXERCISE_TYPES.includes(dto.type as any) &&
    // Difficulty валидация
    typeof dto.difficulty === "string" &&
    VALID_DIFFICULTIES.includes(dto.difficulty as any) &&
    // URLs
    (typeof dto.imageUrl === "string" || dto.imageUrl === null) &&
    (typeof dto.videoUrl === "string" || dto.videoUrl === null)
  );
}
