import {
  MuscleGroup,
  Difficulty,
  Lifestyle,
} from "../../common/types/enums.types";
import { DayType } from "../types/training.types";

// 🔥 БАЗОВЫЕ КОНСТАНТЫ ДЛЯ ПОДБОРА УПРАЖНЕНИЙ (с полным покрытием MuscleGroup)
export const SELECTOR_CONFIG = {
  // BIG 5 по дням (ExerciseId[])
  bigFive: {
    push: ["BENCH_PRESS", "OVERHEAD_PRESS"] as const,
    pull: ["DEADLIFT", "PULLUP"] as const,
    legs: ["SQUAT", "DEADLIFT"] as const,
    full: ["SQUAT", "BENCH_PRESS"] as const,
    upper: ["BENCH_PRESS", "PULLUP"] as const,
    lower: ["SQUAT", "DEADLIFT"] as const,
    chest: ["BENCH_PRESS"] as const,
    back: ["DEADLIFT", "PULLUP"] as const,
    shoulders: ["OVERHEAD_PRESS"] as const,
    arms: ["CURL", "TRICEP_EXT"] as const,
    core: ["PLANK"] as const,
  } as Record<DayType, readonly string[]>,

  // Muscle fatigue по циклу (3 дня) — дефолт 1.0 для всех MuscleGroup
  fatigue: {
    QUADS_RECTUS_FEMORIS: [1.0, 0.85, 0.95] as const,
    DELTOIDS_ANTERIOR: [0.9, 0.8, 1.0] as const,
    LATS: [0.95, 0.9, 1.0] as const,
    // ... добавь остальные или используй fallback
  } as Partial<Record<MuscleGroup, readonly number[]>>,

  // Базовый volume по мышцам — дефолт 3 для остальных
  volumes: {
    QUADS_RECTUS_FEMORIS: 4,
    GLUTES_MAXIMUS: 4,
    LATS: 3,
    CHEST_MIDDLE: 3,
    ERECTOR_SPINAE_LOWER: 2,
    // дефолт для остальных MuscleGroup = 3
  } as Partial<Record<MuscleGroup, number>>,

  // Сложность дней
  dayDifficulty: {
    legs: 12,
    shoulders: 10,
    back: 8,
    push: 6,
    pull: 6,
    chest: 6,
    full: 0,
    upper: 2,
    lower: 8,
    arms: 4,
    core: -5,
  } as Record<DayType, number>,

  // Приоритет аксессуаров — дефолт 5
  accessoryPriority: {
    ABS_UPPER: 1,
    ABS_LOWER: 1,
    OBLIQUES: 1,
    CALVES_GASTROCNEMIUS: 2,
    CALVES_SOLEUS: 2,
    FOREARMS_FLEXORS: 3,
    FOREARMS_EXTENSORS: 3,
    TRAPEZIUS_UPPER: 4,
  } as Partial<Record<MuscleGroup, number>>,

  // Recovery penalty по образу жизни
  recoveryPenalty: {
    IMMOBILE: 20,
    LIGHT: 12,
    AVERAGE: 5,
    HARD: -10,
  } as Record<Lifestyle, number>,

  // Reps по сложности — убираем readonly для совместимости
  baseReps: {
    EASY: [12, 15] as [number, number],
    MEDIUM: [10, 12] as [number, number],
    HARD: [8, 10] as [number, number],
  } as Record<Difficulty, [number, number]>,
} as const;

// 🛡️ TYPES
export type SelectorBigFive = typeof SELECTOR_CONFIG.bigFive;
export type SelectorConfig = typeof SELECTOR_CONFIG;
