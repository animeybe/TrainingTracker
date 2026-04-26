// domain/services/recommendation/exercise-selector.service.ts
import { ExerciseEntity } from "../../entities/exercise.entity";
import { EntityValidationError } from "../../common";
import {
  DayType,
  ExerciseSet,
  DAY_MUSCLE_GROUPS,
} from "../../types/training.types";
import { logger } from "../../../common/utils/logger";
import { SELECTOR_CONFIG } from "../../config/selector.config";
import { Result } from "../../common";
import {
  Difficulty,
  Gender,
  Goal,
  Lifestyle,
  MuscleGroup,
} from "@prisma/client";

export class ExerciseSelectorService {
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
  ): Result<ExerciseSet[]> {
    try {
      const difficulty = this.calculateDifficulty(
        bmi,
        goal,
        age,
        lifestyle,
        gender,
        dayType,
      );
      const targetMuscles = DAY_MUSCLE_GROUPS[dayType];

      // Исключаем нелюбимые
      const leastFavoriteIds = new Set(leastFavorites.map((ex) => ex.id));
      const availableExercises = allExercises.filter(
        (ex) => !leastFavoriteIds.has(ex.id),
      );
      const availableFavorites = favorites.filter(
        (ex) => !leastFavoriteIds.has(ex.id),
      );

      // 1️⃣ ЛЮБИМЫЕ
      const favoriteExercises = this.selectFavoritesPRO(
        availableFavorites,
        targetMuscles,
        difficulty,
        gender,
      );

      // Собираем ID выбранных
      const selectedIds = new Set(favoriteExercises.map((ex) => ex.exerciseId));

      // 2️⃣ ОСНОВНЫЕ
      const coveredMuscles = new Set(
        favoriteExercises.map((ex) => ex.muscleGroup!),
      );
      const uncoveredMuscles = targetMuscles.filter(
        (m) => !coveredMuscles.has(m),
      );

      const mainExercises = this.selectMainPRO(
        availableExercises.filter((ex) => !selectedIds.has(ex.id)),
        uncoveredMuscles,
        difficulty,
        dayType,
        dayInCycle,
      );

      // Добавляем ID основных
      mainExercises.forEach((ex) => selectedIds.add(ex.exerciseId));

      // 3️⃣ АКСЕССУАРЫ
      const accessoryExercises = this.selectAccessoriesPRO(
        availableExercises.filter((ex) => !selectedIds.has(ex.id)),
        difficulty,
        gender,
      );

      // 4️⃣ СБОРКА
      let finalPlan = [
        ...favoriteExercises,
        ...mainExercises,
        ...accessoryExercises,
      ].slice(0, this.getMaxExercisesPerDay(difficulty));

      finalPlan = this.smartSort(finalPlan, dayType, gender);
      finalPlan = this.applyProProgression(
        finalPlan,
        wellbeing,
        week,
        lifestyle,
        gender,
      );

      return Result.ok(finalPlan);
    } catch (error) {
      logger.error("💥 Selector ERROR", { error: String(error) });
      return Result.error(
        new EntityValidationError(["Ошибка подбора упражнений"]),
      );
    }
  }

  // Максимум упражнений в день
  private getMaxExercisesPerDay(difficulty: Difficulty): number {
    return difficulty === "EASY" ? 8 : difficulty === "MEDIUM" ? 10 : 12;
  }

  /** 1️⃣ ЛЮБИМЫЕ */
  private selectFavoritesPRO(
    favorites: ExerciseEntity[],
    targetMuscles: MuscleGroup[],
    difficulty: Difficulty,
    gender: Gender,
  ): ExerciseSet[] {
    return favorites
      .filter((fav) =>
        targetMuscles.some((muscle) => this.matchesMuscle(fav, muscle)),
      )
      .filter((fav) => this.isSuitableDifficulty(fav, difficulty))
      .sort(
        (a, b) =>
          this.getExercisePriority(a, gender) -
          this.getExercisePriority(b, gender),
      )
      .slice(0, 5)
      .map((ex) => this.toExerciseSet(ex, true, difficulty));
  }

  /** 2️⃣ ОСНОВНЫЕ */
  private selectMainPRO(
    exercises: ExerciseEntity[],
    targetMuscles: MuscleGroup[],
    difficulty: Difficulty,
    dayType: DayType,
    dayInCycle: number,
  ): ExerciseSet[] {
    const big5Names = SELECTOR_CONFIG.bigFiveNames[dayType] || [];

    // BIG5 — фильтруем по primaryMuscleGroup (целевая мышца дня)
    const big5Exercises = exercises
      .filter((ex) => big5Names.includes(ex.name))
      .filter((ex) => targetMuscles.some((m) => this.isPrimaryMuscle(ex, m)))
      .filter((ex) => this.isSuitableDifficulty(ex, difficulty))
      .map((ex) => this.toExerciseSet(ex, false, difficulty));

    const selectedIds = new Set(big5Exercises.map((ex) => ex.exerciseId));

    // Остальные — только primaryMuscleGroup, без дубликатов
    const remaining = exercises
      .filter((ex) => !selectedIds.has(ex.id))
      .filter((ex) => targetMuscles.some((m) => this.isPrimaryMuscle(ex, m)))
      .filter((ex) => this.isSuitableDifficulty(ex, difficulty))
      .sort((a, b) => {
        const aFatigue = this.getMuscleFatigue(
          a.secondaryMuscles[0] || (a.primaryMuscleGroup as any),
          dayInCycle,
        );
        const bFatigue = this.getMuscleFatigue(
          b.secondaryMuscles[0] || (b.primaryMuscleGroup as any),
          dayInCycle,
        );
        return bFatigue - aFatigue;
      })
      .slice(0, 4)
      .map((ex) => this.toExerciseSet(ex, false, difficulty));

    return [...big5Exercises, ...remaining];
  }

  /** 3️⃣ АКСЕССУАРЫ */
  private selectAccessoriesPRO(
    exercises: ExerciseEntity[],
    difficulty: Difficulty,
    gender: Gender,
  ): ExerciseSet[] {
    const accessoryMuscles: MuscleGroup[] =
      gender === Gender.Female
        ? [
            "GLUTES_MAXIMUS",
            "GLUTES_MEDIAS",
            "ABS_UPPER",
            "ABS_LOWER",
            "OBLIQUES",
            "CALVES_GASTROCNEMIUS",
            "CALVES_SOLEUS",
          ]
        : [
            "ABS_UPPER",
            "ABS_LOWER",
            "OBLIQUES",
            "CALVES_GASTROCNEMIUS",
            "CALVES_SOLEUS",
            "FOREARMS_FLEXORS",
            "FOREARMS_EXTENSORS",
            "TRAPEZIUS_UPPER",
            "ERECTOR_SPINAE_UPPER",
          ];

    return exercises
      .filter((ex) => accessoryMuscles.some((m) => this.matchesMuscle(ex, m)))
      .filter((ex) => this.isSuitableDifficulty(ex, difficulty))
      .slice(0, 4)
      .map((ex) => this.toExerciseSet(ex, false, difficulty));
  }

  /** 🔥 СОРТИРОВКА */
  private smartSort(
    exercises: ExerciseSet[],
    dayType: DayType,
    gender: Gender,
  ): ExerciseSet[] {
    const mainExercises = exercises.filter(
      (ex) => !this.isAccessory(ex.muscleGroup!),
    );
    const accessories = exercises.filter((ex) =>
      this.isAccessory(ex.muscleGroup!),
    );

    const sortedMain = mainExercises.sort((a, b) => {
      const aScore =
        this.getExerciseDifficultyScore(a) + this.getDayTypeBonus(a, dayType);
      const bScore =
        this.getExerciseDifficultyScore(b) + this.getDayTypeBonus(b, dayType);
      return bScore - aScore;
    });

    const sortedAccessories = accessories.sort(
      (a, b) =>
        this.getAccessoryPriority(a.muscleGroup!, gender) -
        this.getAccessoryPriority(b.muscleGroup!, gender),
    );

    return [...sortedMain, ...sortedAccessories];
  }

  /** Бонус за соответствие дню */
  private getDayTypeBonus(exercise: ExerciseSet, dayType: DayType): number {
    const dayMuscles = DAY_MUSCLE_GROUPS[dayType] || [];
    if (exercise.muscleGroup && dayMuscles.includes(exercise.muscleGroup)) {
      return 5;
    }
    return 0;
  }

  /** 🔥 ПРОГРЕССИЯ */
  private applyProProgression(
    exercises: ExerciseSet[],
    wellbeing: "BAD" | "NORMAL" | "GOOD",
    week: number,
    lifestyle: Lifestyle,
    gender: Gender,
  ): ExerciseSet[] {
    const genderMultiplier = gender === Gender.Female ? 0.85 : 1.0;

    const lifestyleMultiplier =
      {
        IMMOBILE: 0.75,
        LIGHT: 0.9,
        AVERAGE: 1.0,
        HARD: 1.15,
      }[lifestyle] || 1.0;

    return exercises.map((ex) => {
      let sets = ex.sets;
      const wellbeingCoeff =
        wellbeing === "BAD" ? 0.8 : wellbeing === "GOOD" ? 1.2 : 1.0;
      const progressionSets = Math.min(5, Math.floor((week - 1) / 4));

      sets = Math.round(
        sets * wellbeingCoeff * genderMultiplier * lifestyleMultiplier,
      );
      sets = Math.max(2, Math.min(5, sets + progressionSets));

      return {
        ...ex,
        sets,
        targetRepsRange: ex.targetRepsRange,
        progression: {
          baseSets: ex.sets,
          baseReps: ex.targetRepsRange,
          currentSets: sets,
          weekOffset: Math.floor((week - 1) / 4),
          wellbeingAdjusted: wellbeing !== "NORMAL",
          lifestyleAdjusted: lifestyle !== "AVERAGE",
        },
      };
    });
  }

  // ═══════════════ HELPERS ═══════════════

  /** Проверяет только primaryMuscleGroup */
  private isPrimaryMuscle(
    exercise: ExerciseEntity,
    muscle: MuscleGroup,
  ): boolean {
    return exercise.primaryMuscleGroup === (muscle as any);
  }

  /** Проверяет и primaryMuscleGroup, и secondaryMuscles */
  private matchesMuscle(
    exercise: ExerciseEntity,
    muscle: MuscleGroup,
  ): boolean {
    if (exercise.primaryMuscleGroup === (muscle as any)) return true;
    return (exercise.secondaryMuscles || []).includes(muscle);
  }

  private isSuitableDifficulty(
    exercise: ExerciseEntity,
    userDifficulty: Difficulty,
  ): boolean {
    const exDiff = exercise.difficulty || Difficulty.MEDIUM;
    if (exDiff === userDifficulty) return true;
    if (
      userDifficulty === Difficulty.HARD &&
      (exDiff === Difficulty.MEDIUM || exDiff === Difficulty.EASY)
    )
      return true;
    if (userDifficulty === Difficulty.MEDIUM && exDiff === Difficulty.EASY)
      return true;
    return false;
  }

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
      muscleGroup:
        exercise.secondaryMuscles?.[0] || (exercise.primaryMuscleGroup as any),
      warning: this.generateWarning(exercise, difficulty),
      progression: { baseSets, baseReps, weekOffset: 0 },
    };
  }

  private getBaseSets(exercise: ExerciseEntity): number {
    const primaryMuscles = [
      "QUADS_RECTUS_FEMORIS",
      "LATS",
      "CHEST_MIDDLE",
      "GLUTES_MAXIMUS",
      "HAMSTRINGS",
    ];
    return primaryMuscles.some((m) => this.matchesMuscle(exercise, m as any))
      ? 4
      : 3;
  }

  private getBaseReps(difficulty: Difficulty): [number, number] {
    return SELECTOR_CONFIG.baseReps[difficulty] || [10, 12];
  }

  private generateWarning(
    exercise: ExerciseEntity,
    difficulty: Difficulty,
  ): string | undefined {
    if (
      difficulty === Difficulty.EASY &&
      exercise.difficulty === Difficulty.HARD
    )
      return "⚠️ Сложное! Техника важнее";
    if (exercise.secondaryMuscles?.some((m) => m.includes("ERECTOR_SPINAE")))
      return "⚠️ Спину прямо!";
    return undefined;
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

    const recoveryPenalty = SELECTOR_CONFIG.recoveryPenalty[lifestyle] || 0;
    score += recoveryPenalty;

    const dayDiff = SELECTOR_CONFIG.dayDifficulty[dayType] || 0;
    score += dayDiff;

    return score <= -15
      ? Difficulty.EASY
      : score >= 20
        ? Difficulty.HARD
        : Difficulty.MEDIUM;
  }

  private getExercisePriority(
    exercise: ExerciseEntity,
    gender: Gender,
  ): number {
    const isBigLift = SELECTOR_CONFIG.bigFiveNames.full?.includes(exercise.name)
      ? 50
      : 0;
    const difficultyScore =
      exercise.difficulty === "HARD"
        ? 20
        : exercise.difficulty === "MEDIUM"
          ? 10
          : 0;
    const genderPriority =
      gender === Gender.Female &&
      ["GLUTES_MAXIMUS", "QUADS_RECTUS_FEMORIS", "HAMSTRINGS"].some((m) =>
        this.matchesMuscle(exercise, m as any),
      )
        ? 15
        : 0;
    return isBigLift + difficultyScore + genderPriority;
  }

  private getAccessoryPriority(muscle: MuscleGroup, gender: Gender): number {
    const base = SELECTOR_CONFIG.accessoryPriority[muscle] ?? 5;
    if (gender === Gender.Female && muscle.includes("GLUTES")) return base - 3;
    return base;
  }

  private isAccessory(muscle: MuscleGroup): boolean {
    return ["ABS", "CALVES", "FOREARMS", "TRAPEZIUS"].some((g) =>
      muscle.includes(g),
    );
  }

  private getExerciseDifficultyScore(exerciseSet: ExerciseSet): number {
    const avgReps =
      (exerciseSet.targetRepsRange[0] + exerciseSet.targetRepsRange[1]) / 2;
    return 15 - avgReps;
  }

  private getMuscleFatigue(muscle: MuscleGroup, dayInCycle: number): number {
    const fatigueCycle = SELECTOR_CONFIG.fatigue[muscle];
    return fatigueCycle?.[dayInCycle % 3] ?? 1.0;
  }
}
