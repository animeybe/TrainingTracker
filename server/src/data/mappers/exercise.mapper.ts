// data/mappers/exercise.mapper.ts
import type {
  ExerciseDto,
  CreateExerciseDto,
  UpdateExerciseDto,
} from "../dtos/exercise.prisma-dto";
import type {
  ExerciseEntity,
  CreateExerciseEntity,
  UpdateExerciseEntity,
} from "../../domain/entities/exercise.entity";

export class ExerciseMapper {
  static toEntity(dto: ExerciseDto): ExerciseEntity {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      primaryMuscleGroup: dto.primaryMuscleGroup,
      secondaryMuscles: dto.secondaryMuscles,
      movementPatterns: dto.movementPatterns,
      exerciseCategory: dto.exerciseCategory,
      trainingFocus: dto.trainingFocus,
      difficulty: dto.difficulty,
      imageUrl: dto.imageUrl,
      videoUrl: dto.videoUrl,
    };
  }

  static toDto(entity: ExerciseEntity): ExerciseDto {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      primaryMuscleGroup: entity.primaryMuscleGroup,
      secondaryMuscles: entity.secondaryMuscles,
      movementPatterns: entity.movementPatterns,
      exerciseCategory: entity.exerciseCategory,
      trainingFocus: entity.trainingFocus,
      difficulty: entity.difficulty,
      imageUrl: entity.imageUrl,
      videoUrl: entity.videoUrl,
    };
  }

  static fromCreateEntity(entity: CreateExerciseEntity): CreateExerciseDto {
    return {
      name: entity.name,
      description: entity.description,
      primaryMuscleGroup: entity.primaryMuscleGroup,
      secondaryMuscles: entity.secondaryMuscles,
      movementPatterns: entity.movementPatterns,
      exerciseCategory: entity.exerciseCategory,
      trainingFocus: entity.trainingFocus,
      difficulty: entity.difficulty,
      imageUrl: entity.imageUrl,
      videoUrl: entity.videoUrl,
    };
  }

  static fromUpdateEntity(entity: UpdateExerciseEntity): UpdateExerciseDto {
    return {
      name: entity.name,
      description: entity.description,
      primaryMuscleGroup: entity.primaryMuscleGroup,
      secondaryMuscles: entity.secondaryMuscles,
      movementPatterns: entity.movementPatterns,
      exerciseCategory: entity.exerciseCategory,
      trainingFocus: entity.trainingFocus,
      difficulty: entity.difficulty,
      imageUrl: entity.imageUrl,
      videoUrl: entity.videoUrl,
    };
  }
}
