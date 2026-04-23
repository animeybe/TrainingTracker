// controllers/plan.controller.ts
import { Request, Response } from "express";
import { container, ServiceKeys } from "../../infrastructure/di/container";
import { logger } from "../../common/utils";
import {
  RecommendSplitRequestDto,
  GeneratePlanRequestDto,
  TodayPlanRequestDto,
  PlanResponse,
  RecommendSplitResponse,
  TodayPlanResponseDto,
  GetUserPlansResponse,
} from "../types/plan.types";
import { TrainingSplit, Wellbeing } from "../../common/types/enums.types";
import { AuthRequest } from "../types/auth.types";
import type {
  ExerciseService,
  FavoriteExerciseService,
  TrainingPlanGenerationService,
  UserProfileService,
  PlanService,
  SplitRecommenderService,
  UserStateService,
} from "../../domain/services";
import {
  DayType,
  ExerciseSet,
  LocalTrainingPlan,
  LocalWeekPlan,
} from "../../domain/types/training.types";
import {
  CreateWeeklyPlanEntity,
  WeeklyPlanEntity,
  WeeklyTrainingExerciseService,
} from "../../domain";
import { WeeklyTrainingExerciseEntity } from "../../domain/entities/weekly-training-exercise.entity";
import { calculateBMI } from "../../common/utils/profile-utils";
import { repsToJsonArray } from "../../common/utils/exercise-utils";
import { TypedTrainingSplit } from "../../common/types/rec-sys.types.types";
import { getWeekIndex } from "../../common/utils/getWeekIndex";

const trainingPlanGenerationService = container.get(
  ServiceKeys.TRAINING_PLAN_GENERATION_SERVICE,
) as TrainingPlanGenerationService;

const profileService = container.get(
  ServiceKeys.PROFILE_SERVICE,
) as UserProfileService;

const favoriteService = container.get(
  ServiceKeys.FAVORITE_SERVICE,
) as FavoriteExerciseService;

const exerciseService = container.get(
  ServiceKeys.EXERCISE_SERVICE,
) as ExerciseService;

const userStateService = container.get(
  ServiceKeys.USER_STATE_SERVICE,
) as UserStateService;

const planService = container.get(ServiceKeys.PLAN_SERVICE) as PlanService;
const weeklyExerciseService = container.get(
  ServiceKeys.WEEKLY_EXERCISE_SERVICE,
) as WeeklyTrainingExerciseService;

const splitRecommenderService = container.get(
  ServiceKeys.SPLIT_RECOMMENDER,
) as SplitRecommenderService;

