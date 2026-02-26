import {
  Goal,
  Lifestyle,
  MuscleGroup,
  ExerciseType,
  Difficulty,
} from "./enums.types";

export interface UserProfileDto {
  age?: number;
  weight?: number;
  height?: number;
  lifestyle?: Lifestyle;
  goal?: Goal;
}

export interface ExerciseDto {
  id: string;
  name: string;
  description?: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  type: ExerciseType;
  difficulty: Difficulty;
  imageUrl?: string;
  videoUrl?: string;
}

export interface FavoriteExerciseDto {
  id: string;
  userId: string;
  exerciseId: string;
  exercise: ExerciseDto;
}

export interface WeekPlanDto {
  week: number;
  split: string;
  score: number;
  daysPerWeek: number;
  days: Record<number, WorkoutDayDto | null>;
  wellbeing: string;
  wellbeingAdjusted?: boolean;
  message?: string;
}

export interface WorkoutDayDto {
  day: number;
  type: string;
  exercises: ExerciseSetDto[];
  progression?: {
    weekOffset: number;
    repIncrease: number;
  };
}

export interface ExerciseSetDto {
  exerciseId: string;
  sets: number;
  targetRepsRange: [number, number];
  favorite?: boolean;
  warning?: string;
  progression?: {
    baseSets: number;
    baseReps: [number, number];
  };
}
