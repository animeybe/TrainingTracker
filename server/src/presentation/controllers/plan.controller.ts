// presentation/controllers/plan.controller.ts
import { Request, Response } from "express";
import { container, ServiceKeys } from "../../infrastructure/di/container";
import { logger } from "../../common/utils";
import {
  RecommendSplitRequestDto,
  GeneratePlanRequestDto,
  TodayPlanRequestDto,
  PlanResponse,
  RecommendSplitResponse,
  TodayPlanResponse,
  GetUserPlansResponse,
  RecommendSplitResponseDto,
  TodayPlanResponseDto,
  UserPlanSummaryDto,
} from "../types/plan.types";
import { TrainingSplit, Wellbeing } from "../../common/types/enums.types";
import { AuthRequest } from "../types/auth.types";
import type {
  ExerciseService,
  FavoriteExerciseService,
  LeastFavoriteExerciseService,
  TrainingPlanGenerationService,
  UserProfileService,
  PlanService,
  SplitRecommenderService,
  UserStateService,
  WeeklyTrainingExerciseService,
} from "../../domain/services";
import type { PlanGeneratorService } from "../../domain/services/recommendation/plan-generator.service";
import type { DifficultyCalculatorService } from "../../domain/services/recommendation/difficulty-calculator.service";
import {
  DayType,
  LocalTrainingPlan,
  LocalWeekPlan,
} from "../../domain/common/types/training.types";
import { WeeklyTrainingExerciseEntity } from "../../domain/entities/weekly-training-exercise.entity";
import { ExerciseEntity } from "../../domain/entities/exercise.entity";
import { calculateBMI } from "../../common/utils/profile-utils";
import { repsToJsonArray } from "../../common/utils/exercise-utils";
import { getWeekIndex } from "../../common/utils/getWeekIndex";
import { UserProfileEntity } from "../../domain/entities/user-profile.entity";

// ═══════════════════════════════════════════════════════
// КОНСТАНТЫ
// ═══════════════════════════════════════════════════════

/** Среднее время отдыха между подходами (сек) */
const REST_TIME_PER_SET_SEC = 90;

/** Среднее время выполнения упражнения (сек) */
const EXERCISE_TIME_SEC = 120;

/** Секунд в минуте */
const SECONDS_IN_MINUTE = 60;

// ═══════════════════════════════════════════════════════
// СЕРВИСЫ
// ═══════════════════════════════════════════════════════

const trainingPlanGenerationService = container.get(
  ServiceKeys.TRAINING_PLAN_GENERATION_SERVICE,
) as TrainingPlanGenerationService;

const profileService = container.get(
  ServiceKeys.PROFILE_SERVICE,
) as UserProfileService;

const favoriteService = container.get(
  ServiceKeys.FAVORITE_SERVICE,
) as FavoriteExerciseService;

const leastFavoriteService = container.get(
  ServiceKeys.LEAST_FAVORITE_SERVICE,
) as LeastFavoriteExerciseService;

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

const difficultyCalc = container.get(
  ServiceKeys.DIFFICULTY_CALCULATOR,
) as DifficultyCalculatorService;

const planGenerator = container.get(
  ServiceKeys.PLAN_GENERATOR,
) as PlanGeneratorService;

// ═══════════════════════════════════════════════════════
// КОНТРОЛЛЕР
// ═══════════════════════════════════════════════════════

