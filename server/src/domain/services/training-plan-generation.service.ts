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
import { UserStateService } from "../services/user-state.service";

import { TrainingSplit, Wellbeing } from "../../common/types/enums.types";
import {
  SplitRecommendation,
  DayType,
  LocalWeekPlan,
} from "../common/types/training.types";
import { TypedTrainingSplit } from "../../common/types/rec-sys.types.types";
import cuid from "cuid";
import { isValidSplit } from "../../common/utils/split-utils";

export class TrainingPlanGenerationService {
  constructor(
    private planService: PlanService,
    private userStateService: UserStateService,
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
      leastFavorites: ExerciseEntity[];
      allExercises: ExerciseEntity[];
    },
    options: { week?: number; wellbeing: Wellbeing; preferredSplit?: TrainingSplit },
  ): Promise<
    Result<{
      plan: WeeklyPlanEntity;
      weeklyExercises: WeeklyTrainingExerciseEntity[];
      originalPlan: LocalWeekPlan;
    }>
  > {
    const { wellbeing } = options;

    const userState =
      (await this.userStateService.findByUserId(userId)) ??
      (await this.userStateService.create({ userId, currentWeek: 1 }));

    const weekToUse = options.week ?? userState.currentWeek;

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
 
      console.log('🔍 generatePlanForUser options:', JSON.stringify(options));
      let splitToUse: TrainingSplit;

      if (options.preferredSplit && isValidSplit(options.preferredSplit)) {
        splitToUse = options.preferredSplit;
      } else {
        const recommendationResult = this.splitRecommender.recommend(profile);
        if (!recommendationResult.isOk) {
          return Result.error(recommendationResult.error!);
        }
        splitToUse = recommendationResult.value!.split;
      }

      const typedSplit = this.convertSplitToTyped(splitToUse);

      const weekPlanResult = await this.planGenerator.generateWeeklyPlan(
        typedSplit,
        exercises.favorites,
        exercises.leastFavorites,
        exercises.allExercises,
        {
          bmi,
          age: profile.age,
          goal: profile.goal,
          lifestyle: profile.lifestyle,
          weight: profile.weight,
          gender: profile.gender!,
        },
        { week: weekToUse, wellbeing },
      );

      if (!weekPlanResult.isOk) {
        return Result.error(weekPlanResult.error!);
      }

      const weekPlan: LocalWeekPlan = weekPlanResult.value!;

      const existingPlan = await this.planService.findByUserIdAndWeek(
        userId,
        weekToUse,
      );
      const planId = existingPlan ? existingPlan.id : cuid();

      if (existingPlan) {
        await this.weeklyExerciseService.deleteAllByPlanId(planId);
      }

      const createPlanData: CreateWeeklyPlanEntity = {
        userId,
        week: weekPlan.week,
        split: weekPlan.split.name,
        daysPerWeek: typedSplit.days.length,
        restDays: this.calculateRestDays(typedSplit.days.length),
        message: null,
      };

      const plan = existingPlan
        ? (await this.planService.updatePlan(existingPlan.id, createPlanData))!
        : await this.planService.createPlan(createPlanData)!;

      // Увеличиваем неделю только при создании плана на следующую неделю
      if (options.week && options.week > userState.currentWeek) {
        await this.userStateService.updateCurrentWeek(userId, weekToUse);
      } else if (!options.week) {
        // Если неделя не указана — это новый план, увеличиваем
        await this.userStateService.updateCurrentWeek(userId, weekToUse + 1);
      }

      const weeklyExercises: WeeklyTrainingExerciseEntity[] = [];

      for (const trainingDay of weekPlan.trainingDays) {
        const dayOfWeek = trainingDay.dayOfWeek;

        for (
          let orderInDay = 0;
          orderInDay < trainingDay.exercises.length;
          orderInDay++
        ) {
          const exerciseSet = trainingDay.exercises[orderInDay];

          if (exerciseSet.forced) {
            console.log('💾 Сохраняем forced:', exerciseSet.exerciseId, exerciseSet.forcedReason);
          }

          const weeklyExData: CreateWeeklyTrainingExerciseEntity = {
            planId: plan.id,
            exerciseId: exerciseSet.exerciseId,
            dayOfWeek,
            orderInDay: orderInDay + 1,
            sets: exerciseSet.sets,
            repsRange: exerciseSet.targetRepsRange,
            forced: exerciseSet.forced || null,
            forcedReason: exerciseSet.forcedReason || null,
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

      // Добавляем planId в originalPlan для фронта
      weekPlan.planId = plan.id;
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
          { type: "chest", frequency: 1 },
          { type: "back", frequency: 1 },
          { type: "shoulders", frequency: 1 },
          { type: "legs", frequency: 1 },
          { type: "arms", frequency: 1 },
        );
        break;

      case "STRENGTH_FOCUS":
        days.push(
          { type: "lower", frequency: 1 },
          { type: "push", frequency: 1 },
          { type: "pull", frequency: 1 },
          { type: "upper", frequency: 1 },
        );
        break;

      case "HYPERTROPHY_FOCUS":
        days.push(
          { type: "chest" as DayType, frequency: 1 },
          { type: "back" as DayType, frequency: 1 },
          { type: "shoulders" as DayType, frequency: 1 },
          { type: "arms" as DayType, frequency: 1 },
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

  private calculateRestDays(trainingDays: number): number[] {
    const allDays = [0, 1, 2, 3, 4, 5, 6]; // вс-сб
    const trainingDayNumbers = [0, 1, 2, 3, 4, 5, 6].slice(0, trainingDays);
    return allDays.filter((d) => !trainingDayNumbers.includes(d));
  }
}
