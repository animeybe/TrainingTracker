// domain/services/recommendation/plan-generator.service.ts
/**
 * PlanGeneratorService — генерация недельного плана тренировок.
 *
 * Логика:
 *   1. Чередование типов дней (PPL → push,pull,legs, а не push,push,pull,pull)
 *   2. Распределение дней по неделе (Пн-Сб для 6 дней, Пн-Ср-Пт для 3)
 *   3. Вызов ExerciseSelector для каждого дня
 *   4. Расчёт объёма, длительности, покрытия мышц
 *   5. Поддержка toggle-day (генерация одного дня)
 */

import {
  Difficulty,
  Gender,
  Goal,
  Lifestyle,
  MuscleGroup,
  TrainingSplit,
} from "../../../common/types/enums.types";
import { ExerciseSelectorService } from "./exercise-selector.service";
import { DifficultyCalculatorService } from "./difficulty-calculator.service";
import { VolumeCalculatorService } from "./volume-calculator.service";
import {
  DayType,
  ExerciseSet,
  DAY_MUSCLE_GROUPS,
  LocalWeekPlan,
  LocalTrainingPlan,
} from "../../common/types/training.types";
import { ExerciseEntity } from "../../entities/exercise.entity";
import { Result } from "../../common";
import { logger } from "../../../common/utils/logger";
import { TypedTrainingSplit } from "../../../common/types/rec-sys.types.types";

export class PlanGeneratorService {
  constructor(
    private exerciseSelector: ExerciseSelectorService,
    private difficultyCalc: DifficultyCalculatorService,
    private volumeCalc: VolumeCalculatorService,
  ) {}

  async generateWeeklyPlan(
    split: TypedTrainingSplit,
    favorites: ExerciseEntity[],
    leastFavorites: ExerciseEntity[],
    allExercises: ExerciseEntity[],
    userData: {
      bmi: number;
      age: number;
      goal: Goal;
      lifestyle: Lifestyle;
      weight: number;
      gender: Gender;
    },
    options: { week: number; wellbeing: "BAD" | "NORMAL" | "GOOD" } = {
      week: 1,
      wellbeing: "NORMAL",
    },
  ): Promise<Result<LocalWeekPlan>> {
    try {
      const { bmi, age, goal, lifestyle, weight, gender } = userData;
      const { week, wellbeing } = options;

      // Определяем уровень опыта
      const experience = this.calculateExperienceLevel(age, bmi, lifestyle);

      const difficulty = this.difficultyCalc.calculateOverallDifficulty(
        bmi, age, goal, lifestyle, gender,
      );

      // Чередование типов дней
      const expandedDays = this.interleaveDayTypes(split);

      // Распределение по дням недели
      const trainingDayOfWeeks = this.distributeDaysEvenly(expandedDays.length);

      // Генерация каждого дня
      const trainingDays: LocalTrainingPlan[] = await Promise.all(
        expandedDays.map(async (dayConfig, dayIndex: number) => {
          const dayOfWeek = trainingDayOfWeeks[dayIndex];
          const dayInCycle = dayIndex % 3;

          const dayBase = await this.generateDay(
            dayConfig.type,
            dayOfWeek,
            favorites,
            leastFavorites,
            allExercises,
            bmi,
            goal,
            age,
            gender,
            lifestyle,
            week,
            wellbeing,
            dayInCycle,
            difficulty,
            experience,
            split.name as TrainingSplit,
          );

          return { ...dayBase, dayOfWeek } as LocalTrainingPlan;
        }),
      );

      const plan: LocalWeekPlan = {
        week,
        split: { ...split, days: expandedDays },
        trainingDays,
        userData: {
          bmi, age, goal, lifestyle, difficulty,
          estimated1RM: this.estimate1RM(weight, experience),
          totalVolume: this.calculateTotalVolume(trainingDays),
        },
        progression: {
          weekOffset: Math.floor((week - 1) / 4),
          wellbeingAdjusted: wellbeing !== "NORMAL",
        },
        generatedAt: new Date().toISOString(),
      };

      return Result.ok(plan);
    } catch (error) {
      logger.error("💥 PlanGenerator ERROR", { error: String(error) });
      return Result.error(new Error("Ошибка генерации плана"));
    }
  }