export class PlanController {
  async recommendSplit(
    req: AuthRequest & Request<{}, {}, RecommendSplitRequestDto>,
    res: Response<RecommendSplitResponse>,
  ) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Не авторизован" });
      }

      const profile = await profileService.findByUserId(userId);
      if (!profile) {
        return res.status(404).json({ error: "Профиль не найден" });
      }

      const recommendation = splitRecommenderService.recommend(profile);
      if (!recommendation.isOk) {
        return res.status(400).json({ error: recommendation.error.message });
      }

      const result = recommendation.value;

      res.json({
        data: {
          split: result.split,
          daysPerWeek: result.daysPerWeek,
          description: result.description,
          score: result.score,
          message: result.description,
        },
      });
    } catch (error: any) {
      logger.error("Plan recommend error", error);
      res.status(500).json({ error: "Ошибка рекомендации сплита" });
    }
  }

  async generatePlan(
    req: AuthRequest & Request<{}, {}, GeneratePlanRequestDto>,
    res: Response<PlanResponse>,
  ) {
    const userId = req.userId!;
    const { week, wellbeing = "NORMAL" } = req.body;

    const profile = await profileService.findByUserId(userId);
    if (!profile) {
      return res.status(404).json({ error: "Профиль не найден" });
    }

    const favorites = await favoriteService.findByUserId(userId);
    const favoriteExercises = await exerciseService.findManyByIds(
      favorites.map((f) => f.exerciseId),
    );
    const allExercises = await exerciseService.findAll();

    // Вычисляем текущую неделю из даты
    const today = new Date();
    const weekIndex = getWeekIndex(today);

    // Проверяем, есть ли план на эту неделю
    const plans = await planService.findByUserId(userId);
    const planExists = plans.some((plan) => plan.week === weekIndex);

    if (planExists) {
      const latestPlan = plans[plans.length - 1];
      // Если план уже есть — просто возвращаем currentWeek + сохранение данных
      await userStateService.updateCurrentWeek(userId, latestPlan.week);
      res.json({ data: null });
    } else {
      const nextWeek = week;

      const planResult =
        await trainingPlanGenerationService.generatePlanForUser(
          userId,
          profile,
          { favorites: favoriteExercises, allExercises },
          { week: nextWeek, wellbeing },
        );

      if (!planResult.isOk) {
        return res.status(500).json({ error: "Ошибка генерации плана" });
      }

      await this.saveGeneratedPlan(userId, planResult.value, wellbeing);

      // Обновляем currentWeek только при создании нового плана
      const updatedCurrentWeek = await userStateService.updateCurrentWeek(
        userId,
        nextWeek,
      );

      res.json({ data: planResult.value.originalPlan });
    }
  }

  async getTodayAdjusted(
    req: AuthRequest & Request<{}, {}, TodayPlanRequestDto>,
    res: Response,
  ) {
    try {
      const userId = req.userId!;
      const { week = 1, wellbeing = "NORMAL" } = req.body;

      const latestPlan = await planService.findByUserIdAndWeek(userId, week);
      if (!latestPlan) {
        return res
          .status(400)
          .json({ error: `План на неделю ${week} не найден` });
      }

      // ✅ Читаем упражнения из БД
      const exercises = await weeklyExerciseService.findByPlanId(latestPlan.id);

      const todayDayOfWeek = (new Date().getDay() + 6) % 7; // 0=пн
      const todayExercises = exercises.filter(
        (ex) => ex.dayOfWeek === todayDayOfWeek,
      );

      if (todayExercises.length === 0) {
        return res.json({
          data: {
            today: null,
            wellbeingAdjusted: false,
            message: "Сегодня день отдыха",
          },
        });
      }

      // ✅ LocalTrainingPlan со ВСЕМИ полями
      const todayDay: LocalTrainingPlan = {
        dayIndex: todayDayOfWeek,
        dayOfWeek: todayDayOfWeek,
        dayType: this.getDayTypeForIndex(
          todayDayOfWeek,
          trainingPlanGenerationService.convertSplitToTyped(
            latestPlan.split as TrainingSplit,
          ),
        ),

        // ✅ Обязательные поля
        targetMuscles: [], // MuscleGroup[]
        volumeLoad: 0, // number

        exercises: todayExercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          sets: ex.sets,
          targetRepsRange: repsToJsonArray(ex.repsRange),
          favorite: false,
          warning: undefined,
          muscleGroup: null,
          progression: undefined,
        })),

        coverage: 0,
        estimatedDuration: 45, // минуты
        warnings: [],
      };

      const adjustedToday =
        wellbeing === "NORMAL"
          ? todayDay
          : this.adaptDayForWellbeing(todayDay, wellbeing);

      res.json({
        data: {
          today: adjustedToday,
          wellbeingAdjusted: wellbeing !== "NORMAL",
          message:
            wellbeing === "NORMAL"
              ? "План на сегодня"
              : `Адаптировано: ${wellbeing}`,
        },
      });
    } catch (error: any) {
      logger.error("getTodayAdjusted ERROR", error);
      res.status(500).json({ error: "Ошибка получения плана на сегодня" });
    }
  }

  async getUserPlans(
    req: AuthRequest & Request<{}, {}, never>,
    res: Response<GetUserPlansResponse>,
  ) {
    try {
      const userId = req.userId!;
      const plans = await planService.findByUserId(userId);

      const response = {
        plans: plans.map((p) => ({
          id: p.id,
          week: p.week,
          split: p.split as TrainingSplit,
          score: p.score,
          createdAt: p.createdAt.toISOString(),
        })),
      };

      res.json({ data: response });
    } catch (error: any) {
      logger.error("Plan user plans error", error);
      res.status(500).json({ error: "Ошибка загрузки планов" });
    }
  }

  async getPlan(
    req: AuthRequest & Request<{ userId: string; week: string }>,
    res: Response<PlanResponse>,
  ): Promise<void> {
    try {
      const { userId } = req.params;
      const week = parseInt(req.params.week, 10);

      if (!userId) {
        res.status(401).json({ error: "Не авторизован" });
        return;
      }

      if (isNaN(week)) {
        res.status(400).json({ error: "Некорректный номер недели" });
        return;
      }

      const weeklyPlan = await planService.findByUserIdAndWeek(userId, week);
      if (!weeklyPlan) {
        res.status(404).json({ error: "План на эту неделю не найден" });
        return;
      }

      const profile = await profileService.findByUserId(userId);
      if (!profile) {
        res.status(404).json({ error: "Профиль не найден" });
        return;
      }

      const bmi = calculateBMI(profile.weight, profile.height);
      if (!bmi) {
        res.status(400).json({ error: "Укажите корректные вес и рост" });
        return;
      }

      const exercises = await weeklyExerciseService.findByPlanId(weeklyPlan.id);

      const typedSplit = trainingPlanGenerationService.convertSplitToTyped(
        weeklyPlan.split as TrainingSplit,
      );

      const dayObjs: LocalTrainingPlan[] = Array.from({ length: 7 }).map(
        (_, dayIndex) => ({
          dayIndex,
          dayOfWeek: dayIndex,
          dayType: "full" as DayType,
          exercises: [],
          targetMuscles: [],
          coverage: 0,
          estimatedDuration: 0,
          volumeLoad: 0,
          warnings: [],
        }),
      );

      for (const ex of exercises) {
        const dayIndex = ex.dayOfWeek;
        if (dayIndex < 0 || dayIndex >= 7) continue;

        const day = dayObjs[dayIndex];

        const targetRepsRange: [number, number] = repsToJsonArray(ex.repsRange);

        day.dayType = this.getDayTypeForIndex(dayIndex, typedSplit);

        day.exercises.push({
          exerciseId: ex.exerciseId,
          sets: ex.sets,
          targetRepsRange,
          favorite: false,
          warning: undefined,
          muscleGroup: null,
          progression: undefined,
        } as ExerciseSet);
      }

      const difficulty = trainingPlanGenerationService
        .getDifficultyCalculator()
        .calculateOverallDifficulty(
          bmi,
          profile.age ?? 30,
          profile.goal ?? "LOSE_FAT",
          profile.lifestyle ?? "LIGHT",
        );

      const estimated1RM = trainingPlanGenerationService
        .getPlanGenerator()
        .estimate1RM(profile.weight ?? 0, "INTERMEDIATE");

      const totalVolume = dayObjs.reduce(
        (acc, day) =>
          acc +
          day.exercises.reduce(
            (dayAcc, ex: ExerciseSet) =>
              dayAcc +
              ex.sets * ((ex.targetRepsRange[0] + ex.targetRepsRange[1]) / 2),
            0,
          ),
        0,
      );

      const weekPlan: LocalWeekPlan = {
        week: weeklyPlan.week,
        split: typedSplit,
        trainingDays: dayObjs.filter((day) => day.exercises.length > 0),
        userData: {
          bmi,
          age: profile.age ?? 0,
          goal: profile.goal ?? "LOSE_FAT",
          lifestyle: profile.lifestyle ?? "LIGHT",
          difficulty,
          estimated1RM,
          totalVolume,
        },
        progression: {
          weekOffset: 0,
          wellbeingAdjusted: false,
        },
        generatedAt: new Date().toISOString(),
      };

      res.json({ data: weekPlan });
    } catch (error: any) {
      logger.error("Plan getPlan error", error);
      res.status(500).json({ error: "Ошибка загрузки плана" });
    }
  }

  static async getMaxWeekForUser(
    req: AuthRequest,
    res: Response<{ maxWeek: number; currentWeek: number } | { error: string }>,
  ) {
    try {
      const userId = req.userId!;

      const plans = await planService.findByUserId(userId);
      const latestPlan = plans[plans.length - 1];
      const maxWeek = latestPlan ? latestPlan.week : 0;

      // Это уже возвращает числовое значение
      const userState = await userStateService.findByUserId(userId);
      const currentWeek: number = userState ? userState.currentWeek : 1;

      res.json({ maxWeek, currentWeek });
    } catch (error: any) {
      logger.error(`Get maxWeek for user failed: ${error.message}`);
      res.status(500).json({ error: "Failed to get maxWeek" });
    }
  }

  private getDayTypeForIndex(
    dayIndex: number,
    split: TypedTrainingSplit,
  ): DayType {
    const dayMeta = split.days[dayIndex % split.days.length] ?? {
      type: "full" as DayType,
    };
    return dayMeta.type;
  }

  private async saveGeneratedPlan(
    userId: string,
    planResult: {
      originalPlan: LocalWeekPlan;
      weeklyExercises: WeeklyTrainingExerciseEntity[];
    },
    wellbeing: Wellbeing,
  ) {
    try {
      const { originalPlan, weeklyExercises } = planResult;

      const planId = await this.savePlanMetadata(
        userId,
        originalPlan,
        wellbeing,
      );

      await weeklyExerciseService.deleteAllByPlanId(planId);

      for (const exData of weeklyExercises) {
        await weeklyExerciseService.createExercise(exData);
      }

      logger.info(
        `✅ Saved ${weeklyExercises.length} exercises for plan ${planId}`,
      );
    } catch (error: any) {
      logger.error("saveGeneratedPlan failed", error);
    }
  }

  private async savePlanMetadata(
    userId: string,
    plan: LocalWeekPlan,
    wellbeing: Wellbeing,
  ): Promise<string> {
    const daysPerWeek = plan.split.days.reduce(
      (sum: number, day: { frequency: number }) => sum + day.frequency,
      0,
    );

    const createData: CreateWeeklyPlanEntity = {
      userId,
      week: plan.week,
      split: plan.split.name as TrainingSplit,
      score: 95,
      daysPerWeek,
      restDays: Array.from({ length: 7 - daysPerWeek }, (_, i) => 6 - i),
      message: `Generated with ${wellbeing !== "NORMAL" ? "adjusted" : "normal"} wellbeing`,
    };

    const existing = await planService.findByUserIdAndWeek(userId, plan.week);

    if (existing) {
      await planService.updatePlan(existing.id, createData);
      return existing.id;
    }

    const newPlan: WeeklyPlanEntity = await planService.createPlan(createData);
    return newPlan.id;
  }

  private adaptDayForWellbeing(
    day: LocalTrainingPlan,
    wellbeing: Wellbeing,
  ): LocalTrainingPlan {
    const cloneDay = structuredClone(day);

    for (const ex of cloneDay.exercises) {
      if (wellbeing === "BAD") {
        ex.sets = Math.max(1, (ex.sets ?? 3) - 1);
        if (ex.targetRepsRange) {
          const [min, max] = ex.targetRepsRange;
          ex.targetRepsRange = [min, Math.max(min, max - 2)];
        }
      } else if (wellbeing === "GOOD") {
        ex.sets = ex.sets + 1;
        if (ex.targetRepsRange) {
          const [min, max] = ex.targetRepsRange;
          ex.targetRepsRange = [min, max + 2];
        }
      }
    }

    cloneDay.warnings = [`День адаптирован под wellbeing: ${wellbeing}`];

    return cloneDay;
  }
}
