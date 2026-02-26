export const Role = {
  USER: "USER" as const,
  ADMIN: "ADMIN" as const,
} as const;

export type Role = (typeof Role)[keyof typeof Role]; // "USER" | "ADMIN"

export type MuscleGroup =
  | "NECK"
  | "TRAPEZIUS_UPPER"
  | "TRAPEZIUS_LOWER"
  | "DELTOIDS_ANTERIOR"
  | "DELTOIDS_MEDIAL"
  | "DELTOIDS_POSTERIOR"
  | "CHEST_UPPER"
  | "CHEST_MIDDLE"
  | "CHEST_LOWER"
  | "LATS"
  | "RHOMBOIDS_UPPER"
  | "RHOMBOIDS_LOWER"
  | "TERES_MAJOR"
  | "TERES_MINOR"
  | "ERECTOR_SPINAE_UPPER"
  | "ERECTOR_SPINAE_LOWER"
  | "BICEPS_LONG_HEAD"
  | "BICEPS_SHORT_HEAD"
  | "TRICEPS_LONG_HEAD"
  | "TRICEPS_MEDIAL_HEAD"
  | "TRICEPS_LATERAL_HEAD"
  | "FOREARMS_FLEXORS"
  | "FOREARMS_EXTENSORS"
  | "ABS_UPPER"
  | "ABS_LOWER"
  | "OBLIQUES"
  | "GLUTES_MAXIMUS"
  | "GLUTES_MEDIAS"
  | "ABDUCTORS"
  | "ADDUCTORS"
  | "QUADS_VASTUS_LATERALIS"
  | "QUADS_VASTUS_MEDIALIS"
  | "QUADS_RECTUS_FEMORIS"
  | "HAMSTRINGS"
  | "CALVES_GASTROCNEMIUS"
  | "CALVES_SOLEUS";

export type Lifestyle = "IMMOBILE" | "LIGHT" | "AVERAGE" | "HARD";
export type Goal =
  | "LOSE_WEIGHT"
  | "MAINTAIN_WEIGHT"
  | "GAIN_WEIGHT"
  | "GAIN_MUSCLE_MASS";
export type ExerciseType = "PUSH" | "PULL" | "LEGS" | "OTHERS";
export type Difficulty = "EASY" | "MEDIUM" | "HARD";
