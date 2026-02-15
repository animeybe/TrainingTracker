import { PrismaClient } from "@prisma/client";
import { PrismaUserRepository } from "../data/repositories/prisma-user.repository";
import { PrismaExerciseRepository } from "../data/repositories/prisma-exercise.repository";
import { PrismaProfileRepository } from "../data/repositories/prisma-profile.repository";
import { PrismaFavoriteRepository } from "../data/repositories/prisma-favorite.repository";
import { UserService } from "../domain/services/user.service";
import { ExerciseService } from "../domain/services/exercise.service";
import { ProfileService } from "../domain/services/profile.service";
import { FavoriteService } from "../domain/services/favorite.service";

export const prisma = new PrismaClient();

class Container {
  private services: Map<string, any> = new Map();

  get(key: string): any {
    if (!this.services.has(key)) {
      this.services.set("prisma", prisma);
      this.services.set("userRepo", new PrismaUserRepository(prisma));
      this.services.set("exerciseRepo", new PrismaExerciseRepository(prisma));
      this.services.set("profileRepo", new PrismaProfileRepository(prisma));
      this.services.set("favoriteRepo", new PrismaFavoriteRepository(prisma));

      this.services.set("userService", new UserService(this.get("userRepo")));

      this.services.set(
        "profileService",
        new ProfileService(this.get("profileRepo")),
      );

      this.services.set(
        "exerciseService",
        new ExerciseService(this.get("exerciseRepo"), this.get("profileRepo")),
      );

      this.services.set(
        "favoriteService",
        new FavoriteService(this.get("favoriteRepo"), this.get("userRepo")),
      );
    }
    return this.services.get(key)!;
  }
}

export const container = new Container();