export class PlanController {
  // ═══════════════════════════════════════════════════
  // POST /api/plan/recommend
  // ═══════════════════════════════════════════════════
  async recommendSplit(
    req: AuthRequest & Request<{}, {}, RecommendSplitRequestDto>,
    res: Response<RecommendSplitResponse>,
  ): Promise<void> {
    try {
      const userId = req.userId!;

      const profile = await profileService.findByUserId(userId);
      if (!profile) {
        res.status(404).json({ error: "Профиль не найден" });
        return;
      }

      const validationError = this.validateProfile(profile);
      if (validationError) {
        res.status(400).json({ error: validationError });
        return;
      }

      const recommendation = splitRecommenderService.recommend(profile);
      if (!recommendation.isOk) {
        res.status(400).json({ error: recommendation.error!.message });
        return;
      }

      const result = recommendation.value!;

      const data: RecommendSplitResponseDto = {
        split: result.split as TrainingSplit,
        daysPerWeek: result.daysPerWeek,
        description: result.description,
        score: result.score,
        message: result.description,
      };

      res.json({ data });
    } catch (error: any) {
      logger.error("Plan recommend error", error);
      res.status(500).json({ error: "Ошибка рекомендации сплита" });
    }
  }

  // ═══════════════════════════════════════════════════
  // POST /api/plan/generate
  // ═══════════════════════════════════════════════════
  async generatePlan(
    req: AuthRequest & Request<{}, {}, GeneratePlanRequestDto>,
    res: Response<PlanResponse>,
  ): Promise<void> {
    try {
      const userId = req.userId!;
      const { wellbeing = "NORMAL" } = req.body;

      // 1. Проверяем профиль
      const profile = await profileService.findByUserId(userId);
      if (!profile) {
        res
          .status(404)
          .json({ error: "Профиль не найден. Заполните профиль." });
        return;
      }

      const validationError = this.validateProfile(profile);
      if (validationError) {
        res.status(400).json({ error: validationError });
        return;
      }

      // 2. Загружаем реальные данные
      const favorites = await favoriteService.findByUserId(userId);
      const leastFavorites = await leastFavoriteService.findByUserId(userId);
      const allExercises = await exerciseService.findAll();

      if (allExercises.length === 0) {
        res.status(500).json({
          error: "База упражнений пуста. Обратитесь к администратору.",
        });
        return;
      }

      const favoriteExercises = await exerciseService.findManyByIds(
        favorites.map((f) => f.exerciseId),
      );
      const leastFavoriteExercises = await exerciseService.findManyByIds(
        leastFavorites.map((lf) => lf.exerciseId),
      );

      // 3. Определяем неделю
      const weekToUse = req.body.week ?? getWeekIndex(new Date());

      // 4. Генерируем новый план (всегда, без проверки существующего)
      const planResult =
        await trainingPlanGenerationService.generatePlanForUser(
          userId,
          profile,
          {
            favorites: favoriteExercises,
            leastFavorites: leastFavoriteExercises,
            allExercises,
          },
          { week: weekToUse, wellbeing },
        );

      if (!planResult.isOk) {
        res.status(500).json({ error: planResult.error!.message });
        return;
      }

      // 5. Обновляем currentWeek
      await userStateService.updateCurrentWeek(userId, weekToUse);

      res.json({ data: planResult.value!.originalPlan });
    } catch (error: any) {
      logger.error("Plan generate error", error);
      res.status(500).json({ error: "Ошибка генерации плана" });
    }
  }

