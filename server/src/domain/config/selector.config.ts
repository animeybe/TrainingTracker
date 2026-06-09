// domain/config/selector.config.ts
/**
 * SELECTOR_CONFIG — центральный конфиг системы подбора упражнений.
 *
 * Определяет:
 *   - Какие упражнения считаются основными (BIG5) для каждого типа дня
 *   - Приоритеты мышечных групп для сплитов
 *   - Объём упражнений (мин/макс на группу мышц)
 *   - Фильтры по категориям упражнений
 *   - Гендерные модификаторы приоритетов
 *   - Параметры восстановления и сложности
 */

import { MuscleGroup, Difficulty, Lifestyle, Gender, Goal } from "../../common/types/enums.types";
import { DayType } from "../common/types/training.types";
import { TrainingSplit } from "../../common/types/enums.types";

// ═══════════════════════════════════════════════════════════════
// КАТЕГОРИИ УПРАЖНЕНИЙ ДЛЯ ФИЛЬТРАЦИИ
// ═══════════════════════════════════════════════════════════════

/** Категории, которые ВСЕГДА исключаются из плана */
export const EXCLUDED_CATEGORIES = ["STATIC", "CARDIO", "MOBILITY"] as const;

/** Категории, которые исключаются для BEGINNER */
export const BEGINNER_EXCLUDED_CATEGORIES = ["STATIC", "CARDIO", "MOBILITY"] as const;

// ═══════════════════════════════════════════════════════════════
// BIG5 — ОСНОВНЫЕ УПРАЖНЕНИЯ ДНЯ
// ═══════════════════════════════════════════════════════════════

/**
 * BIG5 теперь определяется по ПАТТЕРНАМ ДВИЖЕНИЙ + ГРУППЕ МЫШЦ,
 * а не по названиям на русском.
 * 
 * Селектор ищет COMPOUND упражнения с указанным primaryMuscleGroup
 * и movementPattern, а не сравнивает строки названий.
 */
export const BIG5_PATTERNS: Record<DayType, Array<{ muscle: string; pattern: string; count: number }>> = {
  push: [
    { muscle: "CHEST", pattern: "PUSH", count: 2 },      // 2 жима на грудь
    { muscle: "SHOULDERS", pattern: "PUSH", count: 2 },   // 2 жима на плечи
  ],
  pull: [
    { muscle: "BACK", pattern: "PULL", count: 2 },        // 2 тяги на спину
    { muscle: "BACK", pattern: "HINGE", count: 1 },       // 1 становая/гиперэкстензия
  ],
  legs: [
    { muscle: "LEGS", pattern: "SQUAT", count: 2 },       // 2 приседательных
    { muscle: "LEGS", pattern: "HINGE", count: 1 },       // 1 тяговое на ноги
  ],
  full: [
    { muscle: "LEGS", pattern: "SQUAT", count: 1 },
    { muscle: "CHEST", pattern: "PUSH", count: 1 },
    { muscle: "BACK", pattern: "PULL", count: 1 },
    { muscle: "SHOULDERS", pattern: "PUSH", count: 1 },
  ],
  upper: [
    { muscle: "CHEST", pattern: "PUSH", count: 2 },
    { muscle: "BACK", pattern: "PULL", count: 2 },
  ],
  lower: [
    { muscle: "LEGS", pattern: "SQUAT", count: 2 },
    { muscle: "LEGS", pattern: "HINGE", count: 2 },
  ],
  chest: [
    { muscle: "CHEST", pattern: "PUSH", count: 3 },
  ],
  back: [
    { muscle: "BACK", pattern: "PULL", count: 2 },
    { muscle: "BACK", pattern: "HINGE", count: 1 },
  ],
  shoulders: [
    { muscle: "SHOULDERS", pattern: "PUSH", count: 2 },
  ],
  arms: [
    { muscle: "ARMS", pattern: "PULL", count: 2 },        // бицепс
    { muscle: "ARMS", pattern: "PUSH", count: 2 },        // трицепс
  ],
  core: [
    { muscle: "CORE", pattern: "CORE_STABILITY", count: 2 },
  ],
  // ── STRENGTH_FOCUS: пауэрлифтинг ──
    squat: [
    { muscle: "LEGS", pattern: "SQUAT", count: 3 },     // присед + жим ногами + выпады
    { muscle: "LEGS", pattern: "HINGE", count: 2 },     // румынская + ягодичный мост
    { muscle: "LEGS", pattern: "SQUAT", count: 1 },     // икры
  ],
  bench: [
    { muscle: "CHEST", pattern: "PUSH", count: 3 },      // жим лёжа + наклонная + отжимания
    { muscle: "SHOULDERS", pattern: "PUSH", count: 2 },  // жим стоя + разведения
    { muscle: "ARMS", pattern: "PUSH", count: 1 },       // трицепс
  ],
  deadlift: [
    { muscle: "BACK", pattern: "HINGE", count: 2 },      // становая + гиперэкстензия
    { muscle: "BACK", pattern: "PULL", count: 3 },       // тяги
    { muscle: "LEGS", pattern: "HINGE", count: 2 },      // румынская + ягодичный
  ],
  ohp: [
    { muscle: "SHOULDERS", pattern: "PUSH", count: 3 },  // жим стоя + гантелями + разведения
    { muscle: "CHEST", pattern: "PUSH", count: 2 },      // жим наклонная + отжимания
    { muscle: "ARMS", pattern: "PUSH", count: 1 },       // трицепс
  ],
};

