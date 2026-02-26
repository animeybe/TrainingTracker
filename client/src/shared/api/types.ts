export type TrainingSplit = "PPL" | "FULL_BODY" | "UPPER_LOWER" | "BRO_SPLIT";
export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type ExerciseType = "PUSH" | "PULL" | "LEGS" | "OTHERS";
export type Goal =
  | "GAIN_MUSCLE_MASS"
  | "LOSE_WEIGHT"
  | "STRENGTH"
  | "ENDURANCE";
export type Lifestyle = "low" | "moderate" | "high" | "very_high";
export type Wellbeing = "bad" | "normal" | "good";

export interface ProfileData {
  id: string;
  userId: string;
  weight: number; // -1 = не заполнено
  height: number; // -1 = не заполнено
  age: number; // -1 = не заполнено
  lifestyle: string | null;
  goal: string | null;
  bmi: number | null;
  bmiCategory: string;
  isWeightSet: boolean;
  isHeightSet: boolean;
  isAgeSet: boolean;
  isLifestyleSet: boolean;
  isGoalSet: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  type: ExerciseType;
  difficulty: Difficulty;
  description?: string;
  secondaryMuscles?: string[];
}

export interface ExerciseListResponse {
  data: Exercise[];
  total: number;
}

export interface FavoriteItem extends Exercise {
  daysInFavorites: number;
}

export interface FavoritesResponse {
  data: Exercise[];
  total: number;
}

export type FavoriteListResponse = FavoritesResponse;
export interface ToggleFavoriteResponse {
  success: boolean;
  exerciseId: string;
}

export interface DayExercise {
  exerciseId: string;
  sets: number;
  targetRepsRange?: [number, number];
  favorite: boolean;
  progression: {
    baseSets: number;
    baseReps: [number, number];
    currentSets: number;
    weekOffset: number;
    wellbeingAdjusted: boolean;
  };
}

export interface WeekDay {
  day: number;
  type: string;
  exercises: DayExercise[];
}

export interface WeekPlanResponse {
  week: number;
  split: TrainingSplit;
  score: number;
  daysPerWeek: number;
  days: Record<number, WeekDay>;
  restDays: number[];
  wellbeing: Wellbeing;
  wellbeingAdjusted?: boolean;
  message?: string;
}
