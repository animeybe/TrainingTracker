import { IExerciseRepository } from "..";
import { IProfileRepository } from "..";
import { Exercise } from "..";
import { Goal, Difficulty } from "@prisma/client";
import { UserId } from "../../common/types/ids";

export class ExerciseService {
  constructor(
    private exerciseRepo: IExerciseRepository,
    private profileRepo: IProfileRepository,
  ) {}

  async getRecommendedForUser(userId: UserId, goal: Goal): Promise<Exercise[]> {
    const profile = await this.profileRepo.findByUserId(userId);

    const difficulty = profile.isReadyForHardTraining()
      ? Difficulty.HARD
      : Difficulty.EASY;

    const exercises = await this.exerciseRepo.findByDifficulty(difficulty);
    return exercises.filter((exercise) => exercise.isSuitableForGoal(goal));
  }
}