// ═══════════════════════════════════════════════════════════════
// ОБЪЁМ УПРАЖНЕНИЙ НА ГРУППУ МЫШЦ
// ═══════════════════════════════════════════════════════════════

/**
 * Минимальное и максимальное количество упражнений на группу мышц.
 * Применяется ПОСЛЕ модификатора сплита.
 */
export const EXERCISES_PER_MUSCLE: Record<string, { min: number; max: number }> = {
  CHEST: { min: 2, max: 4 },
  BACK: { min: 2, max: 4 },
  QUADS: { min: 2, max: 4 },
  HAMSTRINGS: { min: 2, max: 3 },
  SHOULDERS: { min: 2, max: 3 },
  GLUTES: { min: 1, max: 2 },
  BICEPS: { min: 2, max: 3 },
  TRICEPS: { min: 2, max: 3 },
  CALVES: { min: 1, max: 2 },
  CORE: { min: 2, max: 3 },
  FOREARMS: { min: 1, max: 2 },
  TRAPEZIUS: { min: 0, max: 1 },
  NECK: { min: 0, max: 1 },
};

// ═══════════════════════════════════════════════════════════════
// МОДИФИКАТОРЫ ОБЪЁМА ПО СПЛИТУ
// ═══════════════════════════════════════════════════════════════

/** Множитель максимального количества упражнений в зависимости от сплита */
export const SPLIT_MAX_MODIFIER: Record<TrainingSplit, number> = {
  PPL: 1.5,
  FULL_BODY: 1.0,
  UPPER_LOWER: 1.5,
  BRO_SPLIT: 3.0,
  STRENGTH_FOCUS: 0.8,
  HYPERTROPHY_FOCUS: 2.0,
};

// ═══════════════════════════════════════════════════════════════
// ЛИМИТЫ УПРАЖНЕНИЙ НА ГРУППУ МЫШЦ ПО СПЛИТАМ
// ═══════════════════════════════════════════════════════════════

/**
 * Максимальное количество упражнений на общую группу мышц для каждого сплита.
 * 
 * Логика:
 *   - FULL_BODY: всё тело за раз → больше упражнений на каждую группу (10-12 всего)
 *   - PPL: каждая группа 2 раза в неделю → умеренный объём за тренировку (7-9 всего)
 *   - UPPER_LOWER: половина тела → больше изоляции (9-10 всего)
 *   - BRO_SPLIT: одна группа за тренировку → максимальный объём (8-10 всего)
 *   - STRENGTH_FOCUS: только база, мало изоляции (5-7 всего)
 *   - HYPERTROPHY_FOCUS: много изоляции, большой объём (10-12 всего)
 * 
 * Ключи — общие группы мышц (CHEST, BACK, LEGS, SHOULDERS, BICEPS, TRICEPS, 
 *   HAMSTRINGS, GLUTES, CALVES, CORE, FOREARMS).
 */
