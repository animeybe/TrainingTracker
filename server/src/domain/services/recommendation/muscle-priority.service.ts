// domain/services/recommendation/muscle-priority.service.ts
/**
 * MusclePriorityService — приоритеты мышечных групп на основе профиля.
 *
 * Учитывает:
 *   - Пол (мужчины: грудь/плечи/руки, женщины: ягодицы/ноги)
 *   - Цель (сила: только база, гипертрофия: +изоляция, реабилитация: только изоляция)
 *   - Возраст (пожилые: меньше плеч, больше спины/кора)
 *   - Сплит (BRO_SPLIT: одна группа ×3, FULL_BODY: все по 1)
 *
 * Используется ExerciseSelectorService для корректировки количества упражнений.
 */

import { Gender, Goal, TrainingSplit } from "../../../common/types/enums.types";

export class MusclePriorityService {
  /**
   * Получить модификатор количества упражнений для конкретной мышцы.
   * Возвращает число, которое добавляется к базовому min.
   *   +1 = больше упражнений на эту мышцу
   *   -1 = меньше
   *    0 = без изменений
   */
  static getModifier(
    muscle: string,
    gender: Gender,
    goal: Goal,
    age: number,
    split: TrainingSplit,
  ): number {
    let modifier = 0;

    // ── ПОЛ ──────────────────────────────────────────────
    if (gender === "Male") {
      if (["CHEST_UPPER", "CHEST_MIDDLE", "CHEST_LOWER"].includes(muscle)) modifier += 1;
      if (["DELTOIDS_MEDIAL", "DELTOIDS_ANTERIOR"].includes(muscle)) modifier += 1;
      if (["BICEPS_LONG_HEAD", "BICEPS_SHORT_HEAD", "TRICEPS_LONG_HEAD"].includes(muscle)) modifier += 1;
      if (["LATS", "TRAPEZIUS_UPPER"].includes(muscle)) modifier += 1;
      if (["FOREARMS_FLEXORS", "FOREARMS_EXTENSORS"].includes(muscle)) modifier += 1;
      if (["GLUTES_MEDIAS", "ABDUCTORS", "ADDUCTORS"].includes(muscle)) modifier -= 1;
    }

    if (gender === "Female") {
      if (["GLUTES_MAXIMUS", "GLUTES_MEDIAS"].includes(muscle)) modifier += 2;
      if (["QUADS_RECTUS_FEMORIS", "QUADS_VASTUS_LATERALIS", "QUADS_VASTUS_MEDIALIS"].includes(muscle)) modifier += 1;
      if (["HAMSTRINGS"].includes(muscle)) modifier += 1;
      if (["CALVES_GASTROCNEMIUS", "CALVES_SOLEUS"].includes(muscle)) modifier += 1;
      if (["CHEST_UPPER"].includes(muscle)) modifier += 1; // для формы
      if (["TRAPEZIUS_UPPER", "FOREARMS_FLEXORS", "NECK"].includes(muscle)) modifier -= 1;
    }

    // ── ЦЕЛЬ ─────────────────────────────────────────────
    if (goal === "STRENGTH" || goal === "POWER") {
      // Меньше изоляции, только база
      if (["BICEPS_LONG_HEAD", "TRICEPS_LONG_HEAD", "FOREARMS_FLEXORS"].includes(muscle)) modifier -= 1;
    }

    if (goal === "HYPERTROPHY" || goal === "GAIN_MUSCLE_MASS") {
      // Больше изоляции для отстающих мышц
      if (["DELTOIDS_POSTERIOR", "BICEPS_LONG_HEAD", "TRICEPS_LONG_HEAD"].includes(muscle)) modifier += 1;
    }

    if (goal === "REHABILITATION") {
      // Только изоляция, без базы
      if (["QUADS_RECTUS_FEMORIS", "CHEST_MIDDLE", "LATS"].includes(muscle)) modifier -= 1;
    }

    if (goal === "ENDURANCE" || goal === "LOSE_FAT") {
      // Больше кора и кардио-мышц
      if (["ABS_UPPER", "ABS_LOWER", "OBLIQUES"].includes(muscle)) modifier += 1;
    }

    // ── ВОЗРАСТ ──────────────────────────────────────────
    if (age > 50) {
      // Меньше нагрузки на плечи и позвоночник
      if (["DELTOIDS_ANTERIOR", "DELTOIDS_MEDIAL", "TRAPEZIUS_UPPER"].includes(muscle)) modifier -= 1;
      // Больше кора и спины для осанки
      if (["ABS_UPPER", "ABS_LOWER", "ERECTOR_SPINAE_UPPER", "ERECTOR_SPINAE_LOWER"].includes(muscle)) modifier += 1;
    }

    if (age < 20) {
      // Подросткам больше базы для роста
      if (["QUADS_RECTUS_FEMORIS", "CHEST_MIDDLE", "LATS"].includes(muscle)) modifier += 1;
    }

    // ── СПЛИТ ────────────────────────────────────────────
    if (split === "BRO_SPLIT") {
      // В BRO_SPLIT одна группа получает ×3 объёма — это уже учтено в SPLIT_MAX_MODIFIER
    }

    if (split === "FULL_BODY") {
      // В FULL_BODY все мышцы по 1-2 — без изменений
    }

    return modifier;
  }

  /**
   * Должна ли мышца участвовать в тренировке?
   * Некоторые мышцы исключаются для определённых профилей.
   */
  static shouldInclude(
    muscle: string,
    gender: Gender,
    goal: Goal,
  ): boolean {
    // Мужчинам не нужны отведения бедра
    if (gender === "Male" && ["ABDUCTORS", "ADDUCTORS"].includes(muscle)) return false;

    // Женщинам не нужна трапеция и шея
    if (gender === "Female" && ["TRAPEZIUS_UPPER", "TRAPEZIUS_LOWER", "NECK"].includes(muscle)) return false;

    // Реабилитация — только изоляция
    if (goal === "REHABILITATION" && ["CHEST_MIDDLE", "LATS", "QUADS_RECTUS_FEMORIS"].includes(muscle)) return false;

    return true;
  }
}
