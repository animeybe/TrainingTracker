import {
  MuscleGroup,
  Difficulty,
  Lifestyle,
} from "../../common/types/enums.types";
import { DayType } from "../common/types/training.types";

// 🔥 БАЗОВЫЕ КОНСТАНТЫ ДЛЯ ПОДБОРА УПРАЖНЕНИЙ (с полным покрытием MuscleGroup)
export const SELECTOR_CONFIG = {
  // BIG 5 по дням (ExerciseId[])
  bigFiveNames: {
    push: ["Жим штанги лёжа", "Жим штанги стоя", "Отжимания на брусьях"],
    pull: ["Становая тяга", "Подтягивания", "Тяга штанги в наклоне"],
    legs: ["Приседания со штангой", "Становая тяга", "Жим ногами"],
    full: ["Приседания со штангой", "Жим штанги лёжа", "Становая тяга"],
    upper: ["Жим штанги лёжа", "Тяга штанги в наклоне", "Подтягивания"],
    lower: ["Приседания со штангой", "Становая тяга", "Выпады со штангой"],
    chest: ["Жим штанги лёжа", "Жим гантелей лёжа"],
    back: ["Становая тяга", "Подтягивания", "Тяга штанги в наклоне"],
    shoulders: ["Жим штанги стоя", "Жим гантелей сидя"],
    arms: ["Подъём штанги на бицепс", "Французский жим"],
    core: ["Планка", "Скручивания"],
  } as Record<DayType, string[]>,

  // Muscle fatigue по циклу (3 дня) — дефолт 1.0 для всех MuscleGroup
  fatigue: {
    QUADS_RECTUS_FEMORIS: [1.0, 0.85, 0.95] as const,
    GLUTES_MAXIMUS: [1.0, 0.9, 0.95] as const,
    LATS: [0.95, 0.9, 1.0] as const,
    CHEST_MIDDLE: [0.95, 0.85, 1.0] as const,
    DELTOIDS_ANTERIOR: [0.9, 0.8, 1.0] as const,
    ERECTOR_SPINAE_LOWER: [0.85, 0.8, 0.9] as const,
    HAMSTRINGS: [0.95, 0.85, 1.0] as const,
  } as Partial<Record<MuscleGroup, readonly number[]>>,

  // Базовый volume по мышцам — дефолт 3 для остальных
  volumes: {
    QUADS_RECTUS_FEMORIS: 4,
    GLUTES_MAXIMUS: 4,
    LATS: 3,
    CHEST_MIDDLE: 3,
    DELTOIDS_ANTERIOR: 2,
    ERECTOR_SPINAE_LOWER: 2,
    HAMSTRINGS: 3,
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
    GLUTES_MEDIAS: 2,
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
export type SelectorBigFive = typeof SELECTOR_CONFIG.bigFiveNames;
export type SelectorConfig = typeof SELECTOR_CONFIG;