  // ═══════════════════════════════════════════════════
  // POST /api/plan/today
  // ═══════════════════════════════════════════════════
  async getTodayAdjusted(
    req: AuthRequest & Request<{}, {}, TodayPlanRequestDto>,
    res: Response<TodayPlanResponse>,
  ): Promise<void> {
    try {
      const userId = req.userId!;
      const { wellbeing = "NORMAL" } = req.body;

      // 1. Текущая неделя пользователя
      const userState = await userStateService.findByUserId(userId);
      const currentWeek = userState?.currentWeek ?? 1;

      // 2. План на эту неделю
      const latestPlan = await planService.findByUserIdAndWeek(
        userId,
        currentWeek,
      );
      if (!latestPlan) {
        res.status(404).json({
          error: `План на неделю ${currentWeek} не найден. Сгенерируйте план.`,
        });
        return;
      }

      // 3. Упражнения плана
      const planExercises: WeeklyTrainingExerciseEntity[] =
        await weeklyExerciseService.findByPlanId(latestPlan.id);
      if (planExercises.length === 0) {
        res.status(404).json({
          error: "План пуст. Сгенерируйте план заново.",
        });
        return;
      }

      // 4. Сегодняшний день
      const todayDayOfWeek = this.getTodayDayOfWeek();

      // 5. Упражнения на сегодня
      const todayExercises = planExercises.filter(
        (ex) => ex.dayOfWeek === todayDayOfWeek,
      );

      // 6. День отдыха
      if (todayExercises.length === 0) {
        const data: TodayPlanResponseDto = {
          today: null,
          wellbeingAdjusted: false,
          message: "Сегодня день отдыха",
        };
        res.json({ data });
        return;
      }

      // 7. Строим тренировочный день
      const todayPlan = await this.buildTodayPlan(
        todayExercises,
        latestPlan.split as TrainingSplit,
      );

      // 8. Адаптируем под самочувствие
      const adjustedToday =
        wellbeing !== "NORMAL"
          ? this.adaptDayForWellbeing(todayPlan, wellbeing)
          : todayPlan;

      const data: TodayPlanResponseDto = {
        today: adjustedToday,
        wellbeingAdjusted: wellbeing !== "NORMAL",
        message:
          wellbeing === "NORMAL"
            ? "План на сегодня"
            : `План адаптирован под самочувствие: ${wellbeing}`,
      };

      res.json({ data });
    } catch (error: any) {
      logger.error("getTodayAdjusted ERROR", error);
      res.status(500).json({ error: "Ошибка получения плана на сегодня" });
    }
  }

  // ═══════════════════════════════════════════════════
  // GET /api/plan/max-week
  // ═══════════════════════════════════════════════════
  async getMaxWeekForUser(
    req: AuthRequest,
    res: Response<{ maxWeek: number; currentWeek: number } | { error: string }>,
  ): Promise<void> {
    try {
      const userId = req.userId!;
      const plans = await planService.findByUserId(userId);
      const maxWeek =
        plans.length > 0 ? Math.max(...plans.map((p) => p.week)) : 0;
      const userState = await userStateService.findByUserId(userId);
      const currentWeek = userState?.currentWeek ?? 1;

      res.json({ maxWeek, currentWeek });
    } catch (error: any) {
      logger.error(`Get maxWeek failed: ${error.message}`);
      res.status(500).json({ error: "Failed to get maxWeek" });
    }
  }

  // ═══════════════════════════════════════════════════
  // GET /api/plan/:userId/:week
  // ═══════════════════════════════════════════════════
  async getPlan(
    req: AuthRequest & Request<{ userId: string; week: string }>,
    res: Response<PlanResponse>,
  ): Promise<void> {
    try {
      const userId = req.params.userId;
      const week = parseInt(req.params.week, 10);

      if (!userId) {
        res.status(401).json({ error: "Не авторизован" });
        return;
      }
      if (isNaN(week) || week < 1) {
        res.status(400).json({ error: "Некорректный номер недели" });
        return;
      }

      const weeklyPlan = await planService.findByUserIdAndWeek(userId, week);
      if (!weeklyPlan) {
        res.status(404).json({ error: `План на неделю ${week} не найден` });
        return;
      }

      const profile = await profileService.findByUserId(userId);
      if (!profile) {
        res.status(404).json({ error: "Профиль не найден" });
        return;
      }

      const exercises = await weeklyExerciseService.findByPlanId(weeklyPlan.id);
      const allExercises = await exerciseService.findAll();

      const weekPlan = await this.buildLocalWeekPlan(
        weeklyPlan.split as TrainingSplit,
        weeklyPlan.week,
        weeklyPlan.createdAt.toISOString(),
        exercises,
        profile,
        allExercises,
      );

      res.json({ data: weekPlan });
    } catch (error: any) {
      logger.error("Plan getPlan error", error);
      res.status(500).json({ error: "Ошибка загрузки плана" });
    }
  }

