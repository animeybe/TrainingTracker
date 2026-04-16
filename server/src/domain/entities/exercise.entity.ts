// domain/entities/exercise.entity.ts
import type {
  TrainingFocus,
  Difficulty,
  MovementPattern,
  MuscleGroup,
  PrimaryMuscleGroup,
} from "../../common/types/enums.types";

export type ExerciseEntity = {
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

export type CreateExerciseEntity = {
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

export type UpdateExerciseEntity = {
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
