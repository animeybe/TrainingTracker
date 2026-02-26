import {
  ExercisePrismaDto,
  isExercisePrismaDto,
} from "../dto/exercise.prisma-dto";
import { Exercise } from "../../domain/entities/exercise.entity"; // ✅ Правильный импорт
import { ExerciseId } from "../../common/types/ids";
import { BaseMapper } from "../common/base.mapper";
import {
  MuscleGroup,
  ExerciseType,
  Difficulty,
} from "../../common/types/enums.types";

export class ExerciseMapper extends BaseMapper<ExercisePrismaDto, Exercise> {
  protected doMap(prismaDto: ExercisePrismaDto): Exercise {
    // ✅ Используем reconstitute для данных из БД
    return Exercise.reconstitute({
      id: ExerciseId.create(prismaDto.id),
      name: prismaDto.name,
      description: prismaDto.description ?? "",
      muscleGroup: prismaDto.muscleGroup,
      secondaryMuscles: prismaDto.secondaryMuscles,
      type: prismaDto.type,
      difficulty: prismaDto.difficulty,
      imageUrl: prismaDto.imageUrl,
      videoUrl: prismaDto.videoUrl,
    });
  }

  protected validatePrismaDto(prismaData: unknown): ExercisePrismaDto {
    if (!isExercisePrismaDto(prismaData)) {
      throw new Error(
        `Invalid ExercisePrismaDto: ${JSON.stringify(prismaData)}`,
      );
    }
    return prismaData;
  }

  protected isValidPrismaDto(data: unknown): data is ExercisePrismaDto {
    return isExercisePrismaDto(data);
  }
}