  // ═══════════════════════════════════════════════════════════
  // ГЕНЕРАЦИЯ ОДНОГО ДНЯ
  // ═══════════════════════════════════════════════════════════

  private async generateDay(
    dayType: DayType,
    dayOfWeek: number,
    favorites: ExerciseEntity[],
    leastFavorites: ExerciseEntity[],
    allExercises: ExerciseEntity[],
    bmi: number,
    goal: Goal,
    age: number,
    gender: Gender,
    lifestyle: Lifestyle,
    week: number,
    wellbeing: "BAD" | "NORMAL" | "GOOD",
    dayInCycle: number,
    overallDifficulty: Difficulty,
    experienceLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" = "INTERMEDIATE",
    trainingSplit: TrainingSplit,
  ): Promise<LocalTrainingPlan> {
    const dayExercisesResult = this.exerciseSelector.generateDay(
      dayType,
      favorites,
      leastFavorites,
      allExercises,
      bmi,
      goal,
      age,
      gender,
      lifestyle,
      week,
      wellbeing,
      dayInCycle,
      experienceLevel,
      trainingSplit,
    );

    const exercises = dayExercisesResult.isOk ? dayExercisesResult.value! : [];

    const targetMuscles = DAY_MUSCLE_GROUPS[dayType] || [];
    const coveredMuscles = new Set(
      exercises
        .map((ex: ExerciseSet) => ex.muscleGroup)
        .filter((mg: MuscleGroup | null): mg is MuscleGroup => Boolean(mg)),
    );

    const coverage = targetMuscles.length
      ? Math.round((coveredMuscles.size / targetMuscles.length) * 100)
      : 0;

    return {
      dayType,
      dayIndex: dayInCycle,
      dayOfWeek,
      exercises,
      targetMuscles,
      coverage,
      estimatedDuration: this.estimateDuration(exercises),
      volumeLoad: this.volumeCalc.calculateDayVolume(exercises),
      warnings: this.generateDayWarnings(exercises, overallDifficulty),
    };
  }

  // ═══════════════════════════════════════════════════════════
  // TOGGLE DAY
  // ═══════════════════════════════════════════════════════════

  public async generateSingleDay(
    dayType: DayType,
    dayOfWeek: number,
    favorites: ExerciseEntity[],
    leastFavorites: ExerciseEntity[],
    allExercises: ExerciseEntity[],
    userData: {
      bmi: number; age: number; goal: Goal; lifestyle: Lifestyle;
      weight: number; gender: Gender;
    },
    options: { week: number; wellbeing: "BAD" | "NORMAL" | "GOOD" },
  ): Promise<Result<LocalTrainingPlan>> {
    try {
      const { bmi, age, goal, lifestyle, gender } = userData;
      const { week, wellbeing } = options;

      const experience = this.calculateExperienceLevel(age, bmi, lifestyle);
      const difficulty = this.difficultyCalc.calculateOverallDifficulty(
        bmi, age, goal, lifestyle, gender,
      );

      
      const dayPlan = await this.generateDay(
        dayType, dayOfWeek,
        favorites, leastFavorites, allExercises,
        bmi, goal, age, gender, lifestyle,
        week, wellbeing, dayOfWeek % 3, difficulty, experience,
	this.getSplitFromDayType(dayType),
      );

      return Result.ok(dayPlan);
    } catch (error) {
      logger.error("💥 generateSingleDay ERROR", { error: String(error) });
      return Result.error(new Error("Ошибка генерации одного дня"));
    }
  }

  // ═══════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════

