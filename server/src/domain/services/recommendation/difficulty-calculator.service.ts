import {
  Difficulty,
  Gender,
  Goal,
  Lifestyle,
} from "../../../common/types/enums.types";

export class DifficultyCalculatorService {
  calculateOverallDifficulty(
    bmi: number,
    age: number,
    goal: Goal,
    lifestyle: Lifestyle,
    gender: Gender,
  ): Difficulty {
    let score = 0;

    // BMI
    if (bmi < 18.5) score -= 15;
    else if (bmi > 30) score += 20;

    // Age
    if (age > 50) score += 18;
    else if (age < 18) score -= 12;

    // Goal
    if (goal === "LOSE_FAT") score += 10;

    // Gender — женщины начинают легче
    if (gender === "Female") score -= 5;

    // Lifestyle
    const recoveryPenalty =
      {
        IMMOBILE: 20,
        LIGHT: 12,
        AVERAGE: 5,
        HARD: -10,
      }[lifestyle] || 0;
    score += recoveryPenalty;

    return score <= -15 ? "EASY" : score >= 20 ? "HARD" : "MEDIUM";
  }
}
