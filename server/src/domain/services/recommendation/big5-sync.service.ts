// domain/services/recommendation/big5-sync.service.ts
/**
 * Big5SyncService — ОТЛАДОЧНЫЙ СЕРВИС (не используется в продакшене).
 *
 * Назначение:
 *   При запуске сервера проверяет, что для каждого типа дня (push, pull, legs...)
 *   есть хотя бы одно COMPOUND упражнение с нужным паттерном движения.
 *
 * Как использовать (вручную):
 *   const allExercises = await exerciseService.findAll();
 *   Big5SyncService.sync(allExercises);
 *
 * Не влияет на генерацию планов — только пишет предупреждения в консоль.
 */

import { BIG5_PATTERNS } from "../../config/selector.config";
import { ExerciseEntity } from "../../entities/exercise.entity";
import { DayType } from "../../common/types/training.types";

export class Big5SyncService {
  private static synced = false;

  /**
   * Проверить наличие BIG5 упражнений для всех типов дней.
   * Вызывается один раз при старте.
   */
  static sync(allExercises: ExerciseEntity[]): void {
    if (this.synced) return;

    const days = Object.keys(BIG5_PATTERNS) as DayType[];

    for (const day of days) {
      const patterns = BIG5_PATTERNS[day];

      for (const { muscle, pattern } of patterns) {
        const found = allExercises.filter(
          (ex) =>
            ex.exerciseCategory === "COMPOUND" &&
            ex.primaryMuscleGroup === muscle &&
            (ex.movementPatterns || []).some((p) => p === pattern),
        );

        if (found.length === 0) {
          console.warn(
            `⚠️ BIG5 [${day}]: не найдено COMPOUND ${muscle} + ${pattern}`
          );
        }
      }
    }

    this.synced = true;
    console.log("✅ BIG5 синхронизирован (отладка)");
  }

  /**
   * Получить ID BIG5 упражнений для конкретного типа дня.
   * Используется только для отладки.
   */
  static getBig5Ids(
    dayType: DayType,
    allExercises: ExerciseEntity[],
  ): string[] {
    const patterns = BIG5_PATTERNS[dayType] || [];
    const ids: string[] = [];

    for (const { muscle, pattern } of patterns) {
      const found = allExercises
        .filter(
          (ex) =>
            ex.exerciseCategory === "COMPOUND" &&
            ex.primaryMuscleGroup === muscle &&
            (ex.movementPatterns || []).some((p) => p === pattern),
        )
        .map((ex) => ex.id);

      ids.push(...found);
    }

    return ids;
  }
}
