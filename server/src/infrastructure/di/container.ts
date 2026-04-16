// di/container.ts
import {
  PrismaUserRepository,
  PrismaExerciseRepository,
  PrismaProfileRepository,
  PrismaPlanRepository,
  PrismaFavoriteExerciseRepository,
} from "../../data/repositories";
import {
  FavoriteExerciseRepositoryImpl,
  ExerciseRepositoryImpl,
  ProfileRepositoryImpl,
  PlanRepositoryImpl,
  UserRepositoryImpl,
} from "../../data/repositories";
import { TrainingDayExecutionRepositoryImpl } from "../../data/repositories/adapters/training-day-execution.repository";
import { TrainingExerciseExecutionRepositoryImpl } from "../../data/repositories/adapters/training-exercise-execution.repository";
import { WeeklyTrainingExerciseRepositoryImpl } from "../../data/repositories/adapters/weekly-training-exercise.repository";
import { PrismaTrainingDayExecutionRepository } from "../../data/repositories/prisma/prisma-training-day-execution.repository";
import { PrismaTrainingExerciseExecutionRepository } from "../../data/repositories/prisma/prisma-training-exercise-execution.repository";
import { PrismaWeeklyTrainingExerciseRepository } from "../../data/repositories/prisma/prisma-weekly-training-exercise.repository";
import {
  IUserRepository,
  IExerciseRepository,
  IProfileRepository,
  IPlanRepository,
  IFavoriteExerciseRepository,
} from "../../domain/repositories";
import { ITrainingDayExecutionRepository } from "../../domain/repositories/i-training-day-execution.repository";
import { ITrainingExerciseExecutionRepository } from "../../domain/repositories/i-training-exercise-execution.repository";
import { IWeeklyTrainingExerciseRepository } from "../../domain/repositories/i-weekly-training-exercise.repository";
import {
  UserService,
  ExerciseService,
  ProfileService,
  PlanService,
  FavoriteExerciseService,
  ExerciseSelectorService,
  SplitRecommenderService,
  PlanGeneratorService,
  DifficultyCalculatorService,
  VolumeCalculatorService,
  TrainingDayExecutionService,
  TrainingExerciseExecutionService,
  WeeklyTrainingExerciseService,
  TrainingPlanGenerationService,
} from "../../domain/services";

// ==============================================================================
// Ключи DI
// ==============================================================================

export enum ServiceKeys {
  USER_REPO = "userRepo",
  EXERCISE_REPO = "exerciseRepo",
  PROFILE_REPO = "profileRepo",
  PLAN_REPO = "planRepo",
  FAVORITE_REPO = "favoriteRepo",

  WEEKLY_EXERCISE_REPO = "weeklyExerciseRepo",
  TRAINING_DAY_EXECUTION_REPO = "trainingDayExecutionRepo",
  TRAINING_EXERCISE_EXECUTION_REPO = "trainingExerciseExecutionRepo",

  USER_SERVICE = "userService",
  PROFILE_SERVICE = "profileService",
  EXERCISE_SERVICE = "exerciseService",
  PLAN_SERVICE = "planService",
  FAVORITE_SERVICE = "favoriteService",

  WEEKLY_EXERCISE_SERVICE = "weeklyExerciseService",
  TRAINING_DAY_EXECUTION_SERVICE = "trainingDayExecutionService",
  TRAINING_EXERCISE_EXECUTION_SERVICE = "trainingExerciseExecutionService",

  EXERCISE_SELECTOR = "exerciseSelector",
  SPLIT_RECOMMENDER = "splitRecommender",
  DIFFICULTY_CALCULATOR = "DifficultyCalculator",
  VOLUME_CALCULATOR = "VolumeCalculator",
  PLAN_GENERATOR = "planGenerator",

  TRAINING_PLAN_GENERATION_SERVICE = "trainingPlanGenerationService",
}


// ==============================================================================
// Типизация DI‑контейнера
// ==============================================================================

