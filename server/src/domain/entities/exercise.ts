import { ExerciseId } from "../../common/types/ids";
import { MuscleGroup, ExerciseType, Difficulty } from "@prisma/client";

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
  constructor(private props: ExerciseProps) {}

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

  isSuitableForGoal(goal: string): boolean {
    if (goal === "LOSE_WEIGHT" && this.props.difficulty === "EASY") return true;
    if (goal === "GAIN_MUSCLE_MASS" && this.props.difficulty === "HARD")
      return true;
    return this.props.muscleGroup !== "NECK";
  }

  hasMuscleGroup(muscle: MuscleGroup): boolean {
    return (
      this.props.muscleGroup === muscle ||
      this.props.secondaryMuscles.includes(muscle)
    );
  }
}
