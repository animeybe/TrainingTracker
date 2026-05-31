import {
  Difficulty,
  Goal,
  Lifestyle,
  MuscleGroup,
  TrainingSplit,
} from "../../../common/types/enums.types";
import { TypedTrainingSplit } from "../../../common/types/rec-sys.types.types";

export type DayType =
  | "push"
  | "pull"
  | "legs"
  | "upper"
  | "lower"
  | "full"
  | "chest"
  | "back"
  | "shoulders"
  | "arms"
  | "core";

export const DAY_MUSCLE_GROUPS: Record<DayType, MuscleGroup[]> = {
  push: [
    "DELTOIDS_ANTERIOR",
    "DELTOIDS_MEDIAL",
    "CHEST_UPPER",
    "CHEST_MIDDLE",
    "CHEST_LOWER",
    "TRICEPS_LONG_HEAD",
    "TRICEPS_MEDIAL_HEAD",
    "TRICEPS_LATERAL_HEAD",
    "TRAPEZIUS_UPPER",
  ],
  pull: [
    "LATS",
    "RHOMBOIDS_UPPER",
    "RHOMBOIDS_LOWER",
    "BICEPS_LONG_HEAD",
    "BICEPS_SHORT_HEAD",
    "TRAPEZIUS_UPPER",
    "ERECTOR_SPINAE_UPPER",
  ],
  legs: [
    "QUADS_RECTUS_FEMORIS",
    "QUADS_VASTUS_LATERALIS",
    "QUADS_VASTUS_MEDIALIS",
    "HAMSTRINGS",
    "GLUTES_MAXIMUS",
    "GLUTES_MEDIAS",
    "CALVES_GASTROCNEMIUS",
    "CALVES_SOLEUS",
  ],
  full: [
    "CHEST_MIDDLE",
    "LATS",
    "QUADS_RECTUS_FEMORIS",
    "HAMSTRINGS",
    "DELTOIDS_ANTERIOR",
    "TRICEPS_LONG_HEAD",
    "BICEPS_LONG_HEAD",
  ],
  chest: ["CHEST_UPPER", "CHEST_MIDDLE", "CHEST_LOWER"],
  back: ["LATS", "RHOMBOIDS_UPPER", "RHOMBOIDS_LOWER", "TERES_MAJOR"],
  shoulders: ["DELTOIDS_ANTERIOR", "DELTOIDS_MEDIAL", "DELTOIDS_POSTERIOR"],
  arms: ["BICEPS_LONG_HEAD", "BICEPS_SHORT_HEAD", "TRICEPS_LONG_HEAD"],
  upper: [
    "CHEST_MIDDLE",
    "LATS",
    "DELTOIDS_ANTERIOR",
    "BICEPS_LONG_HEAD",
    "TRICEPS_LONG_HEAD",
  ],
  lower: [
    "QUADS_RECTUS_FEMORIS",
    "HAMSTRINGS",
    "GLUTES_MAXIMUS",
    "CALVES_GASTROCNEMIUS",
  ],
  core: ["ABS_UPPER", "ABS_LOWER", "OBLIQUES"],
};

export interface ExerciseSet {
  exerciseId: string;
  sets: number;
  targetRepsRange: [number, number];
  favorite?: boolean;
  warning?: string;
  muscleGroup: MuscleGroup;
  progression?: {
    baseSets: number;
    baseReps: [number, number];
    currentSets?: number;
    weekOffset: number;
    wellbeingAdjusted?: boolean;
  };
}

export interface WorkoutDay {
  day: number;
  type: DayType;
  exercises: ExerciseSet[];
  progression?: {
    weekOffset: number;
    repIncrease: number;
  };
}

// export interface WeekPlan {
//   week: number;
//   split: TrainingSplit;
//   score: number;
//   daysPerWeek: number;
//   days: Record<number, WorkoutDay | null>;
//   restDays: number[];
//   wellbeing: Wellbeing;
//   wellbeingAdjusted?: boolean;
//   message?: string;
// }

export interface SplitRecommendation {
  split: TrainingSplit;
  daysPerWeek: number;
  description: string;
  score: number;
}

// LocalTrainingPlan остаётся для тренировочных дней
export interface LocalTrainingPlan {
  dayType: DayType; // Только тренировочный тип!
  dayIndex: number;
  dayOfWeek: number;
  exercises: ExerciseSet[];
  targetMuscles: MuscleGroup[];
  coverage: number;
  estimatedDuration: number;
  volumeLoad: number;
  warnings: string[];
}

// LocalWeekPlan теперь использует WeeklyCalendar
export interface LocalWeekPlan {
  planId?: string;
  week: number;
  split: TypedTrainingSplit;
  trainingDays: LocalTrainingPlan[];
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