interface ServiceRegistry {
  // Репозитории (data)
  [ServiceKeys.USER_REPO]: IUserRepository;
  [ServiceKeys.EXERCISE_REPO]: IExerciseRepository;
  [ServiceKeys.PROFILE_REPO]: IProfileRepository;
  [ServiceKeys.PLAN_REPO]: IPlanRepository;
  [ServiceKeys.FAVORITE_REPO]: IFavoriteExerciseRepository;

  [ServiceKeys.WEEKLY_EXERCISE_REPO]: IWeeklyTrainingExerciseRepository;
  [ServiceKeys.TRAINING_DAY_EXECUTION_REPO]: ITrainingDayExecutionRepository;
  [ServiceKeys.TRAINING_EXERCISE_EXECUTION_REPO]: ITrainingExerciseExecutionRepository;

  // Сервисы домена
  [ServiceKeys.USER_SERVICE]: UserService;
  [ServiceKeys.PROFILE_SERVICE]: ProfileService;
  [ServiceKeys.EXERCISE_SERVICE]: ExerciseService;
  [ServiceKeys.PLAN_SERVICE]: PlanService;
  [ServiceKeys.FAVORITE_SERVICE]: FavoriteExerciseService;

  [ServiceKeys.WEEKLY_EXERCISE_SERVICE]: WeeklyTrainingExerciseService;
  [ServiceKeys.TRAINING_DAY_EXECUTION_SERVICE]: TrainingDayExecutionService;
  [ServiceKeys.TRAINING_EXERCISE_EXECUTION_SERVICE]: TrainingExerciseExecutionService;

  // Рекомендации
  [ServiceKeys.EXERCISE_SELECTOR]: ExerciseSelectorService;
  [ServiceKeys.SPLIT_RECOMMENDER]: SplitRecommenderService;
  [ServiceKeys.DIFFICULTY_CALCULATOR]: DifficultyCalculatorService;
  [ServiceKeys.VOLUME_CALCULATOR]: VolumeCalculatorService;
  [ServiceKeys.PLAN_GENERATOR]: PlanGeneratorService;

  // Объеденённый сервис рекомендаций
  [ServiceKeys.TRAINING_PLAN_GENERATION_SERVICE]: TrainingPlanGenerationService;
}


// ==============================================================================
// Контейнер (DI)
// ==============================================================================

class Container {
  private services: Partial<ServiceRegistry> = {};
  private initialized = false;

  get<Key extends ServiceKeys>(key: Key): ServiceRegistry[Key] {
    if (!this.services[key]) {
      this.initializeServices();
    }
    return this.services[key] as ServiceRegistry[Key];
  }

