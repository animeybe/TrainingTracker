// data/dtos/exercise.prisma-dto.ts
import type {
  TrainingFocus,
  Difficulty,
  MovementPattern,
  MuscleGroup,
  PrimaryMuscleGroup,
} from "../../common/types/enums.types";

export type ExerciseDto = {
  id: string;
  name: string;
  description: string | null;
  primaryMuscleGroup: PrimaryMuscleGroup;
  secondaryMuscles: MuscleGroup[];
  movementPatterns: MovementPattern[];
  trainingFocus: TrainingFocus[];
  difficulty: Difficulty;
  imageUrl: string | null;
  videoUrl: string | null;
};

export type CreateExerciseDto = {
  name: string;
  description: string | null;
  primaryMuscleGroup: PrimaryMuscleGroup;
  secondaryMuscles: MuscleGroup[];
  movementPatterns: MovementPattern[];
  trainingFocus: TrainingFocus[];
  difficulty: Difficulty;
  imageUrl: string | null;
  videoUrl: string | null;
};

export type UpdateExerciseDto = {
  name?: string;
  description?: string | null;
  primaryMuscleGroup?: PrimaryMuscleGroup;
  secondaryMuscles?: MuscleGroup[];
  movementPatterns?: MovementPattern[];
  trainingFocus?: TrainingFocus[];
  difficulty?: Difficulty;
  imageUrl?: string | null;
  videoUrl?: string | null;
};