  // ═══════════════════════════════════════════════════
  // POST /api/plan/user-plans
  // ═══════════════════════════════════════════════════
  async getUserPlans(
    req: AuthRequest,
    res: Response<GetUserPlansResponse>,
  ): Promise<void> {
    try {
      const userId = req.userId!;
      const plans = await planService.findByUserId(userId);

      const response: UserPlanSummaryDto[] = plans.map((p) => ({
        id: p.id,
        week: p.week,
        split: p.split as TrainingSplit,
        createdAt: p.createdAt.toISOString(),
      }));

      res.json({ data: { plans: response } });
    } catch (error: any) {
      logger.error("Plan user plans error", error);
      res.status(500).json({ error: "Ошибка загрузки планов" });
    }
  }

  // ═══════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════

  /**
   * Валидация профиля. Возвращает сообщение об ошибке или null.
   */
  private validateProfile(profile: UserProfileEntity): string | null {
    if (profile.weight == null || profile.weight <= 0) return "Укажите вес";
    if (profile.height == null || profile.height <= 0) return "Укажите рост";
    if (profile.age == null || profile.age <= 0) return "Укажите возраст";
    if (!profile.goal) return "Укажите цель тренировок";
    if (!profile.lifestyle) return "Укажите образ жизни";
    if (!profile.gender) return "Укажите пол";
    return null;
  }

  /** Сегодняшний день недели (0 = пн, 6 = вс). */
  private getTodayDayOfWeek(): number {
    return (new Date().getDay() + 6) % 7;
  }

  /**
   * Определяет DayType для индекса дня в сплите.
   * Защита от пустого split.days.
   */
  private getDayTypeForIndex(dayIndex: number, split: TrainingSplit): DayType {
    const typedSplit = trainingPlanGenerationService.convertSplitToTyped(split);
    if (!typedSplit.days.length) return "full";
    const dayMeta = typedSplit.days[dayIndex % typedSplit.days.length];
    return (dayMeta?.type as DayType) ?? "full";
  }

  /**
   * Вычисляет объём нагрузки для списка упражнений.
   */
  private calculateVolumeLoad(
    exercises: { sets: number; targetRepsRange: [number, number] }[],
  ): number {
    return exercises.reduce(
      (sum, ex) =>
        sum + ex.sets * ((ex.targetRepsRange[0] + ex.targetRepsRange[1]) / 2),
      0,
    );
  }

