import {
  Difficulty,
  ExerciseType,
  MuscleGroup,
} from "../../common/types/enums.types";

export type TrainingSplit = "PPL" | "FULL_BODY" | "UPPER_LOWER" | "BRO_SPLIT";
export type Wellbeing = "bad" | "normal" | "good";
// Основные тренировочные дни по группам мышц
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

export const DAY_MUSCLE_GROUPS: Record<DayType, MuscleGroup[]> = {
  push: [
    "DELTOIDS_ANTERIOR",
    "DELTOIDS_MEDIAL", // Передние+средние дельты
    "CHEST_UPPER",
    "CHEST_MIDDLE",
    "CHEST_LOWER", // Вся грудь
    "TRICEPS_LONG_HEAD",
    "TRICEPS_MEDIAL_HEAD",
    "TRICEPS_LATERAL_HEAD", // Все трицепсы
    "TRAPEZIUS_UPPER", // Верх трапеций (сидячий жим)
  ],

  pull: [
    "LATS",
    "RHOMBOIDS_UPPER",
    "RHOMBOIDS_LOWER", // Широчайшие+ромбовидные
    "TERES_MAJOR",
    "TERES_MINOR", // Малые круглые
    "BICEPS_LONG_HEAD",
    "BICEPS_SHORT_HEAD", // Бицепсы
    "TRAPEZIUS_UPPER",
    "ERECTOR_SPINAE_UPPER", // Трапеции+поясница
  ],

  legs: [
    "QUADS_RECTUS_FEMORIS",
    "QUADS_VASTUS_LATERALIS",
    "QUADS_VASTUS_MEDIALIS", // Четырехглавая
    "HAMSTRINGS", // Бицепс бедра
    "GLUTES_MAXIMUS",
    "GLUTES_MEDIAS", // Ягодицы
    "CALVES_GASTROCNEMIUS",
    "CALVES_SOLEUS", // Икры
    "ADDUCTORS",
    "ABDUCTORS", // Внутренняя/внешняя поверхность бедра
  ],

  // FULL_BODY (минимальный охват)
  full: [
    "CHEST_MIDDLE",
    "LATS", // Базовые многосуставные
    "QUADS_RECTUS_FEMORIS",
    "HAMSTRINGS", // Ноги
    "DELTOIDS_ANTERIOR",
    "TRICEPS_LONG_HEAD", // Жимы
    "BICEPS_LONG_HEAD", // Подтягивания
  ],

  // BRO_SPLIT (узкопрофильные)
  chest: ["CHEST_UPPER", "CHEST_MIDDLE", "CHEST_LOWER"],
  back: [
    "LATS",
    "RHOMBOIDS_UPPER",
    "RHOMBOIDS_LOWER",
    "TERES_MAJOR",
    "TERES_MINOR",
    "ERECTOR_SPINAE_UPPER",
  ],
  shoulders: ["DELTOIDS_ANTERIOR", "DELTOIDS_MEDIAL", "DELTOIDS_POSTERIOR"],
  arms: [
    "BICEPS_LONG_HEAD",
    "BICEPS_SHORT_HEAD",
    "TRICEPS_LONG_HEAD",
    "TRICEPS_MEDIAL_HEAD",
    "TRICEPS_LATERAL_HEAD",
  ],

  // Upper/Lower
  upper: [
    "CHEST_MIDDLE",
    "LATS",
    "DELTOIDS_ANTERIOR",
    "BICEPS_LONG_HEAD",
    "TRICEPS_LONG_HEAD",
    "TRAPEZIUS_UPPER",
  ],
  lower: [
    "QUADS_RECTUS_FEMORIS",
    "HAMSTRINGS",
    "GLUTES_MAXIMUS",
    "CALVES_GASTROCNEMIUS",
    "ADDUCTORS",
  ],

  core: ["ABS_UPPER", "ABS_LOWER", "OBLIQUES"],
};

export const primaryMuscles: MuscleGroup[] = [
  // ГРУДЬ
  "CHEST_UPPER",
  "CHEST_MIDDLE",
  "CHEST_LOWER",
  // СПИНА
  "LATS",
  "RHOMBOIDS_UPPER",
  "RHOMBOIDS_LOWER",
  // НОГИ
  "QUADS_RECTUS_FEMORIS",
  "HAMSTRINGS",
  "GLUTES_MAXIMUS",
  // ПЛЕЧИ
  "DELTOIDS_ANTERIOR",
  "DELTOIDS_MEDIAL",
  "DELTOIDS_POSTERIOR",
  // РУКИ
  "BICEPS_LONG_HEAD",
  "TRICEPS_LONG_HEAD",
];

export const accessoryMuscles: MuscleGroup[] = [
  "ABS_UPPER",
  "ABS_LOWER",
  "OBLIQUES",
  "CALVES_GASTROCNEMIUS",
  "CALVES_SOLEUS",
  "FOREARMS_FLEXORS",
  "FOREARMS_EXTENSORS",
];

export const SPLIT_CONFIG: Record<
  TrainingSplit,
  { daysPerWeek: number; restDays: number[] }
> = {
  PPL: { daysPerWeek: 6, restDays: [4, 7] },
  FULL_BODY: { daysPerWeek: 3, restDays: [2, 4, 5, 7] },
  UPPER_LOWER: { daysPerWeek: 4, restDays: [2, 4, 6] },
  BRO_SPLIT: { daysPerWeek: 5, restDays: [2, 6, 7] },
};

export interface SplitRecommendation {
  type: TrainingSplit;
  score: number;
  daysPerWeek: number;
  alternatives?: Array<{ type: TrainingSplit; score: number }>;
}

export interface ExerciseSet {
  exerciseId: string;
  sets: number;
  targetRepsRange: [number, number];
  favorite?: boolean;
  warning?: string;
  progression?: {
    baseSets: number; // База: 3 сета
    baseReps: [number, number]; // База: [8,12]
  };
  muscleGroup?: MuscleGroup;
}

export interface WorkoutDay {
  day: number;
  type: DayType;
  exercises: ExerciseSet[];
  progression?: {
    weekOffset: number; // +1 сет каждые 4 недели
    repIncrease: number; // +2 повтора каждые 2 недели
  };
}

export interface WeekPlan {
  week: number;
  split: TrainingSplit;
  score: number;
  daysPerWeek: number;
  days: Record<number, WorkoutDay | null>;
  restDays: number[];
  wellbeing: Wellbeing;
  wellbeingAdjusted?: boolean;
  message?: string;
}