  private initializeServices(): void {
    if (this.initialized) return;

    // 1. Prisma‑реализации (data)
    const prismaUserRepo = new PrismaUserRepository();
    const prismaExerciseRepo = new PrismaExerciseRepository();
    const prismaProfileRepo = new PrismaProfileRepository();
    const prismaPlanRepo = new PrismaPlanRepository();
    const prismaFavoriteRepo = new PrismaFavoriteExerciseRepository();

    const prismaWeeklyExerciseRepo = new PrismaWeeklyTrainingExerciseRepository();
    const prismaTrainingDayExecutionRepo = new PrismaTrainingDayExecutionRepository();
    const prismaTrainingExerciseExecutionRepo =
      new PrismaTrainingExerciseExecutionRepository();

    // 2. Адаптеры (data → domain)
    const userRepoImpl = new UserRepositoryImpl(prismaUserRepo);
    const exerciseRepoImpl = new ExerciseRepositoryImpl(prismaExerciseRepo);
    const profileRepoImpl = new ProfileRepositoryImpl(prismaProfileRepo);
    const planRepoImpl = new PlanRepositoryImpl(prismaPlanRepo);
    const favoriteRepoImpl = new FavoriteExerciseRepositoryImpl(prismaFavoriteRepo);

    const weeklyExerciseRepoImpl =
      new WeeklyTrainingExerciseRepositoryImpl(prismaWeeklyExerciseRepo);

    const trainingDayExecutionRepoImpl =
      new TrainingDayExecutionRepositoryImpl(prismaTrainingDayExecutionRepo);

    const trainingExerciseExecutionRepoImpl =
      new TrainingExerciseExecutionRepositoryImpl(prismaTrainingExerciseExecutionRepo);

    // 3. Регистрация адаптеров
    this.services[ServiceKeys.USER_REPO] = userRepoImpl;
    this.services[ServiceKeys.EXERCISE_REPO] = exerciseRepoImpl;
    this.services[ServiceKeys.PROFILE_REPO] = profileRepoImpl;
    this.services[ServiceKeys.PLAN_REPO] = planRepoImpl;
    this.services[ServiceKeys.FAVORITE_REPO] = favoriteRepoImpl;

    this.services[ServiceKeys.WEEKLY_EXERCISE_REPO] = weeklyExerciseRepoImpl;
    this.services[ServiceKeys.TRAINING_DAY_EXECUTION_REPO] = trainingDayExecutionRepoImpl;
    this.services[ServiceKeys.TRAINING_EXERCISE_EXECUTION_REPO] =
      trainingExerciseExecutionRepoImpl;

    // 4. Сервисы домена
    this.services[ServiceKeys.USER_SERVICE] =
      new UserService(this.get(ServiceKeys.USER_REPO));

    this.services[ServiceKeys.EXERCISE_SERVICE] =
      new ExerciseService(this.get(ServiceKeys.EXERCISE_REPO));

    this.services[ServiceKeys.PROFILE_SERVICE] =
      new ProfileService(this.get(ServiceKeys.PROFILE_REPO));

    this.services[ServiceKeys.PLAN_SERVICE] =
      new PlanService(this.get(ServiceKeys.PLAN_REPO));

    this.services[ServiceKeys.FAVORITE_SERVICE] =
      new FavoriteExerciseService(this.get(ServiceKeys.FAVORITE_REPO));

    this.services[ServiceKeys.WEEKLY_EXERCISE_SERVICE] =
      new WeeklyTrainingExerciseService(
        this.get(ServiceKeys.WEEKLY_EXERCISE_REPO),
      );

    this.services[ServiceKeys.TRAINING_DAY_EXECUTION_SERVICE] =
      new TrainingDayExecutionService(
        this.get(ServiceKeys.TRAINING_DAY_EXECUTION_REPO),
      );

    this.services[ServiceKeys.TRAINING_EXERCISE_EXECUTION_SERVICE] =
      new TrainingExerciseExecutionService(
        this.get(ServiceKeys.TRAINING_EXERCISE_EXECUTION_REPO),
      );

    // 5. Сервисы рекомендаций
    this.services[ServiceKeys.EXERCISE_SELECTOR] =
      new ExerciseSelectorService();

    this.services[ServiceKeys.SPLIT_RECOMMENDER] =
      new SplitRecommenderService();

    this.services[ServiceKeys.DIFFICULTY_CALCULATOR] =
      new DifficultyCalculatorService();

    this.services[ServiceKeys.VOLUME_CALCULATOR] =
      new VolumeCalculatorService();

    this.services[ServiceKeys.PLAN_GENERATOR] =
      new PlanGeneratorService(
        this.get(ServiceKeys.EXERCISE_SELECTOR),
        this.get(ServiceKeys.DIFFICULTY_CALCULATOR),
        this.get(ServiceKeys.VOLUME_CALCULATOR),
      );

    // 6. Сервис рекомендаций: генерация недельного плана
    this.services[ServiceKeys.TRAINING_PLAN_GENERATION_SERVICE] =
      new TrainingPlanGenerationService(
        this.get(ServiceKeys.PLAN_SERVICE),
        this.get(ServiceKeys.WEEKLY_EXERCISE_SERVICE),

        this.get(ServiceKeys.SPLIT_RECOMMENDER),
        this.get(ServiceKeys.DIFFICULTY_CALCULATOR),
        this.get(ServiceKeys.PLAN_GENERATOR),
      );

    this.initialized = true;
  }
}

export const container = new Container();