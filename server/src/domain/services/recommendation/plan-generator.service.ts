import {
  Difficulty,
  Goal,
  Lifestyle,
  MuscleGroup,
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
} from "../../types/training.types";
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
    allExercises: ExerciseEntity[],
    userData: {
      bmi: number;
      age: number;
      goal: Goal;
      lifestyle: Lifestyle;
      weight: number;
    },
    options: { week: number; wellbeing: "BAD" | "NORMAL" | "GOOD" } = {
      week: 1,
      wellbeing: "NORMAL",
    },
  ): Promise<Result<LocalWeekPlan>> {
    try {
      const { bmi, age, goal, lifestyle, weight } = userData;
      const { week, wellbeing } = options;

      const experience: "NEWBIE" | "INTERMEDIATE" | "ADVANCED" = "INTERMEDIATE";
      const difficulty = this.difficultyCalc.calculateOverallDifficulty(
        bmi,
        age,
        goal,
        lifestyle,
      );

      const expandedDays: Array<{ type: DayType; frequency: 1 }> = [];
      split.days.forEach((dayConfig) => {
        for (let i = 0; i < dayConfig.frequency; i++) {
          expandedDays.push({
            type: dayConfig.type as DayType,
            frequency: 1,
          });
        }
      });

      const trainingDayOfWeeks = this.distributeDaysEvenly(expandedDays.length);

      const trainingDays: LocalTrainingPlan[] = await Promise.all(
        expandedDays.map(async (dayConfig, dayIndex: number) => {
          const dayOfWeek = trainingDayOfWeeks[dayIndex];
          const dayInCycle = dayIndex % 3;

          const dayBase = await this.generateDay(
            dayConfig.type,
            dayOfWeek,
            favorites,
            allExercises,
            bmi,
            goal,
            age,
            lifestyle,
            week,
            wellbeing,
            dayInCycle,
            difficulty,
          );

          return {
            ...dayBase,
            dayOfWeek,
          } as LocalTrainingPlan;
        }),
      );

      const plan: LocalWeekPlan = {
        week,
        split: { ...split, days: expandedDays },
        trainingDays,
        userData: {
          bmi,
          age,
          goal,
          lifestyle,
          difficulty,
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

  private async generateDay(
    dayType: DayType,
    dayOfWeek: number,
    favorites: ExerciseEntity[],
    allExercises: ExerciseEntity[],
    bmi: number,
    goal: Goal,
    age: number,
    lifestyle: Lifestyle,
    week: number,
    wellbeing: "BAD" | "NORMAL" | "GOOD",
    dayInCycle: number,
    overallDifficulty: Difficulty,
  ): Promise<LocalTrainingPlan> {
    const dayExercisesResult = this.exerciseSelector.generateDay(
      dayType,
      favorites,
      allExercises,
      bmi,
      goal,
      age,
      lifestyle,
      week,
      wellbeing,
      dayInCycle,
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

  estimate1RM(
    weight: number,
    experience: "NEWBIE" | "INTERMEDIATE" | "ADVANCED",
  ): number {
    const multipliers = {
      NEWBIE: 0.7,
      INTERMEDIATE: 0.85,
      ADVANCED: 1.0,
    };
    return Math.round(weight * 1.25 * (multipliers[experience] ?? 0.85));
  }

  private calculateTotalVolume(days: LocalTrainingPlan[]): number {
    return days.reduce((sum, day) => {
      return (
        sum +
        day.exercises.reduce((daySum: number, ex: ExerciseSet) => {
          const avgReps = (ex.targetRepsRange[0] + ex.targetRepsRange[1]) / 2;
          return daySum + ex.sets * avgReps;
        }, 0)
      );
    }, 0);
  }

  private estimateDuration(exercises: ExerciseSet[]): number {
    const setsTotal = exercises.reduce((sum, ex) => sum + ex.sets, 0);
    const restTime = 90 * setsTotal;
    const exerciseTime = exercises.length * 120;
    return Math.round((restTime + exerciseTime) / 60);
  }

  private generateDayWarnings(
    exercises: ExerciseSet[],
    difficulty: Difficulty,
  ): string[] {
    const warnings: string[] = [];

    const hardExercises = exercises.filter((ex) => Boolean(ex.warning));
    if (difficulty === "EASY" && hardExercises.length > 2) {
      warnings.push("⚠️ Много сложных! Фокус на технику");
    }

    const bigLifts = [
      "SQUAT",
      "BENCH_PRESS",
      "DEADLIFT",
      "OVERHEAD_PRESS",
      "PULLUP",
    ];

    const bigLiftsCount = exercises.filter((ex) =>
      bigLifts.includes(ex.exerciseId),
    ).length;

    if (bigLiftsCount > 2) {
      warnings.push("⚠️ Много тяжелых базовых — восстановись!");
    }

    return warnings;
  }

  // Равномерно распределить дни тренеровок по дня недели
  private distributeDaysEvenly(daysCount: number): number[] {
    switch (daysCount) {
      case 3: // Full Body
        return [0, 2, 4]; // Пн, Ср, Пт
      case 4: // Upper/Lower
        return [0, 1, 3, 4]; // Пн, Вт, Чт, Пт
      case 5: // BroSplit
        return [0, 1, 2, 3, 4]; // Пн-Пт
      case 6: // PPL
        return [0, 1, 2, 3, 4, 5]; // Пн-Сб
      default:
        return Array.from({ length: Math.min(daysCount, 7) }, (_, i) => i);
    }
  }
}
