// domain/services/recommendation/volume-calculator.service.ts
/**
 * VolumeCalculatorService — расчёт объёма тренировки.
 *
 * Используется PlanGenerator для оценки нагрузки.
 * volumes теперь вычисляется по количеству упражнений, а не из конфига.
 */

import { ExerciseSet } from "../../common/types/training.types";
import { MuscleGroup } from "../../../common/types/enums.types";

export class VolumeCalculatorService {
  /** Общий объём дня = сумма (подходы × средние повторения) */
  calculateDayVolume(exercises: ExerciseSet[]): number {
    return exercises.reduce((sum, ex) => {
      const avgReps = (ex.targetRepsRange[0] + ex.targetRepsRange[1]) / 2;
      return sum + ex.sets * avgReps;
    }, 0);
  }

  /** Объём на конкретную мышцу */
  calculateMuscleVolume(exercises: ExerciseSet[], muscle: MuscleGroup): number {
    const muscleExercises = exercises.filter((ex) => ex.muscleGroup === muscle);
    return this.calculateDayVolume(muscleExercises);
  }

  /** Оптимальный диапазон объёма для мышцы в зависимости от опыта */
  getOptimalVolumeRange(
    muscle: MuscleGroup,
    experience: "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
  ): [number, number] {
    // Базовые объёмы по группам мышц (среднее за тренировку)
    const baseVolumes: Partial<Record<MuscleGroup, number>> = {
      QUADS_RECTUS_FEMORIS: 4,
      GLUTES_MAXIMUS: 4,
      LATS: 3,
      CHEST_MIDDLE: 3,
      DELTOIDS_ANTERIOR: 2,
      HAMSTRINGS: 3,
    };

    const base = baseVolumes[muscle] ?? 3;

    const multipliers = {
      BEGINNER: [8, 12],
      INTERMEDIATE: [12, 20],
      ADVANCED: [16, 25],
    }[experience];

    return [
      Math.round(multipliers[0] * 0.8),
      Math.round(multipliers[1] * 1.2),
    ];
  }
}
