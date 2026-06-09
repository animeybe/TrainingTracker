// domain/services/recommendation/exercise-selector.service.ts
/**
 * ExerciseSelectorService — подбор упражнений для тренировочного дня.
 *
 * Алгоритм:
 *   1. BIG5 — COMPOUND упражнения по паттернам (PUSH/PULL/SQUAT/HINGE)
 *   2. ISOLATION — добивает непокрытые мышцы, избранное в приоритете
 *   3. ACCESSORIES — пресс, икры, предплечья (лимит зависит от цели)
 *   4. BRO SPLIT COMPOUND CHECK — если в дне нет COMPOUND на основную мышцу,
 *      добирает forced из нелюбимых
 *   5. FALLBACK — если план < 3 упражнений, перегенерирует без нелюбимых
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
      logger.info("🔍 DEBUG leastFavoriteIds", { count: leastFavoriteIds.size, sample: [...leastFavoriteIds].slice(0, 3) });

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

      // Сохраняем ID нелюбимых для пометки forced в fallback
      const leastFavoriteIdsForFallback = new Set(leastFavoriteIds);

      // Резерв без нелюбимых — для fallback если план окажется пустым
      const fallbackExercises = allExercises.filter(
        (ex) => !EXCLUDED_CATEGORIES.includes(ex.exerciseCategory as any),
      );
      const fallbackGoalFiltered = fallbackExercises.filter((ex) =>
        allowedCategories.includes(ex.exerciseCategory || ""),
      );
      const fallbackLevelFiltered =
        experienceLevel === "BEGINNER"
          ? this.excludeAdvancedExercises(fallbackGoalFiltered)
          : fallbackGoalFiltered;

      // ── HYPERTROPHY_FOCUS: особая логика ──────────
      if (trainingSplit === "HYPERTROPHY_FOCUS" && ["chest", "back", "shoulders", "legs", "arms"].includes(dayType)) {
        const hypertrophyPlan = this.generateHypertrophyDay(
          levelFiltered, fallbackLevelFiltered,
          dayType as "chest" | "back" | "shoulders" | "legs" | "arms",
          difficulty,
          favorites.filter(f => !leastFavoriteIds.has(f.id)),
          leastFavoriteIds,
        );
        
        // Аксессуары сверху
        const accessories = this.selectAccessories(
          fallbackLevelFiltered.filter(ex => !hypertrophyPlan.some(p => p.exerciseId === ex.id)),
          2,
        );
        
        const finalPlan = this.smartSort([...hypertrophyPlan, ...accessories]);
        const progressed = this.applyProgression(finalPlan, wellbeing, week, lifestyle, gender, trainingSplit);
        
        logger.info("🔍 DEBUG HYPERTROPHY PLAN", {
          total: progressed.length,
          exercises: progressed.map(e => e.muscleGroup),
          forced: progressed.filter(e => e.forced).map(e => e.muscleGroup),
        });
        
        return Result.ok(progressed);
      }

      // ── STRENGTH_FOCUS: особая логика ──────────
      if (["squat", "bench", "deadlift", "ohp"].includes(dayType)) {
        const strengthPlan = this.generateStrengthDay(
          levelFiltered, fallbackLevelFiltered,
          dayType as "squat" | "bench" | "deadlift" | "ohp",
          difficulty,
          favorites.filter(f => !leastFavoriteIds.has(f.id)),
          leastFavoriteIds,
        );
        
        const finalPlan = this.smartSort(strengthPlan);
        const progressed = this.applyProgression(finalPlan, wellbeing, week, lifestyle, gender, trainingSplit);
        
        logger.info("🔍 DEBUG STRENGTH PLAN", {
          total: progressed.length,
          exercises: progressed.map(e => e.muscleGroup),
          forced: progressed.filter(e => e.forced).map(e => e.muscleGroup),
        });
        
        return Result.ok(progressed);
      }

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
      const uncoveredMuscles = (trainingSplit === "BRO_SPLIT" || trainingSplit === "STRENGTH_FOCUS")
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
      const accessoryCount = trainingSplit === "STRENGTH_FOCUS" 
        ? 0 
        : Math.min(goalConf.maxAccessoryCount, 2);
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

      let mainPlan = [...big5, ...isolation];
      const maxTotal = this.getMaxExercises(dayType, difficulty);
      mainPlan = mainPlan.slice(0, maxTotal);

      let finalPlan = [...mainPlan, ...accessories];

      // ── BRO SPLIT: проверяем, есть ли COMPOUND на основную мышцу дня ──
      const isSingleFocusDay = ["chest", "back", "shoulders", "legs", "arms"].includes(dayType);
      
      if (isSingleFocusDay) {
        const dayMainMuscles = DAY_MUSCLE_GROUPS[dayType] || [];
        const allExMap = new Map(allExercises.map(e => [e.id, e]));
        
        const hasCompound = finalPlan.some(ex => {
          const fullEx = allExMap.get(ex.exerciseId);
          return fullEx?.exerciseCategory === "COMPOUND" && 
                 dayMainMuscles.some(m => 
                   (fullEx.primaryMuscleGroup as string) === m ||
                   MUSCLE_TO_GENERAL_GROUP[fullEx.primaryMuscleGroup] === MUSCLE_TO_GENERAL_GROUP[m]
                 );
        });

        if (!hasCompound) {
          logger.info("🔍 DEBUG BRO SPLIT: нет COMPOUND на основную мышцу, добираем forced");
          
          const fallbackCandidates = fallbackLevelFiltered
            .filter(ex =>
              ex.exerciseCategory === "COMPOUND" &&
              dayMainMuscles.some(m =>
                (ex.primaryMuscleGroup as string) === m ||
                MUSCLE_TO_GENERAL_GROUP[ex.primaryMuscleGroup] === MUSCLE_TO_GENERAL_GROUP[m]
              ) &&
              !finalPlan.some(fp => fp.exerciseId === ex.id) &&
              leastFavoriteIdsForFallback.has(ex.id)
            )
            .sort(() => Math.random() - 0.5)
            .slice(0, 2);
          
          for (const ex of fallbackCandidates) {
            finalPlan.push({
              ...this.toExerciseSet(ex, false, difficulty),
              forced: true,
              forcedReason: "all_excluded"
            });
          }
        }
      }

      // ── FALLBACK: если план совсем пустой — перегенерируем полностью ──
      if (finalPlan.length < 3) {
        logger.info("🔍 DEBUG FALLBACK: план пустой, игнорируем нелюбимые");

        const fallbackSelectedIds = new Set<string>();

        const fallbackBig5 = this.selectBig5(fallbackLevelFiltered, dayType, difficulty, experienceLevel, trainingSplit);
        fallbackBig5.forEach((ex) => fallbackSelectedIds.add(ex.exerciseId));

        const fallbackTargetMuscles = DAY_MUSCLE_GROUPS[dayType] || [];
        const fallbackCoveredGroups = new Set(
          fallbackBig5.map((ex) => MUSCLE_TO_GENERAL_GROUP[ex.muscleGroup || ""] || ex.muscleGroup).filter(Boolean),
        );
        const fallbackUncovered = trainingSplit === "BRO_SPLIT"
          ? fallbackTargetMuscles
          : fallbackTargetMuscles.filter((m) => !fallbackCoveredGroups.has(MUSCLE_TO_GENERAL_GROUP[m] || m));

        const fallbackIsolation = this.selectIsolation(
          fallbackLevelFiltered.filter((ex) => !fallbackSelectedIds.has(ex.id)),
          fallbackUncovered,
          difficulty,
          dayType,
          gender,
          goal,
          age,
          trainingSplit,
          fallbackBig5,
          favorites.filter((f) => !leastFavoriteIds.has(f.id)),
        );
        fallbackIsolation.forEach((ex) => fallbackSelectedIds.add(ex.exerciseId));

        const fallbackAccessories = this.selectAccessories(
          fallbackLevelFiltered.filter((ex) => !fallbackSelectedIds.has(ex.id)),
          accessoryCount,
        );

        let fallbackMainPlan = [...fallbackBig5, ...fallbackIsolation];
        fallbackMainPlan = fallbackMainPlan.slice(0, maxTotal);
        finalPlan = [...fallbackMainPlan, ...fallbackAccessories];

        // Помечаем упражнения, которые были в нелюбимых, как forced
        finalPlan = finalPlan.map((ex) => {
          if (leastFavoriteIdsForFallback.has(ex.exerciseId)) {
            return { ...ex, forced: true, forcedReason: "all_excluded" };
          }
          return ex;
        });
      }

      finalPlan = this.smartSort(finalPlan);
      finalPlan = this.applyProgression(finalPlan, wellbeing, week, lifestyle, gender, trainingSplit);

      logger.info("🔍 DEBUG FINAL PLAN", {
        total: finalPlan.length,
        exercises: finalPlan.map((e) => e.muscleGroup),
        forced: finalPlan.filter((e) => e.forced).map((e) => e.muscleGroup),
      });

      return Result.ok(finalPlan);
    } catch (error) {
      logger.error("💥 ExerciseSelector ERROR", { error: String(error) });
      return Result.error(new EntityValidationError(["Ошибка подбора упражнений"]));
    }
  }

  /**
   * Генерация для HYPERTROPHY_FOCUS (бодибилдинг).
   * Большой объём: 3-4 compound + 3-4 isolation + аксессуары.
   * Избранное в приоритете, нелюбимые → forced.
   */
    private generateHypertrophyDay(
    exercises: ExerciseEntity[],
    fallbackExercises: ExerciseEntity[],
    dayType: "chest" | "back" | "shoulders" | "legs" | "arms",
    difficulty: Difficulty,
    favorites: ExerciseEntity[],
    leastFavoriteIds: Set<string>,
  ): ExerciseSet[] {
    const configs: Record<string, {
      compounds: Array<{ pattern: string; muscle: string; count: number }>;
      isolations: Array<{ muscle: string; count: number; strictPrimary?: boolean }>;
    }> = {
      chest: {
        compounds: [{ pattern: "PUSH", muscle: "CHEST", count: 4 }],
        isolations: [
          { muscle: "CHEST_UPPER", count: 2 },
          { muscle: "CHEST_MIDDLE", count: 2 },
        ],
      },
      back: {
        compounds: [
          { pattern: "PULL", muscle: "BACK", count: 3 },
          { pattern: "HINGE", muscle: "BACK", count: 1 },
        ],
        isolations: [
          { muscle: "LATS", count: 2 },
          { muscle: "RHOMBOIDS_UPPER", count: 1 },
          { muscle: "BACK", count: 1 },
        ],
      },
      shoulders: {
        compounds: [{ pattern: "PUSH", muscle: "SHOULDERS", count: 4 }],
        isolations: [
          { muscle: "DELTOIDS_MEDIAL", count: 2 },
          { muscle: "DELTOIDS_POSTERIOR", count: 2 },
        ],
      },
      legs: {
        compounds: [
          { pattern: "SQUAT", muscle: "LEGS", count: 4 },
          { pattern: "HINGE", muscle: "LEGS", count: 2 },
        ],
        isolations: [
          { muscle: "QUADS_RECTUS_FEMORIS", count: 2 },
          { muscle: "HAMSTRINGS", count: 2 },
          { muscle: "CALVES_GASTROCNEMIUS", count: 2 },
        ],
      },
      arms: {
        compounds: [
          { pattern: "PULL", muscle: "ARMS", count: 2 },
          { pattern: "PUSH", muscle: "ARMS", count: 2 },
        ],
        isolations: [
          { muscle: "BICEPS_LONG_HEAD", count: 2, strictPrimary: true },
          { muscle: "BICEPS_SHORT_HEAD", count: 1, strictPrimary: true },
          { muscle: "TRICEPS_LONG_HEAD", count: 2, strictPrimary: true },
          { muscle: "TRICEPS_LATERAL_HEAD", count: 1, strictPrimary: true },
        ],
      },
    };

    const config = configs[dayType];
    const result: ExerciseSet[] = [];
    const usedIds = new Set<string>();

    const findCompound = (pool: ExerciseEntity[], pattern: string, muscle: string, count: number): ExerciseEntity[] => {
      return pool
        .filter(ex =>
          !usedIds.has(ex.id) &&
          ex.exerciseCategory === "COMPOUND" &&
          this.matchesMuscle(ex, muscle) &&
          this.hasMovementPattern(ex, pattern) &&
          this.isSuitableDifficulty(ex, difficulty),
        )
        .sort((a, b) => {
          const aFav = favorites.some(f => f.id === a.id) ? 0 : 1;
          const bFav = favorites.some(f => f.id === b.id) ? 0 : 1;
          if (aFav !== bFav) return aFav - bFav;
          return Math.random() - 0.5;
        })
        .slice(0, count);
    };

    const findIsolation = (pool: ExerciseEntity[], muscle: string, count: number, strictPrimary = false): ExerciseEntity[] => {
      return pool
        .filter(ex =>
          !usedIds.has(ex.id) &&
          ex.exerciseCategory === "ISOLATION" &&
          (!strictPrimary ||
           (ex.primaryMuscleGroup as string) === muscle ||
           (ex.primaryMuscleGroup === "ARMS" && ["BICEPS_LONG_HEAD", "BICEPS_SHORT_HEAD", "TRICEPS_LONG_HEAD", "TRICEPS_LATERAL_HEAD", "TRICEPS_MEDIAL_HEAD"].includes(muscle))) &&
          this.matchesMuscle(ex, muscle) &&
          this.isSuitableDifficulty(ex, difficulty),
        )
        .sort((a, b) => {
          const aFav = favorites.some(f => f.id === a.id) ? 0 : 1;
          const bFav = favorites.some(f => f.id === b.id) ? 0 : 1;
          if (aFav !== bFav) return aFav - bFav;
          return Math.random() - 0.5;
        })
        .slice(0, count);
    };

    const addExercise = (exs: ExerciseEntity[], forced: boolean) => {
      for (const ex of exs) {
        usedIds.add(ex.id);
        const es = this.toExerciseSet(ex, favorites.some(f => f.id === ex.id), difficulty);
        result.push(forced ? { ...es, forced: true, forcedReason: "all_excluded" } : es);
      }
    };

    // 1️⃣ COMPOUND
    for (const comp of config.compounds) {
      let found = findCompound(exercises, comp.pattern, comp.muscle, comp.count);
      const forcedCount = comp.count - found.length;
      if (forcedCount > 0) {
        const fallback = findCompound(fallbackExercises, comp.pattern, comp.muscle, forcedCount);
        found = [...found, ...fallback];
      }
      for (const ex of found) {
        const isForced = !exercises.some(e => e.id === ex.id);
        addExercise([ex], isForced);
      }
    }

    // 2️⃣ ISOLATION
    for (const iso of config.isolations) {
      let found = findIsolation(exercises, iso.muscle, iso.count, iso.strictPrimary || false);
      const forcedCount = iso.count - found.length;
      if (forcedCount > 0) {
        const fallback = findIsolation(fallbackExercises, iso.muscle, forcedCount, iso.strictPrimary || false);
        found = [...found, ...fallback];
      }
      for (const ex of found) {
        const isForced = !exercises.some(e => e.id === ex.id);
        addExercise([ex], isForced);
      }
    }

    return result;
  }

  /**
   * Генерация для STRENGTH_FOCUS (пауэрлифтинг).
   * Жёсткая структура: главное упражнение → подсобка → добивка.
   * Если главное/подсобка в нелюбимых — ищет замену, потом forced.
   * Избранное — приоритет.
   */
  private generateStrengthDay(
    exercises: ExerciseEntity[],
    fallbackExercises: ExerciseEntity[],
    dayType: "squat" | "bench" | "deadlift" | "ohp",
    difficulty: Difficulty,
    favorites: ExerciseEntity[],
    leastFavoriteIds: Set<string>,
  ): ExerciseSet[] {
    const configs: Record<string, {
      main: { pattern: string; muscle: string; count: number };
      assistance: Array<{ pattern: string; muscle: string; count: number }>;
      isolation: Array<{ muscle: string; count: number }>;
    }> = {
      squat: {
        main: { pattern: "SQUAT", muscle: "LEGS", count: 1 },
        assistance: [
          { pattern: "SQUAT", muscle: "LEGS", count: 3 },    // 3 подсобных приседательных
          { pattern: "HINGE", muscle: "LEGS", count: 1 },    // 1 румынская
        ],
        isolation: [{ muscle: "LEGS", count: 1 }, { muscle: "CALVES_GASTROCNEMIUS", count: 1 }, { muscle: "CALVES_SOLEUS", count: 1 }],
      },
      bench: {
        main: { pattern: "PUSH", muscle: "CHEST", count: 1 },
        assistance: [
          { pattern: "PUSH", muscle: "CHEST", count: 2 },    // 2 подсобных жима
          { pattern: "PUSH", muscle: "SHOULDERS", count: 2 }, // 2 жима на плечи
        ],
        isolation: [{ muscle: "TRICEPS_LONG_HEAD", count: 2 }],
      },
      deadlift: {
        main: { pattern: "HINGE", muscle: "BACK", count: 1 },
        assistance: [
          { pattern: "PULL", muscle: "BACK", count: 3 },     // 3 тяги
          { pattern: "HINGE", muscle: "LEGS", count: 1 },    // 1 румынская
        ],
        isolation: [{ muscle: "BACK", count: 1 }, { muscle: "BICEPS_LONG_HEAD", count: 1 }],
      },
      ohp: {
        main: { pattern: "PUSH", muscle: "SHOULDERS", count: 1 },
        assistance: [
          { pattern: "PUSH", muscle: "SHOULDERS", count: 2 }, // 2 подсобных жима на плечи
          { pattern: "PUSH", muscle: "CHEST", count: 2 },     // 2 жима на грудь
        ],
        isolation: [{ muscle: "SHOULDERS", count: 1 }, { muscle: "TRICEPS_LONG_HEAD", count: 1 }],
      },
    };

    const config = configs[dayType];
    const result: ExerciseSet[] = [];
    const usedIds = new Set<string>();

    const findCompound = (
      pool: ExerciseEntity[], pattern: string, muscle: string, count: number,
    ): ExerciseEntity[] => {
      return pool
        .filter(ex =>
          !usedIds.has(ex.id) &&
          ex.exerciseCategory === "COMPOUND" &&
          this.matchesMuscle(ex, muscle) &&
          this.hasMovementPattern(ex, pattern) &&
          this.isSuitableDifficulty(ex, difficulty),
        )
        .sort((a, b) => {
          // Приоритет: HARD → MEDIUM → EASY (для главного)
          const diffOrder: Record<string, number> = { HARD: 0, MEDIUM: 1, EASY: 2 };
          const aDiff = diffOrder[a.difficulty as string] ?? 1;
          const bDiff = diffOrder[b.difficulty as string] ?? 1;
          if (aDiff !== bDiff) return aDiff - bDiff;
          // Избранное
          const aFav = favorites.some((f: ExerciseEntity) => f.id === a.id) ? 0 : 1;
          const bFav = favorites.some((f: ExerciseEntity) => f.id === b.id) ? 0 : 1;
          if (aFav !== bFav) return aFav - bFav;
          return Math.random() - 0.5;
        })
        .slice(0, count);
    };

    /** Поиск ISOLATION по мышце */
    const findIsolation = (pool: ExerciseEntity[], muscle: string, count: number): ExerciseEntity[] => {
      return pool
        .filter(ex =>
          !usedIds.has(ex.id) &&
          ex.exerciseCategory === "ISOLATION" &&
          this.matchesMuscle(ex, muscle) &&
          this.isSuitableDifficulty(ex, difficulty),
        )
        .sort((a, b) => {
          const aFav = favorites.some(f => f.id === a.id) ? 0 : 1;
          const bFav = favorites.some(f => f.id === b.id) ? 0 : 1;
          if (aFav !== bFav) return aFav - bFav;
          return Math.random() - 0.5;
        })
        .slice(0, count);
    };

    /** Добавить упражнение в результат с пометкой forced если нужно */
    const addExercise = (exs: ExerciseEntity[], forced: boolean) => {
      for (const ex of exs) {
        usedIds.add(ex.id);
        const es = this.toExerciseSet(ex, favorites.some(f => f.id === ex.id), difficulty);
        result.push(forced ? { ...es, forced: true, forcedReason: "strength_focus" } : es);
      }
    };

    // 1️⃣ ГЛАВНОЕ УПРАЖНЕНИЕ
    let main = findCompound(exercises, config.main.pattern, config.main.muscle, config.main.count);
    if (main.length === 0) {
      main = findCompound(fallbackExercises, config.main.pattern, config.main.muscle, config.main.count);
      addExercise(main, true);
    } else {
      addExercise(main, false);
    }

    // 2️⃣ ПОДСОБКА (COMPOUND)
    for (const assist of config.assistance) {
      let found = findCompound(exercises, assist.pattern, assist.muscle, assist.count);
      const forcedCount = assist.count - found.length;
      if (forcedCount > 0) {
        const fallback = findCompound(fallbackExercises, assist.pattern, assist.muscle, forcedCount);
        found = [...found, ...fallback];
      }
      for (const ex of found) {
        const isForced = !exercises.some(e => e.id === ex.id);
        addExercise([ex], isForced);
      }
    }

    // 3️⃣ ДОБИВКА (ISOLATION)
    for (const iso of config.isolation) {
      let found = findIsolation(exercises, iso.muscle, iso.count);
      const forcedCount = iso.count - found.length;
      if (forcedCount > 0) {
        const fallback = findIsolation(fallbackExercises, iso.muscle, forcedCount);
        found = [...found, ...fallback];
      }
      for (const ex of found) {
        const isForced = !exercises.some(e => e.id === ex.id);
        addExercise([ex], isForced);
      }
    }

    return result;
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
   *   2. Primary-упражнения (где мышца основная)
   *   3. ISOLATION перед COMPOUND
   * 
   * Для BRO SPLIT: chest/back/legs разрешают secondary (трицепс в жимах, бицепс в тягах).
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

      // BRO SPLIT: для грудного/спины/ног — secondary разрешены
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

          // 2. Primary — вперёд
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
        (ex.primaryMuscleGroup === "CORE" ||
         accessoryMuscles.includes(ex.primaryMuscleGroup as string))
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
   * Для PPL проверяет, что упражнение соответствует типу дня по паттерну.
   * PUSH → только PUSH, PULL → PULL/HINGE, LEGS → SQUAT/HINGE.
   * Остальные сплиты — без ограничений.
   */
  private matchesDayPattern(exercise: ExerciseEntity, dayType: DayType): boolean {
    const patterns = exercise.movementPatterns || [];
    if (dayType === "push") return patterns.includes("PUSH" as any);
    if (dayType === "pull") return patterns.some(p => p === "PULL" || p === "HINGE");
    if (dayType === "legs") return patterns.some(p => p === "SQUAT" || p === "HINGE");
    return true;
  }

  /**
   * Проверяет, что primaryMuscleGroup и целевая общая группа совместимы.
   * Учитывает анатомические связи: CHEST→TRICEPS, BACK→BICEPS, LEGS→HAMSTRINGS и т.д.
   * Для дня рук (BRO SPLIT) связи CHEST→TRICEPS и BACK→BICEPS отключены.
   */
  private isSameGeneralGroup(primary: string, targetGroup: string, dayType?: DayType): boolean {
    if (primary === "ARMS" && (targetGroup === "BICEPS" || targetGroup === "TRICEPS")) return true;
    if (primary === "CHEST" && targetGroup === "TRICEPS" && dayType !== "arms") return true;
    if (primary === "BACK" && targetGroup === "BICEPS" && dayType !== "arms") return true;
    if (primary === "LEGS" && ["LEGS", "HAMSTRINGS", "GLUTES", "CALVES"].includes(targetGroup)) return true;
    if (primary === "CORE" && targetGroup === "CORE") return true;
    if (primary === "ARMS" && targetGroup === "FOREARMS") return true;
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
      const isSquatOrHinge = (ex.movementPatterns || []).some((p) => p === "SQUAT" || p === "HINGE");
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
    let max: number;
    if (difficulty === "EASY") max = 6;
    else if (difficulty === "HARD") max = 10;
    else max = 8;

    if (dayType === "full" || dayType === "upper" || dayType === "lower") max += 2;
    else if (["chest", "back", "shoulders", "arms"].includes(dayType)) max += 2;

    if (["squat", "bench", "deadlift", "ohp"].includes(dayType)) max += 2;

    return max;
  }

  private calculateDifficulty(
    bmi: number, goal: Goal, age: number, lifestyle: Lifestyle,
    gender: Gender, dayType: DayType,
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
      squat: 10, bench: 8, deadlift: 10, ohp: 8,
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
    trainingSplit: TrainingSplit, // ← добавить
  ): ExerciseSet[] {
    const genderMultiplier = gender === Gender.Female ? 0.85 : 1.0;
    const lifestyleMultiplier: Record<string, number> = {
      IMMOBILE: 0.75, LIGHT: 0.9, AVERAGE: 1.0, HARD: 1.15,
    };
    // HYPERTROPHY_FOCUS: +1 подход ко всем упражнениям
    const hypertrophyBonus = trainingSplit === "HYPERTROPHY_FOCUS" ? 1 : 0;
    
    return exercises.map((ex) => {
      let sets = ex.sets + hypertrophyBonus;
      const wellbeingCoeff = wellbeing === "BAD" ? 0.8 : wellbeing === "GOOD" ? 1.2 : 1.0;
      sets = Math.round(sets * wellbeingCoeff * genderMultiplier * (lifestyleMultiplier[lifestyle] || 1.0));
      sets = Math.max(2, Math.min(5, sets));
      return { ...ex, sets, targetRepsRange: ex.targetRepsRange };
    });
  }
}
