export type Wellbeing = "BAD" | "NORMAL" | "GOOD";
export type Goal =
  | "LOSE_FAT"
  | "MAINTAIN_WEIGHT"
  | "GAIN_MUSCLE_MASS"
  | "STRENGTH"
  | "HYPERTROPHY"
  | "ENDURANCE"
  | "POWER"
  | "HEALTH"
  | "REHABILITATION";

export type Lifestyle = "IMMOBILE" | "LIGHT" | "AVERAGE" | "HARD";

export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export type MovementPattern =
  | "PUSH"
  | "PULL"
  | "SQUAT"
  | "HINGE"
  | "CARRY"
  | "CORE_STABILITY"
  | "CORE_ROTATION"
  | "CARDIO"
  | "MOBILITY"
  | "ISOMETRIC";

export type TrainingFocus =
  | "STRENGTH"
  | "HYPERTROPHY"
  | "ENDURANCE"
  | "POWER"
  | "MAINTENANCE"
  | "REHABILITATION";

export type PrimaryMuscleGroup =
  | "LEGS"
  | "BACK"
  | "CHEST"
  | "SHOULDERS"
  | "ARMS"
  | "CORE";

export type MuscleGroup =
  | "NECK"
  | "TRAPEZIUS_UPPER"
  | "TRAPEZIUS_LOWER"
  | "DELTOIDS_ANTERIOR"
  | "DELTOIDS_MEDIAL"
  | "DELTOIDS_POSTERIOR"
  | "CHEST_UPPER"
  | "CHEST_MIDDLE"
  | "CHEST_LOWER"
  | "LATS"
  | "RHOMBOIDS_UPPER"
  | "RHOMBOIDS_LOWER"
  | "TERES_MAJOR"
  | "TERES_MINOR"
  | "ERECTOR_SPINAE_UPPER"
  | "ERECTOR_SPINAE_LOWER"
  | "BICEPS_LONG_HEAD"
  | "BICEPS_SHORT_HEAD"
  | "TRICEPS_LONG_HEAD"
  | "TRICEPS_MEDIAL_HEAD"
  | "TRICEPS_LATERAL_HEAD"
  | "FOREARMS_FLEXORS"
  | "FOREARMS_EXTENSORS"
  | "ABS_UPPER"
  | "ABS_LOWER"
  | "OBLIQUES"
  | "GLUTES_MAXIMUS"
  | "GLUTES_MEDIAS"
  | "ABDUCTORS"
  | "ADDUCTORS"
  | "QUADS_VASTUS_LATERALIS"
  | "QUADS_VASTUS_MEDIALIS"
  | "QUADS_RECTUS_FEMORIS"
  | "HAMSTRINGS"
  | "CALVES_GASTROCNEMIUS"
  | "CALVES_SOLEUS";

export type TrainingSplit =
  | "PPL"
  | "FULL_BODY"
  | "UPPER_LOWER"
  | "BRO_SPLIT"
  | "STRENGTH_FOCUS"
  | "HYPERTROPHY_FOCUS";

export interface TypedTrainingSplit {
  name: TrainingSplit;
  days: Array<{ type: string; frequency: number }>;
}

export type DayType =
  | "push"
  | "pull"
  | "legs"
  | "full"
  | "chest"
  | "back"
  | "shoulders"
  | "arms"
  | "upper"
  | "lower"
  | "core"
  | "rest";

export interface PlanDay {
  dayType: DayType;
  dayIndex: number;
  dayOfWeek: number;
  exercises: Array<{
    exerciseId: string;
    sets: number;
    targetRepsRange: [number, number];
    progression: {
      wellbeingAdjusted: boolean;
      currentSets: number;
    };
    warning?: string;
  }>;
  coverage: number;
  estimatedDuration: number;
  warnings?: string[];
}

export interface WeekPlanResponse {
  week: number;
  split: TypedTrainingSplit;
  days: PlanDay[];
  trainingDays: PlanDay[];
  userData: {
    bmi: number;
    age: number;
    goal: Goal;
    lifestyle: Lifestyle;
    difficulty: Difficulty;
    estimated1RM: number;
    totalVolume: number;
  };
  progression: {
    weekOffset: number;
    wellbeingAdjusted: boolean;
  };
  generatedAt: string;
}

export interface RecommendSplitResponse {
  split: TypedTrainingSplit;
  message: string;
}

export interface TodayPlanResponse {
  today: PlanDay | null;
  wellbeingAdjusted: boolean;
  message: string;
}

export interface GeneratePlanRequest {
  split: TypedTrainingSplit;
  week?: number;
  wellbeing?: Wellbeing;
}

export interface ProfileData {
  id: string;
  userId: string;
  weight: number | null;
  height: number | null;
  age: number | null;
  lifestyle: Lifestyle | null;
  goal: Goal | null;
  bmi: number | null;
  bmiCategory: string | null;
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
  description: string | null;
  primaryMuscleGroup: PrimaryMuscleGroup;
  secondaryMuscles: MuscleGroup[];
  movementPatterns: MovementPattern[];
  trainingFocus: TrainingFocus[];
  difficulty: Difficulty;
  imageUrl: string | null;
  videoUrl: string | null;
}

export type ExerciseData = ExerciseListResponse["data"][number];

export interface ExerciseListResponse {
  data: Exercise[];
  total: number;
}

export interface GetUserPlansRequest {
  userId: string;
}

export interface UserPlanSummary {
  id: string;
  week: number;
  split: TrainingSplit;
  score: number;
  createdAt: string;
}

export interface GetUserPlansResponse {
  plans: UserPlanSummary[];
}

export interface ToggleFavoriteRequest {
  exerciseId: string;
}

export interface ToggleFavoriteResponse {
  success: boolean;
  message?: string;
}

// 👉 Для ответа /favorites: список «избранного» упражнений
export interface FavoriteItem {
  id: string;
  name: string;
  primaryMuscleGroup: PrimaryMuscleGroup;
  difficulty: Difficulty;
  description: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
}

export interface FavoriteListResponse {
  data: FavoriteItem[];
  total: number;
}
