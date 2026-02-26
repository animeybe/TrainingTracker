import {
  TrainingSplit,
  DayType,
  WeekPlan,
  WorkoutDay,
  ExerciseSet,
  Wellbeing,
} from "../../types/training.types";
import { Exercise } from "../../entities/exercise.entity";
import { ExerciseSelectorService } from "./exercise-selector.service";
import { ProfileDto } from "../../../common/types/profile.types";

interface WeeklySchedule {
  trainingDaysPositions: number[];
  restDays: number[];
  dayTypes: DayType[];
}

export class PlanGeneratorService {
  constructor(private exerciseSelector: ExerciseSelectorService) {}

  /**
   * Генерирует НЕДЕЛЮ по рекомендованному сплиту с научными днями отдыха
   * Использует SplitRecommender → ExerciseSelector → оптимальный график
   */
  generateWeekPlan(
    splitType: TrainingSplit,
    favorites: Exercise[],
    allExercises: Exercise[],
    profile: ProfileDto,
    week: number = 1,
    wellbeing: Wellbeing = "normal",
  ): WeekPlan {
    const bmi = this.calculateBMI(profile);
    const schedule = this.getOptimalWeeklySchedule(splitType);

    const workoutDays: Record<number, WorkoutDay | null> = {};

    // Генерируем тренировки по научному графику
    schedule.trainingDaysPositions.forEach(
      (dayNumber: number, dayIndex: number) => {
        const dayType: DayType = schedule.dayTypes[dayIndex];

        const dayExercises = this.exerciseSelector.generateDay(
          dayType,
          favorites,
          allExercises,
          bmi,
          profile.goal!,
          profile.age,
          profile.lifestyle!,
        );

        workoutDays[dayNumber] = {
          day: dayNumber,
          type: dayType,
          exercises: this.applyProgressionAndWellbeing(
            dayExercises,
            week,
            wellbeing,
          ),
          progression: this.getDayProgression(week),
        };
      },
    );

    const score = 95; // Из SplitRecommenderService

    return {
      week,
      split: splitType,
      score,
      daysPerWeek: schedule.trainingDaysPositions.length,
      days: workoutDays,
      restDays: schedule.restDays,
      wellbeing,
      wellbeingAdjusted: wellbeing !== "normal",
      message: this.generateMessage(splitType, wellbeing, week),
    };
  }

  /** 🆕 НАУЧНЫЕ графики (48-72ч отдых между группами) */
  private getOptimalWeeklySchedule(split: TrainingSplit): WeeklySchedule {
    const schedules: Record<TrainingSplit, WeeklySchedule> = {
      // PPL: 5 дней, 48ч отдых (2x/группу)
      PPL: {
        trainingDaysPositions: [1, 3, 4, 5, 7],
        restDays: [2, 6],
        dayTypes: ["pull", "push", "legs", "pull", "push"],
      },

      // Full Body: 3 дня (72ч между full)
      FULL_BODY: {
        trainingDaysPositions: [1, 4, 7],
        restDays: [2, 3, 5, 6],
        dayTypes: ["full", "full", "full"],
      },

      // Upper/Lower: 4 дня (48ч между upper/lower)
      UPPER_LOWER: {
        trainingDaysPositions: [1, 3, 4, 6],
        restDays: [2, 5, 7],
        dayTypes: ["upper", "lower", "upper", "lower"],
      },

      // Bro Split: 5 дней (72ч+ на группу)
      BRO_SPLIT: {
        trainingDaysPositions: [1, 2, 3, 4, 5],
        restDays: [6, 7],
        dayTypes: ["chest", "back", "legs", "shoulders", "arms"],
      },
    };

    return schedules[split] || schedules.PPL;
  }

  /** Применяет прогрессию + wellbeing адаптацию */
  private applyProgressionAndWellbeing(
    exercises: ExerciseSet[],
    week: number,
    wellbeing: Wellbeing,
  ): ExerciseSet[] {
    return exercises.map((ex) => {
      // 1. БАЗОВЫЕ сеты
      let sets = ex.sets;

      // 2. WELLBEING корректировка
      switch (wellbeing) {
        case "bad":
          sets = Math.max(2, sets - 1);
          break;
        case "good":
          sets = Math.min(6, sets + 1);
          break;
      }

      // 3. ПРОГРЕССИЯ (+1 сет каждые 4 недели)
      const progressionSets = Math.min(5, ex.sets + Math.floor((week - 1) / 4));
      sets = Math.max(sets, progressionSets);

      // ✅ Безопасный progression
      const safeProgression = ex.progression || {
        baseSets: ex.sets,
        baseReps: ex.targetRepsRange,
      };

      return {
        ...ex,
        sets,
        progression: {
          ...safeProgression,
          baseSets: ex.sets,
          baseReps: ex.targetRepsRange,
          currentSets: sets,
          weekOffset: Math.floor((week - 1) / 4),
          wellbeingAdjusted: wellbeing !== "normal",
        },
      };
    });
  }

  private getDayProgression(week: number): WorkoutDay["progression"] {
    return {
      weekOffset: Math.floor((week - 1) / 4),
      repIncrease: Math.floor((week - 1) / 2),
    };
  }

  private calculateBMI(profile: ProfileDto): number {
    const heightInMeters = profile.height / 100;
    return profile.weight / (heightInMeters * heightInMeters);
  }

  private generateMessage(
    split: TrainingSplit,
    wellbeing: Wellbeing,
    week: number,
  ): string {
    const messages: Record<TrainingSplit, string> = {
      PPL: "🏋️‍♂️ PPL — 48-72ч отдых (2x/группу)",
      FULL_BODY: "💪 Full Body — 72ч восстановление (3x/неделя)",
      UPPER_LOWER: "⚖️ Upper/Lower — баланс (2x/группу)",
      BRO_SPLIT: "🔥 Bro Split — специализация (1x/группу)",
    };

    const adjustments: string[] = [];
    if (wellbeing !== "normal") adjustments.push(`${wellbeing} день`);
    if (week > 4) adjustments.push(`+${Math.floor((week - 1) / 4)} сет`);

    return `${messages[split]} ${adjustments.join(", ") || ""}`;
  }
}
