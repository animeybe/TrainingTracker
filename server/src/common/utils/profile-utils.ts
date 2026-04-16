// utils/profile-utils.ts

export type BMICategory =
  | "UNDERWEIGHT"
  | "NORMAL"
  | "OVERWEIGHT"
  | "OBESE"
  | null;

export const calculateBMI = (
  weight: number | null | undefined,
  height: number | null | undefined,
): number => {
  if (!weight || !height) return -1;

  const bmi = weight / (height / 100) ** 2;
  return Math.round(bmi * 100) / 100; // ограничить до 2 знаков
};

export const getBMICategory = (bmi: number | null): BMICategory => {
  if (bmi === null || bmi < 0) return null;

  if (bmi < 18.5) return "UNDERWEIGHT";
  if (bmi < 25) return "NORMAL";
  if (bmi < 30) return "OVERWEIGHT";
  return "OBESE";
};
