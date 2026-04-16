import { ApiResponse } from "./common.types";
import {
  MuscleGroup,
  Difficulty,
  TrainingFocus,
} from "../../common/types/enums.types";
import { MovementPattern, PrimaryMuscleGroup } from "@prisma/client";

export interface ExerciseResponseDto {
  id: string;
  name: string;
  description: string;
  primaryMuscleGroup: PrimaryMuscleGroup;
  secondaryMuscles: MuscleGroup[];
  movementPatterns: MovementPattern[];
  trainingFocus: TrainingFocus[];
  difficulty: Difficulty;
  imageUrl: string | null;
  videoUrl: string | null;
}

export interface ExerciseListResponseDto {
  data: ExerciseResponseDto[];
  total: number;
}

export type ExerciseListResponse = ApiResponse<ExerciseListResponseDto>;
