// domain/services/toggle-day.service.ts
import { Result, EntityValidationError } from "../common";
import { PlanService } from "./plan.service";
import { WeeklyTrainingExerciseService } from "./weekly-training-exercise.service";
import { UserProfileService } from "./user-profile.service";
import { FavoriteExerciseService } from "./favorite.service";
import { LeastFavoriteExerciseService } from "./least-favorite.service";
import { ExerciseService } from "./exercise.service";
import { PlanGeneratorService } from "./recommendation/plan-generator.service";
import { TrainingDayTypeService } from "./training-day-type.service";
import { TrainingPlanGenerationService } from "./training-plan-generation.service";
import { TrainingSplit, Wellbeing } from "../../common/types/enums.types";
import { DayType } from "../common/types/training.types";
import { calculateBMI } from "../../common/utils/profile-utils";
import { logger } from "../../common/utils/logger";
import { UserProfileEntity } from "../entities/user-profile.entity";

export class ToggleDayService {
  constructor(
    private planService: PlanService,
    private weeklyExerciseService: WeeklyTrainingExerciseService,
    private profileService: UserProfileService,
    private favoriteService: FavoriteExerciseService,
    private leastFavoriteService: LeastFavoriteExerciseService,
    private exerciseService: ExerciseService,
    private planGenerator: PlanGeneratorService,
    private trainingDayTypeService: TrainingDayTypeService,
    private trainingPlanGenerationService: TrainingPlanGenerationService,
  ) {}

  /**
   * Меняет тип дня: отдых ↔ тренировка.
   * Если день был тренировочным — удаляет упражнения.
   * Если был выходным — генерирует упражнения нужного типа.
   */
  async toggleDayType(
    userId: string,
    week: number,
    dayOfWeek: number,
    preferredDayType?: string,
  ): Promise<Result<{ newType: "rest" | "training"; message: string }>> {
      console.log('🔍🔍🔍 TOGGLE START:', { userId, week, dayOfWeek, preferredDayType });
    try {
      // 1. Найти план на эту неделю
      const plan = await this.planService.findByUserIdAndWeek(userId, week);
      if (!plan) {
        return Result.error(
          new EntityValidationError(["План на эту неделю не найден"]),
        );
      }

      // 2. Найти упражнения для этого дня
      const allExercisesForPlan = await this.weeklyExerciseService.findByPlanId(plan.id);
      const exercisesForDay = allExercisesForPlan.filter(
        (ex) => ex.dayOfWeek === dayOfWeek,
      );

      // 3. Если есть упражнения — удаляем (→ отдых)
      if (exercisesForDay.length > 0) {
        for (const ex of exercisesForDay) {
          await this.weeklyExerciseService.deleteExercise(ex.id);
        }
        // Сохраняем тип дня как "rest" вместо удаления
        await this.trainingDayTypeService.setDayType(plan.id, dayOfWeek, "rest");
        logger.info(
          `✅ День ${dayOfWeek} недели ${week} → отдых (удалено ${exercisesForDay.length} упр.)`,
        );
        return Result.ok({
          newType: "rest",
          message: "День стал выходным",
        });
      }

      // 4. Если упражнений нет — генерируем (→ тренировка)
      const profile = await this.profileService.findByUserId(userId);
      if (!profile) {
        return Result.error(
          new EntityValidationError(["Профиль не найден"]),
        );
      }

      // Валидация профиля
      const validationError = this.validateProfile(profile);
      if (validationError) {
        return Result.error(new EntityValidationError([validationError]));
      }

      // Определяем тип дня на основе сплита
      const typedSplit = this.trainingPlanGenerationService.convertSplitToTyped(
        plan.split as TrainingSplit,
      );
      
      // Получаем все тренировочные дни (уже существующие)
      const existingTrainingDays = allExercisesForPlan
        .filter((ex) => ex.dayOfWeek !== dayOfWeek)
        .map((ex) => ex.dayOfWeek);
      
      console.log('🔍 TOGGLE DEBUG:', { 
        preferredDayType, 
        dayOfWeek, 
        splitDays: typedSplit.days.map(d => d.type),
        computedFromSplit: typedSplit.days[dayOfWeek % typedSplit.days.length]?.type,
        finalDayType: preferredDayType || typedSplit.days[dayOfWeek % typedSplit.days.length]?.type
      });

      // Определяем тип дня: приоритет — выбор пользователя, потом позиция в сплите
      const dayType: DayType = (preferredDayType as DayType) || 
        (typedSplit.days[dayOfWeek % typedSplit.days.length]?.type as DayType) || 
        "full";

      // Загружаем упражнения
      const favorites = await this.favoriteService.findByUserId(userId);
      const leastFavorites = await this.leastFavoriteService.findByUserId(userId);
      const allExercises = await this.exerciseService.findAll();

      const favoriteExercises = await this.exerciseService.findManyByIds(
        favorites.map((f: { exerciseId: string }) => f.exerciseId),
      );
      const leastFavoriteExercises = await this.exerciseService.findManyByIds(
        leastFavorites.map((lf: { exerciseId: string }) => lf.exerciseId),
      );

      const bmi = calculateBMI(profile.weight!, profile.height!)!;

      // Генерируем ОДИН день
      const dayResult = await this.planGenerator.generateSingleDay(
        dayType,
        dayOfWeek,
        favoriteExercises,
        leastFavoriteExercises,
        allExercises,
        {
          bmi,
          age: profile.age!,
          goal: profile.goal!,
          lifestyle: profile.lifestyle!,
          weight: profile.weight!,
          gender: profile.gender!,
        },
        { week, wellbeing: "NORMAL" },
      );

      if (!dayResult.isOk || !dayResult.value) {
        return Result.error(
          new EntityValidationError(["Не удалось сгенерировать упражнения"]),
        );
      }

      const dayPlan = dayResult.value;

      // Сохраняем упражнения для этого дня
      for (let i = 0; i < dayPlan.exercises.length; i++) {
        const ex = dayPlan.exercises[i];
        await this.weeklyExerciseService.createExercise({
          planId: plan.id,
          exerciseId: ex.exerciseId,
          dayOfWeek,
          orderInDay: i + 1,
          sets: ex.sets,
          repsRange: ex.targetRepsRange,
        });
      }

      await this.trainingDayTypeService.setDayType(plan.id, dayOfWeek, dayType);

      logger.info(
        `✅ День ${dayOfWeek} недели ${week} → тренировка (${dayType}, ${dayPlan.exercises.length} упр.)`,
      );
      return Result.ok({
        newType: "training",
        message: `День стал тренировочным (${dayType})`,
      });
    } catch (error: any) {
      logger.error("❌ ToggleDayService error:", error);
      return Result.error(
        new EntityValidationError(["Не удалось изменить тип дня"]),
      );
    }
  }

  private validateProfile(profile: UserProfileEntity): string | null {
    if (!profile.weight || profile.weight <= 0) return "Укажите вес";
    if (!profile.height || profile.height <= 0) return "Укажите рост";
    if (!profile.age || profile.age <= 0) return "Укажите возраст";
    if (!profile.goal) return "Укажите цель тренировок";
    if (!profile.lifestyle) return "Укажите образ жизни";
    if (!profile.gender) return "Укажите пол";
    return null;
  }
}
