// domain/services/training-plan-generation.service.ts
import { calculateBMI } from "../../common/utils/profile-utils";
import { Result, EntityValidationError } from "../common";
import { UserProfileEntity } from "../entities/user-profile.entity";
import {
  WeeklyPlanEntity,
  CreateWeeklyPlanEntity,
} from "../entities/plan.entity";
import {
  CreateWeeklyTrainingExerciseEntity,
  WeeklyTrainingExerciseEntity,
} from "../entities/weekly-training-exercise.entity";
import { ExerciseEntity } from "../entities/exercise.entity";

import { PlanService } from "./plan.service";
import { WeeklyTrainingExerciseService } from "./weekly-training-exercise.service";
import { SplitRecommenderService } from "./recommendation/split-recommender.service";
import { DifficultyCalculatorService } from "./recommendation/difficulty-calculator.service";
import { PlanGeneratorService } from "./recommendation/plan-generator.service";

import { TrainingSplit, Wellbeing } from "../../common/types/enums.types";
import {
  SplitRecommendation,
  DayType,
  LocalWeekPlan,
} from "../types/training.types";
import { TypedTrainingSplit } from "../../common/types/rec-sys.types.types";
import cuid from "cuid";

export class TrainingPlanGenerationService {
  constructor(
    private planService: PlanService,
    private weeklyExerciseService: WeeklyTrainingExerciseService,

    private splitRecommender: SplitRecommenderService,
    private difficultyCalc: DifficultyCalculatorService,
    private planGenerator: PlanGeneratorService,
  ) {}

  async generatePlanForUser(
    userId: string,
    profile: UserProfileEntity,
    exercises: {
      favorites: ExerciseEntity[];
      allExercises: ExerciseEntity[];
    },
    options: {
      week: number;
      wellbeing: Wellbeing;
    },
  ): Promise<
    Result<{
      plan: WeeklyPlanEntity;
      weeklyExercises: WeeklyTrainingExerciseEntity[];
      originalPlan: LocalWeekPlan;
    }>
  > {
    const { week, wellbeing } = options;

    try {
      if (
        profile.weight == null ||
        profile.height == null ||
        profile.age == null ||
        !profile.goal ||
        !profile.lifestyle
      ) {
        return Result.error(
          new EntityValidationError([
            "Заполните профиль полностью (вес, рост, возраст, цель, образ жизни)",
          ]),
        );
      }

      const bmi = calculateBMI(profile.weight, profile.height);
      if (!bmi) {
        return Result.error(
          new EntityValidationError(["Укажите корректные вес и рост"]),
        );
      }

      const recommendationResult = this.splitRecommender.recommend(profile);
      if (!recommendationResult.isOk) {
        return Result.error(recommendationResult.error!);
      }

      const recommendation: SplitRecommendation = recommendationResult.value!;
      const typedSplit = this.convertSplitToTyped(recommendation.split);

      const weekPlanResult = await this.planGenerator.generateWeeklyPlan(
        typedSplit,
        exercises.favorites,
        exercises.allExercises,
        {
          bmi,
          age: profile.age,
          goal: profile.goal,
          lifestyle: profile.lifestyle,
          weight: profile.weight,
        },
        { week, wellbeing },
      );

      if (!weekPlanResult.isOk) {
        return Result.error(weekPlanResult.error!);
      }

      const weekPlan: LocalWeekPlan = weekPlanResult.value!;

      const existingPlan = await this.planService.findByUserIdAndWeek(
        userId,
        week,
      );
      const planId = existingPlan ? existingPlan.id : cuid();

      if (existingPlan) {
        await this.weeklyExerciseService.deleteAllByPlanId(planId);
      }

      const createPlanData: CreateWeeklyPlanEntity = {
        userId,
        week: weekPlan.week,
        split: weekPlan.split.name,
        score: recommendation.score,
        daysPerWeek: recommendation.daysPerWeek,
        restDays: [],
        message: null,
      };

      const plan = existingPlan
        ? (await this.planService.updatePlan(existingPlan.id, createPlanData))!
        : await this.planService.createPlan(createPlanData)!;

      const weeklyExercises: WeeklyTrainingExerciseEntity[] = [];

      for (const trainingDay of weekPlan.trainingDays) {
        const dayOfWeek = trainingDay.dayOfWeek;

        for (
          let orderInDay = 0;
          orderInDay < trainingDay.exercises.length;
          orderInDay++
        ) {
          const exerciseSet = trainingDay.exercises[orderInDay];

          const weeklyExData: CreateWeeklyTrainingExerciseEntity = {
            planId: plan.id,
            exerciseId: exerciseSet.exerciseId,
            dayOfWeek,
            orderInDay: orderInDay + 1,
            sets: exerciseSet.sets,
            repsRange: exerciseSet.targetRepsRange,
          };

          const weeklyExEntity =
            await this.weeklyExerciseService.createExercise(weeklyExData);

          if (!weeklyExEntity) {
            return Result.error(
              new EntityValidationError([
                `Не удалось создать упражнение для плана: ${exerciseSet.exerciseId}`,
              ]),
            );
          }

          weeklyExercises.push(weeklyExEntity);
        }
      }

      return Result.ok({ plan, weeklyExercises, originalPlan: weekPlan });
    } catch (error) {
      console.error("💥 TrainingPlanGeneration ERROR", {
        error: String(error),
      });
      return Result.error(
        new EntityValidationError(["Не удалось сгенерировать план"]),
      );
    }
  }

  /**
   * convertSplitToTyped(split: TrainingSplit)
   * КОНВЕРТАЦИЯ ENUM → TypedTrainingSplit
   * PPL → [{push,frequency:2}, {pull,2}, {legs,2}]
   * ЧАСТОТА тренировок (сколько раз/нед), НЕ последовательность дней!
   */
  convertSplitToTyped(split: TrainingSplit): TypedTrainingSplit {
    const days: Array<{ type: DayType; frequency: number }> = [];

    switch (split) {
      case "PPL":
        days.push(
          { type: "push" as DayType, frequency: 2 },
          { type: "pull" as DayType, frequency: 2 },
          { type: "legs" as DayType, frequency: 2 },
        );
        break;

      case "FULL_BODY":
        days.push({ type: "full" as DayType, frequency: 3 });
        break;

      case "UPPER_LOWER":
        days.push(
          { type: "upper" as DayType, frequency: 2 },
          { type: "lower" as DayType, frequency: 2 },
        );
        break;

      case "BRO_SPLIT":
        days.push(
          { type: "chest" as DayType, frequency: 1 },
          { type: "back" as DayType, frequency: 1 },
          { type: "shoulders" as DayType, frequency: 1 },
          { type: "arms" as DayType, frequency: 1 },
          { type: "legs" as DayType, frequency: 1 },
        );
        break;

      case "STRENGTH_FOCUS":
        days.push(
          { type: "full" as DayType, frequency: 1 },
          { type: "upper" as DayType, frequency: 1 },
          { type: "lower" as DayType, frequency: 1 },
          { type: "full" as DayType, frequency: 1 },
        );
        break;

      case "HYPERTROPHY_FOCUS":
        days.push(
          { type: "push" as DayType, frequency: 2 },
          { type: "pull" as DayType, frequency: 2 },
          { type: "legs" as DayType, frequency: 1 },
        );
        break;

      default:
        days.push({ type: "full" as DayType, frequency: 3 });
    }

    return {
      name: split,
      days,
    };
  }

  getDifficultyCalculator(): DifficultyCalculatorService {
    return this.difficultyCalc;
  }

  getPlanGenerator(): PlanGeneratorService {
    return this.planGenerator;
  }
}
