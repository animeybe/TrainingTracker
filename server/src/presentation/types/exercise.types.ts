import { MuscleGroup, ExerciseType, Difficulty } from "@prisma/client";

export interface ExerciseResponseDto {
  id: string;
  name: string;
  description: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  type: ExerciseType;
  difficulty: Difficulty;
  imageUrl: string | null;
  videoUrl: string | null;
}

export interface ExerciseListResponseDto {
  data: ExerciseResponseDto[];
  total: number;
}
