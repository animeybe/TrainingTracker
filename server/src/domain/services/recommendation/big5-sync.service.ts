// domain/services/recommendation/big5-sync.service.ts
import { SELECTOR_CONFIG } from "../../config/selector.config";
import { ExerciseEntity } from "../../entities/exercise.entity";
import { DayType } from "../../common/types/training.types";

/**
 * Синхронизирует bigFiveNames → реальные ID упражнений из базы.
 * Вызывается при загрузке всех упражнений (один раз).
 */
export class Big5SyncService {
  private static synced = false;

  static sync(allExercises: ExerciseEntity[]): void {
    if (this.synced) return;

    const days = Object.keys(SELECTOR_CONFIG.bigFiveNames) as DayType[];

    for (const day of days) {
      const names = SELECTOR_CONFIG.bigFiveNames[day];
      const found = allExercises.filter((ex) => names.includes(ex.name));
      const foundNames = new Set(found.map((ex) => ex.name));
      const missing = names.filter((n) => !foundNames.has(n));

      if (missing.length > 0) {
        console.warn(`⚠️ BIG5 [${day}]: не найдены — ${missing.join(", ")}`);
      }
    }

    this.synced = true;
    console.log("✅ BIG5 синхронизирован");
  }

  /** Получить ID BIG5 для конкретного дня */
  static getBig5Ids(
    dayType: DayType,
    allExercises: ExerciseEntity[],
  ): string[] {
    const names = SELECTOR_CONFIG.bigFiveNames[dayType] || [];
    return allExercises
      .filter((ex) => names.includes(ex.name))
      .map((ex) => ex.id);
  }
}
