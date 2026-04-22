export const MUSCLE_GROUP_LABELS: Record<string, string> = {
  // Шея
  NECK: "Шея",

  // Трапеции
  TRAPEZIUS_UPPER: "Верхняя трапеция",
  TRAPEZIUS_LOWER: "Нижняя трапеция",

  // Плечи
  DELTOIDS_ANTERIOR: "Передняя дельта",
  DELTOIDS_MEDIAL: "Средняя дельта",
  DELTOIDS_POSTERIOR: "Задняя дельта",

  // Грудь
  CHEST_UPPER: "Верх груди",
  CHEST_MIDDLE: "Середина груди",
  CHEST_LOWER: "Низ груди",

  // Спина
  LATS: "Широчайшие",
  RHOMBOIDS_UPPER: "Верх ромбовидных",
  RHOMBOIDS_LOWER: "Низ ромбовидных",
  TERES_MAJOR: "Большая круглая",
  TERES_MINOR: "Малая круглая",
  ERECTOR_SPINAE_UPPER: "Верх разгибателей спины",
  ERECTOR_SPINAE_LOWER: "Низ разгибателей спины",

  // Руки
  BICEPS_LONG_HEAD: "Длинная головка бицепса",
  BICEPS_SHORT_HEAD: "Короткая головка бицепса",
  TRICEPS_LONG_HEAD: "Длинная головка трицепса",
  TRICEPS_MEDIAL_HEAD: "Медиальная головка трицепса",
  TRICEPS_LATERAL_HEAD: "Латеральная головка трицепса",
  FOREARMS_FLEXORS: "Сгибатели предплечий",
  FOREARMS_EXTENSORS: "Разгибатели предплечий",

  // Пресс
  ABS_UPPER: "Верх пресса",
  ABS_LOWER: "Низ пресса",
  OBLIQUES: "Косые мышцы",

  // Ноги
  GLUTES_MAXIMUS: "Большая ягодичная",
  GLUTES_MEDIAS: "Средняя ягодичная",
  ABDUCTORS: "Отводящие мышцы бедра",
  ADDUCTORS: "Приводящие мышцы бедра",
  QUADS_VASTUS_LATERALIS: "Латеральная головка квадрицепса",
  QUADS_VASTUS_MEDIALIS: "Медиальная головка квадрицепса",
  QUADS_RECTUS_FEMORIS: "Прямая головка квадрицепса",
  HAMSTRINGS: "Бицепс бедра",
  CALVES_GASTROCNEMIUS: "Икроножная (груша)",
  CALVES_SOLEUS: "Икроножная (камбаловидная)",
} as const;

export const MUSCLE_SUPERGROUPS = {
  // Группа 1: ВЕРХ + ПЛЕЧИ (8 мышц)
  SHOULDERS_CHEST: [
    "NECK",
    "TRAPEZIUS_UPPER",
    "TRAPEZIUS_LOWER",
    "DELTOIDS_ANTERIOR",
    "DELTOIDS_MEDIAL",
    "DELTOIDS_POSTERIOR",
    "CHEST_UPPER",
    "CHEST_MIDDLE",
  ] as const,

  // Группа 2: ГРУДЬ + СПИНА (8 мышц)
  CHEST_BACK: [
    "CHEST_LOWER",
    "LATS",
    "RHOMBOIDS_UPPER",
    "RHOMBOIDS_LOWER",
    "TERES_MAJOR",
    "TERES_MINOR",
    "ERECTOR_SPINAE_UPPER",
    "ERECTOR_SPINAE_LOWER",
  ] as const,

  // Группа 3: РУКИ (7 мышц)
  ARMS: [
    "BICEPS_LONG_HEAD",
    "BICEPS_SHORT_HEAD",
    "TRICEPS_LONG_HEAD",
    "TRICEPS_MEDIAL_HEAD",
    "TRICEPS_LATERAL_HEAD",
    "FOREARMS_FLEXORS",
    "FOREARMS_EXTENSORS",
  ] as const,

  // Группа 4: ПРЕСС + ЯГОДИЦЫ (7 мышц)
  CORE_GLUTES: [
    "ABS_UPPER",
    "ABS_LOWER",
    "OBLIQUES",
    "GLUTES_MAXIMUS",
    "GLUTES_MEDIAS",
    "ABDUCTORS",
    "ADDUCTORS",
  ] as const,

  // Группа 5: НОГИ (6 мышц)
  LEGS: [
    "QUADS_VASTUS_LATERALIS",
    "QUADS_VASTUS_MEDIALIS",
    "QUADS_RECTUS_FEMORIS",
    "HAMSTRINGS",
    "CALVES_GASTROCNEMIUS",
    "CALVES_SOLEUS",
  ] as const,
} as const;

export const MUSCLE_SUPERGROUP_LABELS: Record<string, string> = {
  SHOULDERS_CHEST: "Плечи + Грудь",
  CHEST_BACK: "Грудь + Спина",
  ARMS: "Руки",
  CORE_GLUTES: "Пресс + Ягодицы",
  LEGS: "Ноги",
} as const;

export const PRIMARY_MUSCLE_GROUP_RU: Record<string, string> = {
  CHEST: "Грудь",
  BACK: "Спина",
  ARMS: "Руки",
  SHOULDERS: "Плечи",
  LEGS: "Ноги",
  CORE: "Мышцы кора",
} as const;

export type SupergroupKey = keyof typeof MUSCLE_SUPERGROUPS;
export type MuscleGroup = (typeof MUSCLE_SUPERGROUPS)[SupergroupKey][number];
