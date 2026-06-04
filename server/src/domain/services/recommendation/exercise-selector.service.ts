// domain/services/recommendation/exercise-selector.service.ts
/**
 * ExerciseSelectorService — подбор упражнений для тренировочного дня.
 *
 * Алгоритм:
 *   1. BIG5 — COMPOUND упражнения по паттернам (PUSH/PULL/SQUAT/HINGE)
 *   2. ISOLATION — добивает непокрытые мышцы, избранное в приоритете
 *   3. ACCESSORIES — пресс, икры, предплечья (лимит зависит от цели)
 *
 * Ограничения:
 *   - MAX_PER_MUSCLE_BY_SPLIT — лимит упражнений на общую группу для сплита
 *   - MUSCLE_TO_GENERAL_GROUP — маппинг конкретных мышц на общие группы
 *   - MusclePriorityService — модификаторы по полу/цели/возрасту
 *   - GOAL_CONFIG — фильтр категорий по цели (STRENGTH без изоляции)
 */

import { ExerciseEntity } from "../../entities/exercise.entity";
import { EntityValidationError } from "../../common";
import {
  DayType,
  ExerciseSet,
  DAY_MUSCLE_GROUPS,
} from "../../common/types/training.types";
import { logger } from "../../../common/utils/logger";
import { Result } from "../../common";
import {
  Difficulty,
  Gender,
  Goal,
  Lifestyle,
  MuscleGroup,
} from "@prisma/client";
import { TrainingSplit } from "../../../common/types/enums.types";
import {
  BIG5_PATTERNS,
  EXERCISES_PER_MUSCLE,
  GOAL_CONFIG,
  EXCLUDED_CATEGORIES,
  MAX_PER_MUSCLE_BY_SPLIT,
  MUSCLE_TO_GENERAL_GROUP,
} from "../../config/selector.config";
import { MusclePriorityService } from "./muscle-priority.service";