export const MAX_PER_MUSCLE_BY_SPLIT: Record<TrainingSplit, Record<string, number>> = {
  // ── FULL_BODY: всё тело за раз, 10-12 упражнений ──
  FULL_BODY: {
    CHEST: 2,
    BACK: 2,
    LEGS: 3,         // квадрицепс + бицепс бедра + ягодицы
    SHOULDERS: 2,    // передняя + средняя дельта
    BICEPS: 2,       // работает с тягами спины
    TRICEPS: 2,      // работает с жимами на грудь
    CORE: 2,         // пресс верх + низ / косые
    HAMSTRINGS: 2,   // бицепс бедра
    GLUTES: 1,
    CALVES: 1,
    FOREARMS: 1,
  },

  // ── PPL: каждая группа 2 раза в неделю, 7-9 упражнений за тренировку ──
  PPL: {
    // Push day — глубокая проработка груди, плеч, трицепса
    CHEST: 4,        // верх, середина, низ + изоляция
    SHOULDERS: 3,    // передняя, средняя, задняя
    TRICEPS: 3,      // длинная, латеральная, медиальная
    // Pull day — глубокая проработка спины, бицепса, задней дельты
    BACK: 5,         // широчайшие, ромбовидные, разгибатели + изоляция
    BICEPS: 3,       // длинная, короткая + изоляция
    // Legs day — глубокая проработка ног
    LEGS: 6,         // квадрицепс (3 головки) + изоляция
    HAMSTRINGS: 4,
    GLUTES: 2,
    CALVES: 2,
    CORE: 1,
    FOREARMS: 2,
  },

  // ── UPPER_LOWER: половина тела за раз, 9-10 упражнений ──
  UPPER_LOWER: {
    CHEST: 3,
    BACK: 3,
    SHOULDERS: 2,
    BICEPS: 2,
    TRICEPS: 2,
    LEGS: 4,
    HAMSTRINGS: 3,
    GLUTES: 2,
    CALVES: 2,
    CORE: 1,
    FOREARMS: 1,
  },

  // ── BRO_SPLIT: одна группа за тренировку, 8-10 упражнений ──
  BRO_SPLIT: {
    CHEST: 6,
    BACK: 6,
    SHOULDERS: 5,
    TRAPEZIUS: 1,
    LEGS: 6,
    BICEPS: 4,
    TRICEPS: 4,
    HAMSTRINGS: 4,
    GLUTES: 3,
    CALVES: 3,
    CORE: 2,
    FOREARMS: 2,
  },

  // ── STRENGTH_FOCUS: только база, 5-7 упражнений ──
  STRENGTH_FOCUS: {
    CHEST: 2,
    BACK: 2,
    LEGS: 2,
    SHOULDERS: 1,
    BICEPS: 1,
    TRICEPS: 1,
    HAMSTRINGS: 1,
    CORE: 1,
    GLUTES: 1,
    CALVES: 1,
    FOREARMS: 0,
  },

  // ── HYPERTROPHY_FOCUS: много изоляции, 10-12 упражнений ──
  HYPERTROPHY_FOCUS: {
    CHEST: 4,
    BACK: 4,
    LEGS: 5,
    SHOULDERS: 3,
    BICEPS: 3,
    TRICEPS: 3,
    HAMSTRINGS: 3,
    GLUTES: 3,
    CALVES: 2,
    CORE: 2,
    FOREARMS: 2,
  },
};

/**
 * Маппинг конкретных мышц (из БД) на общие группы для лимитов.
 * Нужен потому, что в DAY_MUSCLE_GROUPS и БД используются конкретные мышцы
 * (CHEST_MIDDLE, LATS, QUADS_RECTUS_FEMORIS), а в MAX_PER_MUSCLE_BY_SPLIT —
 * общие группы (CHEST, BACK, LEGS).
 */
export const MUSCLE_TO_GENERAL_GROUP: Record<string, string> = {
  // Общие группы → сами в себя
  LEGS: "LEGS",
  BACK: "BACK",
  CHEST: "CHEST",
  SHOULDERS: "SHOULDERS",
  CORE: "CORE",
  // Грудь → CHEST
  CHEST_UPPER: "CHEST",
  CHEST_MIDDLE: "CHEST",
  CHEST_LOWER: "CHEST",
  // Спина → BACK
  LATS: "BACK",
  RHOMBOIDS_UPPER: "BACK",
  RHOMBOIDS_LOWER: "BACK",
  ERECTOR_SPINAE_UPPER: "BACK",
  ERECTOR_SPINAE_LOWER: "BACK",
  TRAPEZIUS_UPPER: "BACK",
  TRAPEZIUS_LOWER: "BACK",
  // Плечи → SHOULDERS
  DELTOIDS_ANTERIOR: "SHOULDERS",
  DELTOIDS_MEDIAL: "SHOULDERS",
  DELTOIDS_POSTERIOR: "SHOULDERS",
  // Ноги → LEGS
  QUADS_RECTUS_FEMORIS: "LEGS",
  QUADS_VASTUS_LATERALIS: "LEGS",
  QUADS_VASTUS_MEDIALIS: "LEGS",
  // Бицепс бедра → HAMSTRINGS
  HAMSTRINGS: "HAMSTRINGS",
  // Ягодицы → GLUTES
  GLUTES_MAXIMUS: "GLUTES",
  GLUTES_MEDIAS: "GLUTES",
  // Икры → CALVES
  CALVES_GASTROCNEMIUS: "CALVES",
  CALVES_SOLEUS: "CALVES",
  // Бицепс → BICEPS
  BICEPS_LONG_HEAD: "BICEPS",
  BICEPS_SHORT_HEAD: "BICEPS",
  // Трицепс → TRICEPS
  TRICEPS_LONG_HEAD: "TRICEPS",
  TRICEPS_MEDIAL_HEAD: "TRICEPS",
  TRICEPS_LATERAL_HEAD: "TRICEPS",
  // Пресс → CORE
  ABS_UPPER: "CORE",
  ABS_LOWER: "CORE",
  OBLIQUES: "CORE",
  // Предплечья → FOREARMS
  FOREARMS: "FOREARMS",
  FOREARMS_FLEXORS: "FOREARMS",
  FOREARMS_EXTENSORS: "FOREARMS",
};


