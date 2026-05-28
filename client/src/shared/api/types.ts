// api/types.ts
// ═══════════════════════════════════════
// ENUM-типы (синхронизированы с сервером)
// ═══════════════════════════════════════

export type Wellbeing = "BAD" | "NORMAL" | "GOOD";
export type Gender = "Male" | "Female";
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

// ═══════════════════════════════════════
// ТРЕНИРОВОЧНЫЕ ТИПЫ
// ═══════════════════════════════════════

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
  | "core";

export interface ExerciseSet {
  exerciseId: string;
  sets: number;
  targetRepsRange: [number, number];
  favorite?: boolean;
  warning?: string;
  muscleGroup: MuscleGroup;
}

export interface TypedTrainingSplit {
  name: TrainingSplit;
  days: Array<{ type: DayType; frequency: number }>;
}

export interface TrainingDay {
  dayType: DayType;
  dayIndex: number;
  dayOfWeek: number;
  exercises: ExerciseSet[];
  targetMuscles: MuscleGroup[];
  coverage: number;
  estimatedDuration: number;
  volumeLoad: number;
  warnings: string[];
}

export interface WeekPlan {
  week: number;
  split: TypedTrainingSplit;
  trainingDays: TrainingDay[];
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

// ═══════════════════════════════════════
// API-ОТВЕТЫ
// ═══════════════════════════════════════

export interface RecommendSplitResponse {
  split: TrainingSplit;
  daysPerWeek: number;
  description: string;
  score: number;
  message: string;
}

export interface GeneratePlanRequest {
  week?: number;
  wellbeing?: Wellbeing;
  preferredSplit?: string;
}

export interface WeekPlanResponse {
  data: WeekPlan | null;
}

export interface TodayPlanResponse {
  data: {
    today: TrainingDay | null;
    wellbeingAdjusted: boolean;
    message: string;
  };
}

export interface UserPlanSummary {
  id: string;
  week: number;
  split: TrainingSplit;
  createdAt: string;
}

export interface GetUserPlansResponse {
  data: {
    plans: UserPlanSummary[];
  };
}

// ═══════════════════════════════════════
// ПРОФИЛЬ
// ═══════════════════════════════════════

export interface ProfileData {
  id: string;
  userId: string;
  weight: number | null;
  height: number | null;
  gender: Gender | null;
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

// ═══════════════════════════════════════
// УПРАЖНЕНИЯ
// ═══════════════════════════════════════

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

export interface ExerciseListResponse {
  data: Exercise[];
  total: number;
}

// ═══════════════════════════════════════
// FAVORITES / LEAST FAVORITES
// ═══════════════════════════════════════

export interface ToggleFavoriteRequest {
  exerciseId: string;
}

export interface ToggleFavoriteResponse {
  success: boolean;
  message?: string;
}

// ═══════════════════════════════════════
// ВЫПОЛНЕНИЕ ТРЕНИРОВОК
// ═══════════════════════════════════════

export interface TrainingDayExecution {
  id: string;
  userId: string;
  week: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string | null;
  wellbeingToday: Wellbeing;
  notes: string | null;
  createdAt: string;
  exercises?: TrainingExerciseExecution[];
}

export interface CreateTrainingDayExecution {
  week: number;
  dayOfWeek: number;
  startTime?: string;
  wellbeingToday?: Wellbeing;
  notes?: string | null;
}

export interface TrainingExerciseExecution {
  id: string;
  executionId: string;
  exerciseId: string;
  setsData: Array<{ set: number; weight: number; reps: number }>;
  orderInDay: number;
}

export interface CreateTrainingExerciseExecution {
  executionId: string;
  exerciseId: string;
  setsData: Array<{ set: number; weight: number; reps: number }>;
  orderInDay: number;
}

// ═══════════════════════════════════════
// USER STATE
// ═══════════════════════════════════════

export interface UserStateResponse {
  currentWeek: number;
}

// ═══════════════════════════════════════
// PUSH-УВЕДОМЛЕНИЯ
// ═══════════════════════════════════════

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushSubscribeResponse {
  success: boolean;
  id?: number;
}

export interface PushDeviceCountResponse {
  count: number;
}
