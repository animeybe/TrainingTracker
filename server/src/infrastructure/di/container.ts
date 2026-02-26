import { prisma } from "../prisma/client";
import {
  PrismaUserRepository,
  PrismaExerciseRepository,
  PrismaProfileRepository,
  PrismaFavoriteRepository,
} from "../../data/repositories";
import {
  UserService,
  ExerciseService,
  ProfileService,
  FavoriteService,
} from "../../domain/services";
import {
  ExerciseSelectorService,
  PlanGeneratorService,
  SplitRecommenderService,
} from "../../domain/services/recommendation";

enum ServiceKeys {
  PRISMA = "prisma",
  USER_REPO = "userRepo",
  EXERCISE_REPO = "exerciseRepo",
  PROFILE_REPO = "profileRepo",
  FAVORITE_REPO = "favoriteRepo",

  // Recommendation services
  SPLIT_RECOMMENDER = "splitRecommender",
  EXERCISE_SELECTOR = "exerciseSelector",
  PLAN_GENERATOR = "planGenerator",

  USER_SERVICE = "userService",
  EXERCISE_SERVICE = "exerciseService",
  PROFILE_SERVICE = "profileService",
  FAVORITE_SERVICE = "favoriteService",
}

class Container {
  private services: Map<string, any> = new Map();

  get(key: string): any {
    if (!this.services.has(key)) {
      // 1. Базовые зависимости
      this.services.set(ServiceKeys.PRISMA, prisma);

      // 2. Репозитории
      this.services.set(ServiceKeys.USER_REPO, new PrismaUserRepository());
      this.services.set(
        ServiceKeys.EXERCISE_REPO,
        new PrismaExerciseRepository(),
      );
      this.services.set(
        ServiceKeys.PROFILE_REPO,
        new PrismaProfileRepository(),
      );
      this.services.set(
        ServiceKeys.FAVORITE_REPO,
        new PrismaFavoriteRepository(),
      );

      // 3. Recommendation services (независимые)
      this.services.set(
        ServiceKeys.SPLIT_RECOMMENDER,
        new SplitRecommenderService(),
      );
      this.services.set(
        ServiceKeys.EXERCISE_SELECTOR,
        new ExerciseSelectorService(),
      );

      // 4. PlanGenerator (зависит от recommendation)
      this.services.set(
        ServiceKeys.PLAN_GENERATOR,
        new PlanGeneratorService(this.get(ServiceKeys.EXERCISE_SELECTOR)),
      );

      // 5. Domain Services
      this.services.set(
        ServiceKeys.USER_SERVICE,
        new UserService(this.get(ServiceKeys.USER_REPO)),
      );
      this.services.set(
        ServiceKeys.EXERCISE_SERVICE,
        new ExerciseService(this.get(ServiceKeys.EXERCISE_REPO)),
      );
      this.services.set(
        ServiceKeys.PROFILE_SERVICE,
        new ProfileService(this.get(ServiceKeys.PROFILE_REPO)),
      );
      this.services.set(
        ServiceKeys.FAVORITE_SERVICE,
        new FavoriteService(
          this.get(ServiceKeys.FAVORITE_REPO),
          this.get(ServiceKeys.EXERCISE_REPO),
        ),
      );
    }
    return this.services.get(key)!;
  }
}

export const container = new Container();