  /** Чередование типов дней: push,pull,legs,push,pull,legs */
  private interleaveDayTypes(split: TypedTrainingSplit): Array<{ type: DayType; frequency: 1 }> {
    const expandedDays: Array<{ type: DayType; frequency: 1 }> = [];
    split.days.forEach((dayConfig) => {
      for (let i = 0; i < dayConfig.frequency; i++) {
        expandedDays.push({ type: dayConfig.type as DayType, frequency: 1 });
      }
    });

    if (expandedDays.length > 1) {
      const uniqueTypes = [...new Set(expandedDays.map((d) => d.type))];
      const cycles = Math.floor(expandedDays.length / uniqueTypes.length);
      const remainder = expandedDays.length % uniqueTypes.length;

      const ordered: Array<{ type: DayType; frequency: 1 }> = [];
      for (let cycle = 0; cycle < cycles; cycle++) {
        for (const type of uniqueTypes) {
          ordered.push({ type, frequency: 1 });
        }
      }
      for (let i = 0; i < remainder; i++) {
        ordered.push({ type: uniqueTypes[i], frequency: 1 });
      }

      expandedDays.length = 0;
      expandedDays.push(...ordered);
      logger.info("🔍 DEBUG interleave", { input: split.days.map(d => d.type), output: ordered.map(d => d.type) });
    }

    return expandedDays;
  }

  private distributeDaysEvenly(daysCount: number): number[] {
    switch (daysCount) {
      case 3: return [0, 2, 4];
      case 4: return [0, 1, 3, 4];
      case 5: return [0, 1, 2, 3, 4];
      case 6: return [0, 1, 2, 3, 4, 5];
      default: return Array.from({ length: Math.min(daysCount, 7) }, (_, i) => i);
    }
  }

  private calculateExperienceLevel(
    age: number, bmi: number, lifestyle: Lifestyle,
  ): "BEGINNER" | "INTERMEDIATE" | "ADVANCED" {
    if (age < 25 && bmi < 22 && lifestyle === "LIGHT") return "BEGINNER";
    if (lifestyle === "HARD" || (age > 35 && bmi > 25)) return "ADVANCED";
    return "INTERMEDIATE";
  }

  /** Определить TrainingSplit по типу дня (для toggle-day) */
  private getSplitFromDayType(dayType: DayType): TrainingSplit {
    if (["push", "pull", "legs"].includes(dayType)) return "PPL";
    if (["upper", "lower"].includes(dayType)) return "UPPER_LOWER";
    if (["full"].includes(dayType)) return "FULL_BODY";
    if (["chest", "back", "shoulders", "arms"].includes(dayType)) return "BRO_SPLIT";
    return "FULL_BODY";
  }

  estimate1RM(weight: number, experience: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"): number {
    const multipliers = { BEGINNER: 0.7, INTERMEDIATE: 0.85, ADVANCED: 1.0 };
    return Math.round(weight * 1.25 * (multipliers[experience] ?? 0.85));
  }

  private calculateTotalVolume(days: LocalTrainingPlan[]): number {
    return days.reduce((sum, day) => {
      return sum + day.exercises.reduce((daySum: number, ex: ExerciseSet) => {
        const avgReps = (ex.targetRepsRange[0] + ex.targetRepsRange[1]) / 2;
        return daySum + ex.sets * avgReps;
      }, 0);
    }, 0);
  }

  private estimateDuration(exercises: ExerciseSet[]): number {
    const setsTotal = exercises.reduce((sum, ex) => sum + ex.sets, 0);
    return Math.round((90 * setsTotal + exercises.length * 120) / 60);
  }

  private generateDayWarnings(exercises: ExerciseSet[], difficulty: Difficulty): string[] {
    const warnings: string[] = [];
    const hardExercises = exercises.filter((ex) => Boolean(ex.warning));
    if (difficulty === "EASY" && hardExercises.length > 2) {
      warnings.push("⚠️ Много сложных! Фокус на технику");
    }
    if (exercises.length > 8) {
      warnings.push("⚠️ Много упражнений — можно сократить");
    }
    return warnings;
  }
}
