// domain/services/recommendation/volume-calculator.service.ts
import { ExerciseSet } from "../../types/training.types";
import { SELECTOR_CONFIG } from "../../config/selector.config";
import { MuscleGroup } from "../../../common/types/enums.types";

export class VolumeCalculatorService {
  calculateDayVolume(exercises: ExerciseSet[]): number {
    return exercises.reduce((sum, ex) => {
      const avgReps = (ex.targetRepsRange[0] + ex.targetRepsRange[1]) / 2;
      return sum + ex.sets * avgReps;
    }, 0);
  }

  calculateMuscleVolume(exercises: ExerciseSet[], muscle: MuscleGroup): number {
    const muscleExercises = exercises.filter((ex) => ex.muscleGroup === muscle);
    return this.calculateDayVolume(muscleExercises);
  }

  getOptimalVolumeRange(
    muscle: MuscleGroup,
    experience: "NEWBIE" | "INTERMEDIATE" | "ADVANCED",
  ): [number, number] {
    const base = SELECTOR_CONFIG.volumes[muscle] ?? 3;
    const multipliers = {
      NEWBIE: [8, 12],
      INTERMEDIATE: [12, 20],
      ADVANCED: [16, 25],
    }[experience];

    return [
      Math.round(multipliers![0] * 0.8),
      Math.round(multipliers![1] * 1.2),
    ];
  }
}
