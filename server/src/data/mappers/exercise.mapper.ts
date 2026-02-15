import { ExerciseDto, isExerciseDto } from "../types/exercise.dto";
import { ExerciseId } from "../../common/types/ids";
import { Exercise } from "../../domain/entities/exercise";

export class ExerciseMapper {
  toDomain(dto: ExerciseDto): Exercise {
    this.validateDto(dto);
    return new Exercise({
      id: ExerciseId.create(dto.id),
      name: dto.name,
      description: dto.description || "No description",
      muscleGroup: dto.muscleGroup,
      secondaryMuscles: dto.secondaryMuscles,
      type: dto.type,
      difficulty: dto.difficulty,
      imageUrl: dto.imageUrl,
      videoUrl: dto.videoUrl,
    });
  }

  toDomainMany(dtos: ExerciseDto[]): Exercise[] {
    return dtos.filter(isExerciseDto).map((dto) => this.toDomain(dto));
  }

  private validateDto(dto: ExerciseDto): asserts dto is ExerciseDto {
    if (!isExerciseDto(dto)) throw new Error("Invalid ExerciseDto");
  }
}