export class ExerciseSelectorService {
  /**
   * Сгенерировать упражнения на один тренировочный день.
   */
  generateDay(
    dayType: DayType,
    favorites: ExerciseEntity[],
    leastFavorites: ExerciseEntity[],
    allExercises: ExerciseEntity[],
    bmi: number,
    goal: Goal,
    age: number,
    gender: Gender,
    lifestyle: Lifestyle,
    week: number = 1,
    wellbeing: "BAD" | "NORMAL" | "GOOD" = "NORMAL",
    dayInCycle: number = 0,
    experienceLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" = "INTERMEDIATE",
    trainingSplit: TrainingSplit,
  ): Result<ExerciseSet[]> {
    try {
      const difficulty = this.calculateDifficulty(bmi, goal, age, lifestyle, gender, dayType);
      const goalConf = GOAL_CONFIG[goal] || GOAL_CONFIG.HYPERTROPHY;

      // ── ФИЛЬТРАЦИЯ УПРАЖНЕНИЙ ──────────────────────
      const leastFavoriteIds = new Set(leastFavorites.map((ex) => ex.id));

      // Исключаем нелюбимые и неподходящие категории (STATIC, CARDIO, MOBILITY)
      const available = allExercises.filter(
        (ex) =>
          !leastFavoriteIds.has(ex.id) &&
          !EXCLUDED_CATEGORIES.includes(ex.exerciseCategory as any),
      );

      // Оставляем только категории, разрешённые целью (STRENGTH = только COMPOUND)
      const allowedCategories = [
        ...goalConf.primaryCategories,
        ...goalConf.secondaryCategories,
      ];
      const goalFiltered = available.filter((ex) =>
        allowedCategories.includes(ex.exerciseCategory || ""),
      );
      logger.info("🔍 DEBUG after goal filter", {
        total: allExercises.length,
        afterFilter: goalFiltered.length,
        goal,
        allowedCategories,
      });

      // Для BEGINNER убираем сложные упражнения со штангой в SQUAT/HINGE
      const levelFiltered =
        experienceLevel === "BEGINNER"
          ? this.excludeAdvancedExercises(goalFiltered)
          : goalFiltered;

      const selectedIds = new Set<string>();

      // ── 1️⃣ BIG5 — COMPOUND по паттернам ──────────
      const big5 = this.selectBig5(levelFiltered, dayType, difficulty, experienceLevel, trainingSplit);
      big5.forEach((ex) => selectedIds.add(ex.exerciseId));

      // ── 2️⃣ ЦЕЛЕВЫЕ МЫШЦЫ ДНЯ ─────────────────────
      const targetMuscles = DAY_MUSCLE_GROUPS[dayType] || [];
      logger.info("🔍 DEBUG targetMuscles", {
        dayType,
        trainingSplit,
        targetMuscles,
      });

      // Какие общие группы уже покрыты BIG5
      const coveredGroups = new Set(
        big5
          .map((ex) => MUSCLE_TO_GENERAL_GROUP[ex.muscleGroup || ""] || ex.muscleGroup)
          .filter(Boolean),
      );

      // Какие мышцы ещё не покрыты — маппим каждую на общую группу
      const uncoveredMuscles = trainingSplit === "BRO_SPLIT"
        ? targetMuscles
        : targetMuscles.filter(
            (m) => !coveredGroups.has(MUSCLE_TO_GENERAL_GROUP[m] || m)
          );
      logger.info("🔍 DEBUG uncoveredMuscles", {
        coveredGroups: [...coveredGroups],
        uncoveredMuscles,
        targetMusclesCount: targetMuscles.length,
      });

      // ── 3️⃣ ISOLATION — добивка непокрытых мышц ────
      // Избранные упражнения передаются как приоритет при сортировке
      const isolation = this.selectIsolation(
        levelFiltered.filter((ex) => !selectedIds.has(ex.id)),
        uncoveredMuscles,
        difficulty,
        dayType,
        gender,
        goal,
        age,
        trainingSplit,
        big5,
        favorites.filter((f) => !leastFavoriteIds.has(f.id)),
      );
      isolation.forEach((ex) => selectedIds.add(ex.exerciseId));

      // ── 4️⃣ ACCESSORIES — пресс, икры, предплечья ──
      const accessoryCount = Math.min(goalConf.maxAccessoryCount, 2);
      const accessories = this.selectAccessories(
        levelFiltered.filter((ex) => !selectedIds.has(ex.id)),
        accessoryCount,
      );
      accessories.forEach((ex) => selectedIds.add(ex.exerciseId));

      // ── 5️⃣ СБОРКА ─────────────────────────────────
      logger.info("🔍 DEBUG SOURCES", {
        big5: big5.map((e) => ({ muscle: e.muscleGroup, id: e.exerciseId })),
        isolation: isolation.map((e) => ({ muscle: e.muscleGroup, id: e.exerciseId })),
        accessories: accessories.map((e) => ({ muscle: e.muscleGroup, id: e.exerciseId })),
      });

      let finalPlan = [...big5, ...isolation, ...accessories];
      const maxTotal = this.getMaxExercises(dayType, difficulty);
      finalPlan = finalPlan.slice(0, maxTotal);

      finalPlan = this.smartSort(finalPlan);
      finalPlan = this.applyProgression(finalPlan, wellbeing, week, lifestyle, gender);

      logger.info("🔍 DEBUG FINAL PLAN", {
        total: finalPlan.length,
        exercises: finalPlan.map((e) => e.muscleGroup),
      });

      return Result.ok(finalPlan);
    } catch (error) {
      logger.error("💥 ExerciseSelector ERROR", { error: String(error) });
      return Result.error(new EntityValidationError(["Ошибка подбора упражнений"]));
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 1️⃣ BIG5 — COMPOUND ПО ПАТТЕРНАМ
  // ═══════════════════════════════════════════════════════════

  /**
   * Выбирает COMPOUND упражнения по паттернам (PUSH/PULL/SQUAT/HINGE).
   * Ограничивает количество через MAX_PER_MUSCLE_BY_SPLIT по общим группам,
   * маппя конкретные мышцы через MUSCLE_TO_GENERAL_GROUP.
   */
  private selectBig5(
    exercises: ExerciseEntity[],
    dayType: DayType,
    difficulty: Difficulty,
    experienceLevel: string,
    trainingSplit: TrainingSplit,
  ): ExerciseSet[] {
    const patterns = BIG5_PATTERNS[dayType] || [];
    const result: ExerciseSet[] = [];
    const usedIds = new Set<string>();
    const muscleLimits = MAX_PER_MUSCLE_BY_SPLIT[trainingSplit] || {};
    const selectedCountByGroup: Record<string, number> = {};

    logger.info("🔍 DEBUG BIG5 start", {
      dayType,
      trainingSplit,
      patterns: patterns.map((p) => `${p.muscle}+${p.pattern}:${p.count}`),
      availableExercises: exercises.length,
    });

    for (const { muscle, pattern, count } of patterns) {
      // Приводим конкретную мышцу к общей группе для проверки лимита
      const group = MUSCLE_TO_GENERAL_GROUP[muscle] || muscle;
      const limit = muscleLimits[group] || count;
      const already = selectedCountByGroup[group] || 0;
      const allowed = Math.max(0, Math.min(count, limit - already));

      if (allowed <= 0) {
        logger.info("🔍 DEBUG BIG5 skip", { muscle, group, limit, already, reason: "limit reached" });
        continue;
      }

      // COMPOUND с совпадением по мышце и паттерну
      const candidates = exercises
        .filter(
          (ex) =>
            !usedIds.has(ex.id) &&
            ex.exerciseCategory === "COMPOUND" &&
            this.matchesMuscle(ex, muscle) &&
            this.hasMovementPattern(ex, pattern) &&
            this.isSuitableDifficulty(ex, difficulty),
        )
        .sort(() => Math.random() - 0.5)
        .slice(0, allowed);

      logger.info("🔍 DEBUG BIG5 pattern", {
        muscle,
        pattern,
        allowed,
        found: candidates.length,
        names: candidates.map((e) => e.name),
      });

      for (const ex of candidates) {
        usedIds.add(ex.id);
        result.push(this.toExerciseSet(ex, false, difficulty));
        selectedCountByGroup[group] = (selectedCountByGroup[group] || 0) + 1;
      }
    }

    logger.info("🔍 DEBUG BIG5 result", {
      total: result.length,
      muscles: result.map((e) => e.muscleGroup),
    });

    return result;
  }

  // ═══════════════════════════════════════════════════════════
  // 2️⃣ ISOLATION — ДОБИВКА НЕПОКРЫТЫХ МЫШЦ
  // ═══════════════════════════════════════════════════════════

  /**
   * Добивает непокрытые целевые мышцы изоляцией и дополнительными COMPOUND.
   * 
   * Приоритет при сортировке:
   *   1. Избранные упражнения
   *   2. ISOLATION
   *   3. COMPOUND (только если primaryMuscleGroup в той же общей группе)
   * 
   * Ограничения:
   *   - EXERCISES_PER_MUSCLE + модификатор MusclePriorityService
   *   - MAX_PER_MUSCLE_BY_SPLIT
   *   - Уже выбранные упражнения из BIG5
   */
  private selectIsolation(
    exercises: ExerciseEntity[],
    targetMuscles: MuscleGroup[],
    difficulty: Difficulty,
    dayType: DayType,
    gender: Gender,
    goal: Goal,
    age: number,
    trainingSplit: TrainingSplit,
    alreadySelected: ExerciseSet[] = [],
    favorites: ExerciseEntity[] = [],
  ): ExerciseSet[] {
    const result: ExerciseSet[] = [];
    const usedIds = new Set<string>();
    const muscleLimits = MAX_PER_MUSCLE_BY_SPLIT[trainingSplit] || {};

    // Считаем уже выбранные упражнения по общим группам
    const selectedCounts: Record<string, number> = {};
    for (const ex of alreadySelected) {
      const group = MUSCLE_TO_GENERAL_GROUP[ex.muscleGroup || ""] || ex.muscleGroup || "";
      selectedCounts[group] = (selectedCounts[group] || 0) + 1;
    }

    logger.info("🔍 DEBUG ISOLATION start", {
      targetMuscles,
      trainingSplit,
      alreadySelectedCounts: selectedCounts,
      availableExercises: exercises.length,
      favoritesCount: favorites.length,
    });

    for (const muscle of targetMuscles) {
      // Базовый объём + модификатор пола/цели/возраста
      const config = EXERCISES_PER_MUSCLE[muscle] || { min: 1, max: 2 };
      const modifier = MusclePriorityService.getModifier(muscle, gender, goal, age, trainingSplit);
      const adjustedMin = Math.max(1, config.min + modifier);

      // Сколько ещё можно добавить с учётом лимита сплита
      const group = MUSCLE_TO_GENERAL_GROUP[muscle] || muscle;
      const totalLimit = muscleLimits[group] || adjustedMin;
      const alreadyCount = selectedCounts[group] || 0;
      const remaining = Math.max(0, totalLimit - alreadyCount);
      const allowed = Math.min(adjustedMin, remaining);

      logger.info("🔍 DEBUG ISOLATION muscle", {
        muscle,
        group,
        adjustedMin,
        totalLimit,
        alreadyCount,
        remaining,
        allowed,
      });

      if (allowed <= 0) continue;

      // BRO SPLIT: для грудного/спины/ног — secondary разрешены,
      // для плеч/рук — только общая группа (isSameGeneralGroup)
      const allowSecondary = trainingSplit === "BRO_SPLIT" && 
        ["chest", "back", "legs"].includes(dayType);

      // Подбираем упражнения с приоритетом избранного
      const allCandidates = exercises.filter(
        (ex) =>
          !usedIds.has(ex.id) &&
          this.matchesMuscle(ex, muscle) &&
          this.isSuitableDifficulty(ex, difficulty) &&
          this.matchesDayPattern(ex, dayType) &&
          (ex.exerciseCategory === "ISOLATION" || ex.exerciseCategory === "COMPOUND") &&
          (allowSecondary || this.isSameGeneralGroup(ex.primaryMuscleGroup as string, group, dayType)),
      );

      logger.info("🔍 DEBUG ISOLATION candidates total", {
        muscle,
        totalCandidates: allCandidates.length,
        categories: allCandidates.map((e) => e.exerciseCategory),
      });

      const candidates = allCandidates
        .sort((a, b) => {
          // 1. Избранное — в начало
          const aFav = favorites.some((f) => f.id === a.id) ? 0 : 1;
          const bFav = favorites.some((f) => f.id === b.id) ? 0 : 1;
          if (aFav !== bFav) return aFav - bFav;
          
          // 2. Primary — вперёд (для всех сплитов)
          const aPrimary = (a.primaryMuscleGroup as string) === muscle ? 0 : 1;
          const bPrimary = (b.primaryMuscleGroup as string) === muscle ? 0 : 1;
          if (aPrimary !== bPrimary) return aPrimary - bPrimary;
          
          // 3. ISOLATION перед COMPOUND
          if (a.exerciseCategory === "ISOLATION" && b.exerciseCategory !== "ISOLATION") return -1;
          if (a.exerciseCategory !== "ISOLATION" && b.exerciseCategory === "ISOLATION") return 1;
          
          // 4. Разнообразие
          return Math.random() - 0.5;
        })
        .slice(0, allowed);

      logger.info("🔍 DEBUG ISOLATION selected", {
        muscle,
        allowed,
        selected: candidates.length,
        names: candidates.map((e) => e.name),
        categories: candidates.map((e) => e.exerciseCategory),
      });

      for (const ex of candidates) {
        usedIds.add(ex.id);
        result.push(this.toExerciseSet(ex, favorites.some((f) => f.id === ex.id), difficulty));
        selectedCounts[group] = (selectedCounts[group] || 0) + 1;
      }
    }

    logger.info("🔍 DEBUG ISOLATION result", {
      total: result.length,
      muscles: result.map((e) => e.muscleGroup),
    });

    return result;
  }

  // ═══════════════════════════════════════════════════════════
  // 3️⃣ ACCESSORIES — ПРЕСС, ИКРЫ, ПРЕДПЛЕЧЬЯ
  // ═══════════════════════════════════════════════════════════

  /**
   * Добавляет упражнения на мелкие группы мышц (пресс, икры, предплечья).
   * Ищет ISOLATION упражнения с primaryMuscleGroup = CORE, CALVES, FOREARMS.
   * Количество ограничено целью (STRENGTH = 0, HYPERTROPHY = до 2).
   */
  private selectAccessories(
    exercises: ExerciseEntity[],
    maxCount: number,
  ): ExerciseSet[] {
    if (maxCount <= 0) return [];

    const accessoryMuscles = ["ABS_UPPER", "ABS_LOWER", "OBLIQUES", "CALVES_GASTROCNEMIUS", "CALVES_SOLEUS", "FOREARMS_FLEXORS", "FOREARMS_EXTENSORS"];
    
    const result = exercises
      .filter((ex) =>
        ex.exerciseCategory === "ISOLATION" &&
        ex.primaryMuscleGroup === "CORE" || 
        accessoryMuscles.includes(ex.primaryMuscleGroup as string)
      )
      .sort(() => Math.random() - 0.5)
      .slice(0, maxCount)
      .map((ex) => this.toExerciseSet(ex, false, Difficulty.MEDIUM));

    logger.info("🔍 DEBUG ACCESSORIES", { maxCount, selected: result.length });
    return result;
  }

  // ═══════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════

  /** 
   * Для PPL проверяет, что упражнение соответствует типу дня по паттерну движения.
   * PUSH день: только PUSH (жимы, разгибания трицепса, разведения в стороны)
   * PULL день: только PULL/HINGE (тяги, сгибания бицепса, задняя дельта)
   * LEGS день: только SQUAT/HINGE (приседы, тяги на ноги)
   */
  private matchesDayPattern(exercise: ExerciseEntity, dayType: DayType): boolean {
    const patterns = exercise.movementPatterns || [];
    
    if (dayType === "push") return patterns.includes("PUSH" as any);
    if (dayType === "pull") return patterns.some(p => p === "PULL" || p === "HINGE");
    if (dayType === "legs") return patterns.some(p => p === "SQUAT" || p === "HINGE");
    
    // Остальные сплиты — без ограничений по паттерну
    return true;
  }

  /** Проверяет, что primaryMuscleGroup и целевая общая группа совместимы. */
  private isSameGeneralGroup(primary: string, targetGroup: string, dayType?: DayType): boolean {
    // ARMS подходит для BICEPS и TRICEPS
    if (primary === "ARMS" && (targetGroup === "BICEPS" || targetGroup === "TRICEPS")) return true;
    // CHEST упражнения часто задействуют TRICEPS (кроме дня рук в BRO SPLIT)
    if (primary === "CHEST" && targetGroup === "TRICEPS" && dayType !== "arms") return true;
    // BACK упражнения часто задействуют BICEPS (кроме дня рук в BRO SPLIT)
    if (primary === "BACK" && targetGroup === "BICEPS" && dayType !== "arms") return true;
    // LEGS подходит для QUADS, HAMSTRINGS, GLUTES, CALVES
    if (primary === "LEGS" && ["LEGS", "HAMSTRINGS", "GLUTES", "CALVES"].includes(targetGroup)) return true;
    // CORE подходит для ABS
    if (primary === "CORE" && targetGroup === "CORE") return true;
    // ARMS подходит для FOREARMS (предплечья — часть рук)
    if (primary === "ARMS" && targetGroup === "FOREARMS") return true;
    // Стандартный маппинг
    return (MUSCLE_TO_GENERAL_GROUP[primary] || primary) === targetGroup;
  }

  /** Проверяет, задействует ли упражнение указанную мышцу (основную или второстепенную). */
  private matchesMuscle(exercise: ExerciseEntity, muscle: string): boolean {
    if (exercise.primaryMuscleGroup === muscle) return true;
    return (exercise.secondaryMuscles || []).includes(muscle as MuscleGroup);
  }

  /** Проверяет наличие паттерна движения у упражнения. */
  private hasMovementPattern(exercise: ExerciseEntity, pattern: string): boolean {
    return (exercise.movementPatterns || []).some((p) => p === pattern);
  }

  /** Проверяет, подходит ли упражнение по сложности. */
  private isSuitableDifficulty(exercise: ExerciseEntity, userDifficulty: Difficulty): boolean {
    const exDiff = exercise.difficulty || Difficulty.MEDIUM;
    if (exDiff === userDifficulty) return true;
    if (userDifficulty === Difficulty.HARD && (exDiff === Difficulty.MEDIUM || exDiff === Difficulty.EASY)) return true;
    if (userDifficulty === Difficulty.MEDIUM && exDiff === Difficulty.EASY) return true;
    return false;
  }

  /** Исключает упражнения со штангой в SQUAT/HINGE для BEGINNER. */
  private excludeAdvancedExercises(exercises: ExerciseEntity[]): ExerciseEntity[] {
    return exercises.filter((ex) => {
      const hasBarbell = ex.name.toLowerCase().includes("штанг");
      const isSquatOrHinge = (ex.movementPatterns || []).some(
        (p) => p === "SQUAT" || p === "HINGE",
      );
      return !(hasBarbell && isSquatOrHinge);
    });
  }

  /** Создаёт ExerciseSet из ExerciseEntity. */
  private toExerciseSet(
    exercise: ExerciseEntity,
    isFavorite: boolean,
    difficulty: Difficulty,
  ): ExerciseSet {
    const baseSets = this.getBaseSets(exercise);
    const baseReps: [number, number] = this.getBaseReps(difficulty);

    return {
      exerciseId: exercise.id,
      sets: baseSets,
      targetRepsRange: baseReps,
      favorite: isFavorite,
      muscleGroup: exercise.primaryMuscleGroup as any,
      warning: undefined,
      progression: { baseSets, baseReps, weekOffset: 0 },
    };
  }

  private getBaseSets(exercise: ExerciseEntity): number {
    if (exercise.exerciseCategory === "COMPOUND") return 4;
    if (exercise.exerciseCategory === "ISOLATION") return 3;
    return 3;
  }

  private getBaseReps(difficulty: Difficulty): [number, number] {
    if (difficulty === "EASY") return [12, 15];
    if (difficulty === "HARD") return [8, 10];
    return [10, 12];
  }

  private getMaxExercises(dayType: DayType, difficulty: Difficulty): number {
    // Базовая граница по сложности
    let max: number;
    if (difficulty === "EASY") max = 6;
    else if (difficulty === "HARD") max = 10;
    else max = 8;

    // Надбавка за тип сплита (+2-4 упражнения)
    if (dayType === "full" || dayType === "upper" || dayType === "lower") max += 2;  // FULL_BODY, UPPER_LOWER
    else if (["chest", "back", "shoulders", "arms"].includes(dayType)) max += 2;     // BRO_SPLIT
    // PPL (push, pull, legs) — без надбавки, 8-9 хватает

    return max;
  }

  private calculateDifficulty(
    bmi: number,
    goal: Goal,
    age: number,
    lifestyle: Lifestyle,
    gender: Gender,
    dayType: DayType,
  ): Difficulty {
    let score = 0;
    if (bmi < 18.5) score -= 15;
    else if (bmi > 30) score += 20;
    if (age > 50) score += 18;
    else if (age < 18) score -= 12;
    if (goal === "LOSE_FAT") score += 10;
    if (gender === Gender.Female) score -= 5;

    const recoveryPenalty: Record<string, number> = {
      IMMOBILE: 20, LIGHT: 12, AVERAGE: 5, HARD: -10,
    };
    score += recoveryPenalty[lifestyle] || 0;

    const dayDiff: Record<string, number> = {
      legs: 12, shoulders: 10, back: 8, push: 6, pull: 6,
      chest: 6, full: 0, upper: 2, lower: 8, arms: 4, core: -5,
    };
    score += dayDiff[dayType] || 0;

    return score <= -15 ? Difficulty.EASY : score >= 20 ? Difficulty.HARD : Difficulty.MEDIUM;
  }

  /** Сортировка: COMPOUND → ISOLATION → ACCESSORY, с чередованием мышц. */
  private smartSort(exercises: ExerciseSet[]): ExerciseSet[] {
    const categoryOrder: Record<string, number> = { COMPOUND: 0, ISOLATION: 1, ACCESSORY: 2 };

    return exercises.sort((a, b) => {
      const catA = categoryOrder[a.muscleGroup as string] ?? 1;
      const catB = categoryOrder[b.muscleGroup as string] ?? 1;
      if (catA !== catB) return catA - catB;

      const muscleA = a.muscleGroup || "";
      const muscleB = b.muscleGroup || "";
      return muscleA.localeCompare(muscleB);
    });
  }

  /** Корректирует подходы с учётом самочувствия, пола и образа жизни. */
  private applyProgression(
    exercises: ExerciseSet[],
    wellbeing: "BAD" | "NORMAL" | "GOOD",
    week: number,
    lifestyle: Lifestyle,
    gender: Gender,
  ): ExerciseSet[] {
    const genderMultiplier = gender === Gender.Female ? 0.85 : 1.0;
    const lifestyleMultiplier: Record<string, number> = {
      IMMOBILE: 0.75, LIGHT: 0.9, AVERAGE: 1.0, HARD: 1.15,
    };

    return exercises.map((ex) => {
      let sets = ex.sets;
      const wellbeingCoeff = wellbeing === "BAD" ? 0.8 : wellbeing === "GOOD" ? 1.2 : 1.0;
      sets = Math.round(sets * wellbeingCoeff * genderMultiplier * (lifestyleMultiplier[lifestyle] || 1.0));
      sets = Math.max(2, Math.min(5, sets));

      return { ...ex, sets, targetRepsRange: ex.targetRepsRange };
    });
  }
}