// ═══════════════════════════════════════════════════════════════
// ФИЛЬТРЫ ПО ЦЕЛИ ТРЕНИРОВКИ
// ═══════════════════════════════════════════════════════════════

export const GOAL_CONFIG: Record<Goal, {
  primaryCategories: string[];
  secondaryCategories: string[];
  excludeCategories: string[];
  minCompoundPercent: number;
  maxAccessoryCount: number;
}> = {
  STRENGTH: {
    primaryCategories: ["COMPOUND"],
    secondaryCategories: ["ISOLATION"],
    excludeCategories: ["CARDIO", "STATIC", "MOBILITY", "ACCESSORY"],
    minCompoundPercent: 80,
    maxAccessoryCount: 0,
  },
  HYPERTROPHY: {
    primaryCategories: ["COMPOUND", "ISOLATION"],
    secondaryCategories: ["ACCESSORY"],
    excludeCategories: ["CARDIO", "STATIC", "MOBILITY"],
    minCompoundPercent: 50,
    maxAccessoryCount: 2,
  },
  LOSE_FAT: {
    primaryCategories: ["COMPOUND", "CARDIO"],
    secondaryCategories: ["ISOLATION"],
    excludeCategories: ["STATIC", "MOBILITY"],
    minCompoundPercent: 60,
    maxAccessoryCount: 1,
  },
  ENDURANCE: {
    primaryCategories: ["COMPOUND", "CARDIO"],
    secondaryCategories: ["ISOLATION"],
    excludeCategories: ["STATIC", "MOBILITY"],
    minCompoundPercent: 40,
    maxAccessoryCount: 1,
  },
  REHABILITATION: {
    primaryCategories: ["ISOLATION", "MOBILITY"],
    secondaryCategories: [],
    excludeCategories: ["COMPOUND", "CARDIO", "STATIC"],
    minCompoundPercent: 0,
    maxAccessoryCount: 0,
  },
  MAINTAIN_WEIGHT: {
    primaryCategories: ["COMPOUND", "ISOLATION"],
    secondaryCategories: ["ACCESSORY"],
    excludeCategories: ["CARDIO", "STATIC", "MOBILITY"],
    minCompoundPercent: 50,
    maxAccessoryCount: 2,
  },
  GAIN_MUSCLE_MASS: {
    primaryCategories: ["COMPOUND", "ISOLATION"],
    secondaryCategories: ["ACCESSORY"],
    excludeCategories: ["CARDIO", "STATIC", "MOBILITY"],
    minCompoundPercent: 60,
    maxAccessoryCount: 2,
  },
  POWER: {
    primaryCategories: ["COMPOUND"],
    secondaryCategories: ["ISOLATION"],
    excludeCategories: ["CARDIO", "STATIC", "MOBILITY", "ACCESSORY"],
    minCompoundPercent: 90,
    maxAccessoryCount: 0,
  },
  HEALTH: {
    primaryCategories: ["COMPOUND"],
    secondaryCategories: ["ISOLATION", "CARDIO"],
    excludeCategories: ["STATIC"],
    minCompoundPercent: 50,
    maxAccessoryCount: 2,
  },
};

// ═══════════════════════════════════════════════════════════════
// СЛОЖНОСТЬ И ВОССТАНОВЛЕНИЕ
// ═══════════════════════════════════════════════════════════════

export const SELECTOR_CONFIG = {
  // Сложность дней (наследуем из старого конфига)
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

  // Приоритет аксессуаров (чем меньше число — тем приоритетнее)
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

  // Reps по сложности
  baseReps: {
    EASY: [12, 15] as [number, number],
    MEDIUM: [10, 12] as [number, number],
    HARD: [8, 10] as [number, number],
  } as Record<Difficulty, [number, number]>,
} as const;
