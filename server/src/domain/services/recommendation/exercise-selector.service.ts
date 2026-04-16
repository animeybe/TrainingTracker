// domain/services/recommendation/exercise-selector.service.ts
import {
  Difficulty,
  Goal,
  Lifestyle,
  MuscleGroup,
} from "../../../common/types/enums.types";
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

export class ExerciseSelectorService {
  generateDay(
    dayType: DayType,
    favorites: ExerciseEntity[],
    allExercises: ExerciseEntity[],
    bmi: number,
    goal: Goal,
    age: number,
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
        dayType,
      );
      const targetMuscles = DAY_MUSCLE_GROUPS[dayType];

      // 1️⃣ ЛЮБИМЫЕ (всегда первыми)
      const favoriteExercises = this.selectFavoritesPRO(
        favorites,
        targetMuscles,
        difficulty,
      );

      // 2️⃣ BIG 5 + ОСНОВНЫЕ
      const coveredMuscles = new Set(
        favoriteExercises.map((ex) => ex.muscleGroup!),
      );
      const uncoveredMuscles = targetMuscles.filter(
        (m) => !coveredMuscles.has(m),
      );

      const mainExercises = this.selectMainPRO(
        allExercises,
        uncoveredMuscles,
        difficulty,
        dayType,
        dayInCycle,
        lifestyle,
      );

      // 3️⃣ АКСЕССУАРЫ (всегда в конце)
      const accessoryExercises = this.selectAccessoriesPRO(
        allExercises,
        difficulty,
      );

      // ✅ СОБИРАЕМ + СОРТИРОВКА
      let finalPlan = [
        ...favoriteExercises,
        ...mainExercises,
        ...accessoryExercises,
      ].slice(0, 15);

      finalPlan = this.smartSort(finalPlan, dayType);
      finalPlan = this.applyProProgression(
        finalPlan,
        wellbeing,
        week,
        lifestyle,
      );