  /**
   * Оценка длительности тренировки в минутах.
   * Формула: (количество_подходов × время_отдыха + количество_упражнений × время_выполнения) / 60
   */
  private estimateDuration(exercises: { sets: number }[]): number {
    const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0);
    const restTime = REST_TIME_PER_SET_SEC * totalSets;
    const exerciseTime = exercises.length * EXERCISE_TIME_SEC;
    return Math.round((restTime + exerciseTime) / SECONDS_IN_MINUTE);
  }

  /**
   * Строит LocalTrainingPlan для today из данных БД.
   */
  private async buildTodayPlan(
    todayExercises: WeeklyTrainingExerciseEntity[],
    split: TrainingSplit,
  ): Promise<LocalTrainingPlan> {
    const todayDayOfWeek = this.getTodayDayOfWeek();
    const exerciseIds = todayExercises.map((ex) => ex.exerciseId);
    const exerciseEntities = await exerciseService.findManyByIds(exerciseIds);
    const exerciseMap = new Map(exerciseEntities.map((e) => [e.id, e]));

    const exerciseSets = todayExercises.map((planEx) => {
      const entity = exerciseMap.get(planEx.exerciseId);
      return {
        exerciseId: planEx.exerciseId,
        sets: planEx.sets,
        targetRepsRange: repsToJsonArray(planEx.repsRange),
        favorite: false,
        warning: entity ? undefined : "Упражнение не найдено в базе",
        muscleGroup: (entity?.primaryMuscleGroup as any) ?? "CHEST_MIDDLE",
        progression: {
          baseSets: planEx.sets,
          baseReps: repsToJsonArray(planEx.repsRange),
          weekOffset: 0,
        },
      };
    });

    return {
      dayIndex: todayDayOfWeek,
      dayOfWeek: todayDayOfWeek,
      dayType: this.getDayTypeForIndex(todayDayOfWeek, split),
      exercises: exerciseSets,
      targetMuscles: [],
      coverage: 100,
      estimatedDuration: this.estimateDuration(exerciseSets),
      volumeLoad: this.calculateVolumeLoad(exerciseSets),
      warnings: [],
    };
  }

  /**
   * Строит LocalWeekPlan из данных БД.
   */
  private async buildLocalWeekPlan(
    split: TrainingSplit,
    week: number,
    generatedAt: string,
    exercises: WeeklyTrainingExerciseEntity[],
    profile: UserProfileEntity,
    allExercises: ExerciseEntity[],
  ): Promise<LocalWeekPlan> {
    const bmi = calculateBMI(profile.weight!, profile.height!)!;
    const difficulty = difficultyCalc.calculateOverallDifficulty(
      bmi,
      profile.age!,
      profile.goal!,
      profile.lifestyle!,
      profile.gender!,
    );
    const estimated1RM = planGenerator.estimate1RM(
      profile.weight!,
      "INTERMEDIATE",
    );

    const dayObjs: LocalTrainingPlan[] = Array.from(
      { length: 7 },
      (_, dayIndex) => {
        const dayExercises = exercises.filter(
          (ex) => ex.dayOfWeek === dayIndex,
        );
        const exerciseSets = dayExercises.map((planEx) => ({
          exerciseId: planEx.exerciseId,
          sets: planEx.sets,
          targetRepsRange: repsToJsonArray(planEx.repsRange),
          favorite: false,
          warning: undefined,
          muscleGroup: "CHEST_MIDDLE" as any, // будет переопределено ниже
          progression: {
            baseSets: planEx.sets,
            baseReps: repsToJsonArray(planEx.repsRange),
            weekOffset: 0,
          },
        }));

        const volumeLoad = this.calculateVolumeLoad(exerciseSets);

        return {
          dayIndex,
          dayOfWeek: dayIndex,
          dayType: this.getDayTypeForIndex(dayIndex, split),
          exercises: exerciseSets,
          targetMuscles: [],
          coverage: exerciseSets.length > 0 ? 100 : 0,
          estimatedDuration: this.estimateDuration(exerciseSets),
          volumeLoad,
          warnings: [],
        };
      },
    );

    const trainingDays = dayObjs.filter((day) => day.exercises.length > 0);
    const totalVolume = trainingDays.reduce(
      (sum, day) => sum + day.volumeLoad,
      0,
    );

    return {
      week,
      split: trainingPlanGenerationService.convertSplitToTyped(split),
      trainingDays,
      userData: {
        bmi,
        age: profile.age!,
        goal: profile.goal!,
        lifestyle: profile.lifestyle!,
        difficulty,
        estimated1RM,
        totalVolume,
      },
      progression: {
        weekOffset: 0,
        wellbeingAdjusted: false,
      },
      generatedAt,
    };
  }

  /**
   * Адаптация тренировочного дня под самочувствие.
   */
  private adaptDayForWellbeing(
    day: LocalTrainingPlan,
    wellbeing: Wellbeing,
  ): LocalTrainingPlan {
    const cloneDay = structuredClone(day);

    for (const ex of cloneDay.exercises) {
      if (wellbeing === "BAD") {
        ex.sets = Math.max(1, ex.sets - 1);
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

    cloneDay.warnings = [`День адаптирован под самочувствие: ${wellbeing}`];
    return cloneDay;
  }
}
