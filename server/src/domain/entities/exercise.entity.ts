import { ExerciseId } from "../../common/types/ids"; // ✅ Правильный импорт
import {
  MuscleGroup,
  ExerciseType,
  Difficulty,
} from "../../common/types/enums.types";
import { DomainError, EntityValidationError } from "../common/domain-error";
import { Result } from "../common/result"; // ✅ Только Result

interface ExerciseProps {
  id: ExerciseId;
  name: string;
  description: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  type: ExerciseType;
  difficulty: Difficulty;
  imageUrl: string | null;
  videoUrl: string | null;
}

export class Exercise {
  private constructor(private readonly props: ExerciseProps) {}

  static create(props: {
    id: ExerciseId;
    name: string;
    description?: string | null;
    muscleGroup: MuscleGroup;
    secondaryMuscles: MuscleGroup[];
    type: ExerciseType;
    difficulty?: Difficulty;
    imageUrl?: string | null;
    videoUrl?: string | null;
  }): Result<Exercise> {
    const errors: string[] = [];

    if (!props.name?.trim()) errors.push("Name is required");
    if (props.name?.trim().length! < 2) errors.push("Name too short (min 2)");
    if (props.name?.trim().length! > 100)
      errors.push("Name too long (max 100)");

    if (props.description && props.description.length > 500) {
      errors.push("Description too long (max 500)");
    }

    const hasDuplicate = props.secondaryMuscles.includes(props.muscleGroup);
    if (hasDuplicate) {
      errors.push("Secondary muscles cannot include primary muscle");
    }

    if (errors.length > 0) {
      return Result.error(new EntityValidationError(errors));
    }

    return Result.ok(
      new Exercise({
        id: props.id,
        name: props.name.trim(),
        description: props.description ?? "",
        muscleGroup: props.muscleGroup,
        secondaryMuscles: props.secondaryMuscles,
        type: props.type,
        difficulty: props.difficulty ?? "EASY",
        imageUrl: props.imageUrl ?? null,
        videoUrl: props.videoUrl ?? null,
      }),
    );
  }

  static reconstitute(props: ExerciseProps): Exercise {
    return new Exercise(props);
  }

  // Бизнес-методы...
  targetsMuscle(muscle: MuscleGroup): boolean {
    return (
      this.props.muscleGroup === muscle ||
      this.props.secondaryMuscles.includes(muscle)
    );
  }

  get id(): ExerciseId {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get description(): string {
    return this.props.description;
  }
  get muscleGroup(): MuscleGroup {
    return this.props.muscleGroup;
  }
  get secondaryMuscles(): MuscleGroup[] {
    return this.props.secondaryMuscles;
  }
  get type(): ExerciseType {
    return this.props.type;
  }
  get difficulty(): Difficulty {
    return this.props.difficulty;
  }
  get imageUrl(): string | null {
    return this.props.imageUrl;
  }
  get videoUrl(): string | null {
    return this.props.videoUrl;
  }
}