      return Result.ok(finalPlan);
    } catch (error) {
      logger.error("💥 Selector ERROR", { error: String(error) });
      return Result.error(new EntityValidationError(["Ошибка подбора"]));
    }
  }

  /** 1️⃣ ЛЮБИМЫЕ - с приоритетом по compound */
  private selectFavoritesPRO(
    favorites: ExerciseEntity[],
    targetMuscles: MuscleGroup[],
    difficulty: Difficulty,
  ): ExerciseSet[] {
    return favorites
      .filter((fav) =>
        targetMuscles.some((muscle) => this.matchesMuscle(fav, muscle)),
      )
      .filter((fav) => this.isSuitableDifficulty(fav, difficulty))
      .sort(
        (a, b) =>
          this.getExercisePriority(a, "AVERAGE") -
          this.getExercisePriority(b, "AVERAGE"),
      )
      .slice(0, 5)
      .map((ex) => this.toExerciseSet(ex, true, difficulty));
  }

  /** 2️⃣ BIG 5 + Muscle Fatigue + ANTI-OVERLAP */
  private selectMainPRO(
    exercises: ExerciseEntity[],
    targetMuscles: MuscleGroup[],
    difficulty: Difficulty,
    dayType: DayType,
    dayInCycle: number,
    lifestyle: Lifestyle,
  ): ExerciseSet[] {
    // BIG 5 первыми
    const big5 = this.getBig5ForDay(dayType);
    const big5Exercises = exercises
      .filter((ex) => big5.includes(ex.id))
      .filter((ex) => targetMuscles.some((m) => this.matchesMuscle(ex, m)))
      .filter((ex) => this.isSuitableDifficulty(ex, difficulty))
      .map((ex) => this.toExerciseSet(ex, false, difficulty));

    // Остальные с fatigue
    const remaining = exercises
      .filter((ex) => !big5.includes(ex.id))
      .filter((ex) => targetMuscles.some((m) => this.matchesMuscle(ex, m)))
      .filter((ex) => this.isSuitableDifficulty(ex, difficulty))
      .filter((ex) => this.preventOverlap(ex))
      .sort((a, b) => {
        const aFatigue = this.getMuscleFatigue(
          a.secondaryMuscles[0],
          dayInCycle,
        );
        const bFatigue = this.getMuscleFatigue(
          b.secondaryMuscles[0],
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
  ): ExerciseSet[] {
    const accessoryMuscles: MuscleGroup[] = [
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
      .sort(
        (a, b) =>
          this.getAccessoryPriority(a.secondaryMuscles[0]!) -
          this.getAccessoryPriority(b.secondaryMuscles[0]!),
      )
      .slice(0, 4)
      .map((ex) => this.toExerciseSet(ex, false, difficulty));
  }

  /** 🔥 СОРТИРОВКА: сложные→легкие | аксессуары в конце */
  private smartSort(exercises: ExerciseSet[], dayType: DayType): ExerciseSet[] {
    const mainExercises = exercises.filter(
      (ex) => !this.isAccessory(ex.muscleGroup!),
    );
    const accessories = exercises.filter((ex) =>
      this.isAccessory(ex.muscleGroup!),
    );

    // Основные: СЛОЖНЫЕ → ЛЕГКИЕ
    const sortedMain = mainExercises.sort((a, b) => {
      const aScore = this.getExerciseDifficultyScore(a);
      const bScore = this.getExerciseDifficultyScore(b);
      return bScore - aScore;
    });

    // Аксессуары: пресс→икры→предплечья
    const sortedAccessories = accessories.sort(
      (a, b) =>
        this.getAccessoryPriority(a.muscleGroup!) -
        this.getAccessoryPriority(b.muscleGroup!),
    );

    return [...sortedMain, ...sortedAccessories];
  }

  /** 🔥 ПРОГРЕССИЯ + ADAPTIVE VOLUME */
  private applyProProgression(
    exercises: ExerciseSet[],
    wellbeing: "BAD" | "NORMAL" | "GOOD",
    week: number,
    lifestyle: Lifestyle,
  ): ExerciseSet[] {
    return exercises.map((ex) => {
      let sets = ex.sets;
      const reps: [number, number] = [
        ex.targetRepsRange[0],
        ex.targetRepsRange[1],
      ];

      // Adaptive volume
      const adaptive = this.getAdaptiveVolume(ex.muscleGroup!, lifestyle);
      const difficulty_coefficient = 0.2;
      sets = Math.round(
        adaptive.sets *
          (wellbeing === "BAD"
            ? 1.0 - difficulty_coefficient
            : wellbeing === "GOOD"
              ? 1.0 + difficulty_coefficient
              : 1.0),
      );

      // Progression (по 1 сету каждые 4 недели до максимума 5)
      const progressionSets = Math.min(5, ex.sets + Math.floor((week - 1) / 4));
      sets = Math.max(2, Math.min(5, sets));

      return {
        ...ex,
        sets,
        targetRepsRange: reps,
        progression: {
          baseSets: ex.sets,
          baseReps: ex.targetRepsRange,
          currentSets: sets,
          weekOffset: Math.floor((week - 1) / 4),
          wellbeingAdjusted: wellbeing !== "NORMAL",
          adaptiveSets: adaptive.sets,
        },
      };
    });
  }

  // ================== НАУЧНЫЕ МЕТОДЫ ==================

  private getBig5ForDay(dayType: DayType): readonly string[] {
    return SELECTOR_CONFIG.bigFive[dayType] || [];
  }

  private getMuscleFatigue(muscle: MuscleGroup, dayInCycle: number): number {
    const fatigueCycle = SELECTOR_CONFIG.fatigue[muscle];
    return fatigueCycle?.[dayInCycle % 3] ?? 1.0;
  }

  private getAdaptiveVolume(
    muscle: MuscleGroup,
    lifestyle: Lifestyle,
  ): { sets: number } {
    const base = SELECTOR_CONFIG.volumes[muscle] ?? 3;
    const multiplier =
      lifestyle === "HARD" ? 1.2 : lifestyle === "IMMOBILE" ? 0.7 : 1.0;
    return { sets: Math.round(base * multiplier) };
  }

  private preventOverlap(exercise: ExerciseEntity): boolean {
    const highRisk = ["DELTOIDS", "ERECTOR_SPINAE"];
    return !highRisk.some(
      (risk) =>
        (exercise.secondaryMuscles || []).filter((m) => m.includes(risk))
          .length > 1,
    );
  }

  private getExercisePriority(
    exercise: ExerciseEntity,
    lifestyle: Lifestyle,
  ): number {
    const bigLiftIds = SELECTOR_CONFIG.bigFive.full;
    const isBigLift = bigLiftIds.includes(exercise.id) ? 50 : 0;

    const difficultyScore =
      exercise.difficulty === "HARD"
        ? 20
        : exercise.difficulty === "MEDIUM"
          ? 10
          : 0;

    return isBigLift + difficultyScore;
  }

  private getAccessoryPriority(muscle: MuscleGroup): number {
    return SELECTOR_CONFIG.accessoryPriority[muscle] ?? 5;
  }

  private isAccessory(muscle: MuscleGroup): boolean {
    return ["ABS", "CALVES", "FOREARMS", "TRAPEZIUS"].some((g) =>
      muscle.includes(g),
    );
  }

  private getExerciseDifficultyScore(exerciseSet: ExerciseSet): number {
    const [minReps, maxReps] = exerciseSet.targetRepsRange;
    const avgReps = (minReps + maxReps) / 2;
    return 15 - avgReps; // меньше повторений → выше score → сложнее
  }

  // ✅ Helper методы
  private matchesMuscle(
    exercise: ExerciseEntity,
    muscle: MuscleGroup,
  ): boolean {
    return (exercise.secondaryMuscles || []).some(
      (mg: MuscleGroup) => mg === muscle,
    );
  }

  private isSuitableDifficulty(
    exercise: ExerciseEntity,
    userDifficulty: Difficulty,
  ): boolean {
    const exDifficulty = exercise.difficulty || "MEDIUM";
    return this.isDifficultyCompatible(exDifficulty, userDifficulty);
  }

  private isDifficultyCompatible(
    exDiff: Difficulty,
    userDiff: Difficulty,
  ): boolean {
    return (
      exDiff === userDiff ||
      (userDiff === "HARD" && (exDiff === "MEDIUM" || exDiff === "EASY")) ||
      (userDiff === "MEDIUM" && exDiff === "EASY")
    );
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
        exercise.secondaryMuscles?.[0] || ("CHEST_MIDDLE" as MuscleGroup),
      warning: this.generateWarning(exercise, difficulty),
      progression: {
        baseSets,
        baseReps,
        weekOffset: 0,
      },
    };
  }

  private getBaseReps(difficulty: Difficulty): [number, number] {
    const repsMap: Record<Difficulty, [number, number]> =
      SELECTOR_CONFIG.baseReps;
    return repsMap[difficulty] || [10, 12];
  }

  private getBaseSets(exercise: ExerciseEntity): number {
    const primaryMuscles: MuscleGroup[] = [
      "QUADS_RECTUS_FEMORIS",
      "LATS",
      "CHEST_MIDDLE",
    ];
    return primaryMuscles.some((m) => this.matchesMuscle(exercise, m)) ? 4 : 3;
  }

  private generateWarning(
    exercise: ExerciseEntity,
    difficulty: Difficulty,
  ): string | undefined {
    if (difficulty === "EASY" && exercise.difficulty === "HARD")
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
    dayType: DayType,
  ): Difficulty {
    let score = 0;

    if (bmi < 18.5) score -= 15;
    else if (bmi > 30) score += 20;

    if (age > 50) score += 18;
    else if (age < 18) score -= 12;

    if (goal === "LOSE_FAT") score += 10;

    const recoveryPenalty = SELECTOR_CONFIG.recoveryPenalty[lifestyle] || 0;
    score += recoveryPenalty;

    const dayDiff = SELECTOR_CONFIG.dayDifficulty[dayType] || 0;
    score += dayDiff;

    return score <= -15 ? "EASY" : score >= 20 ? "HARD" : "MEDIUM";
  }
}
