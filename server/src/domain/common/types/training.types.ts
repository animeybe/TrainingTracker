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
    "FOREARMS_EXTENSORS",      // трицепс и разгибатели работают в жимах
  ],
  pull: [
    "LATS",
    "RHOMBOIDS_UPPER",
    "RHOMBOIDS_LOWER",
    "BICEPS_LONG_HEAD",
    "BICEPS_SHORT_HEAD",
    "TRAPEZIUS_UPPER",
    "ERECTOR_SPINAE_UPPER",
    "ERECTOR_SPINAE_LOWER",
    "DELTOIDS_POSTERIOR",      // задняя дельта — работает в тягах
    "FOREARMS_FLEXORS",        // предплечья — работают в тягах
    "FOREARMS_EXTENSORS",
    "TERES_MAJOR",             // малая круглая — часть спины
    "TERES_MINOR",
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
    "CHEST_UPPER",
    "CHEST_MIDDLE",
    "LATS",
    "RHOMBOIDS_UPPER",
    "QUADS_RECTUS_FEMORIS",
    "HAMSTRINGS",
    "DELTOIDS_ANTERIOR",
    "DELTOIDS_MEDIAL",
    "TRICEPS_LONG_HEAD",
    "BICEPS_LONG_HEAD",
    "BICEPS_SHORT_HEAD",
    "GLUTES_MAXIMUS",
    "CALVES_GASTROCNEMIUS",
  ],
  chest: [
    "CHEST_UPPER",
    "CHEST_MIDDLE",
    "CHEST_LOWER",
  ],
  back: [
    "LATS",
    "RHOMBOIDS_UPPER",
    "RHOMBOIDS_LOWER",
    "TERES_MAJOR",
    "TRAPEZIUS_UPPER",
    "TRAPEZIUS_LOWER",
    "ERECTOR_SPINAE_UPPER",
    "ERECTOR_SPINAE_LOWER",
  ],
  shoulders: [
    "DELTOIDS_ANTERIOR",
    "DELTOIDS_MEDIAL",
    "DELTOIDS_POSTERIOR",
    "TRAPEZIUS_UPPER",
  ],
  arms: [
    "BICEPS_LONG_HEAD",
    "BICEPS_SHORT_HEAD",
    "TRICEPS_LONG_HEAD",
    "TRICEPS_MEDIAL_HEAD",
    "TRICEPS_LATERAL_HEAD",
    "FOREARMS_FLEXORS",
    "FOREARMS_EXTENSORS",
  ],
  upper: [
    "CHEST_UPPER",
    "CHEST_MIDDLE",
    "LATS",
    "RHOMBOIDS_UPPER",
    "DELTOIDS_ANTERIOR",
    "DELTOIDS_MEDIAL",
    "BICEPS_LONG_HEAD",
    "BICEPS_SHORT_HEAD",
    "TRICEPS_LONG_HEAD",
    "TRICEPS_LATERAL_HEAD",
  ],
  lower: [
    "QUADS_RECTUS_FEMORIS",
    "QUADS_VASTUS_LATERALIS",
    "HAMSTRINGS",
    "GLUTES_MAXIMUS",
    "CALVES_GASTROCNEMIUS",
    "CALVES_SOLEUS",
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
