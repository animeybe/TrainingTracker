import { Goal, Lifestyle } from "../../../common/types/enums.types";
import { ProfileDto } from "../../../common/types/profile.types";
import { TrainingSplit, SplitRecommendation } from "../../types/training.types";

type SplitCandidate = {
  type: TrainingSplit;
  score: number;
  daysPerWeek: number;
};

type ExperienceLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
type RecoveryLevel = "LOW" | "MEDIUM" | "HIGH";

export class SplitRecommenderService {
  recommend(profile: ProfileDto): SplitRecommendation {
    const bmi = this.calculateBMI(profile);
    const experienceLevel = this.calculateExperienceLevel(profile);
    const recoveryCapacity = this.calculateRecoveryCapacity(profile);

    const candidates: SplitCandidate[] = [
      this.scoreFullBody(
        bmi,
        experienceLevel,
        recoveryCapacity,
        profile.goal!,
        profile.lifestyle!,
      ),
      this.scoreUpperLower(
        bmi,
        experienceLevel,
        recoveryCapacity,
        profile.goal!,
        profile.lifestyle!,
      ),
      this.scorePushPullLegs(
        bmi,
        experienceLevel,
        recoveryCapacity,
        profile.goal!,
        profile.lifestyle!,
      ),
      this.scoreBroSplit(
        bmi,
        experienceLevel,
        recoveryCapacity,
        profile.goal!,
        profile.lifestyle!,
      ),
    ];

    const bestMatch = candidates.sort((a, b) => b.score - a.score)[0];

    return {
      type: bestMatch.type,
      score: bestMatch.score,
      daysPerWeek: bestMatch.daysPerWeek,
      alternatives: candidates
        .filter((c) => c.type !== bestMatch.type)
        .slice(0, 2)
        .map((c) => ({ type: c.type, score: c.score })),
    };
  }

  // FULL_BODY: 3 дня (каждая мышца 3x/нед)
  private scoreFullBody(
    bmi: number,
    experience: ExperienceLevel,
    recovery: RecoveryLevel,
    goal: Goal,
    lifestyle: Lifestyle,
  ): SplitCandidate {
    let score = 85; // База для новичков

    if (experience === "BEGINNER") score += 15;
    if (recovery === "LOW") score += 10;
    if (goal === "LOSE_WEIGHT") score += 10;
    if (bmi < 22) score += 5; // Худощавые лучше реагируют

    return {
      type: "FULL_BODY",
      score: Math.min(score, 100),
      daysPerWeek: 3, // НАУЧНО: 3x full body оптимально
    };
  }

  // UPPER_LOWER: 4 дня (каждая мышца 2x/нед)
  private scoreUpperLower(
    bmi: number,
    experience: ExperienceLevel,
    recovery: RecoveryLevel,
    goal: Goal,
    lifestyle: Lifestyle,
  ): SplitCandidate {
    let score = 90; // Универсальный сплит

    if (experience === "INTERMEDIATE") score += 10;
    if (recovery === "MEDIUM") score += 10;
    if (goal === "GAIN_MUSCLE_MASS") score += 10;
    if (bmi > 25) score += 5; // Массивным проще восстановление

    return {
      type: "UPPER_LOWER",
      score: Math.min(score, 100),
      daysPerWeek: 4, // НАУЧНО: upper/lower 2x каждая группа
    };
  }

  // PPL: 6 дней (каждая мышца 2x/нед)
  private scorePushPullLegs(
    bmi: number,
    experience: ExperienceLevel,
    recovery: RecoveryLevel,
    goal: Goal,
    lifestyle: Lifestyle,
  ): SplitCandidate {
    let score = 80;

    if (experience === "ADVANCED") score += 20;
    if (recovery === "HIGH") score += 15;
    if (goal === "GAIN_MUSCLE_MASS") score += 10;

    return {
      type: "PPL",
      score: Math.min(score, 100),
      daysPerWeek: 6, // НАУЧНО: PPL 6 дней = каждая мышца 2x
    };
  }

  // BRO_SPLIT: 5 дней (каждая мышца 1x/нед)
  private scoreBroSplit(
    bmi: number,
    experience: ExperienceLevel,
    recovery: RecoveryLevel,
    goal: Goal,
    lifestyle: Lifestyle,
  ): SplitCandidate {
    let score = 75;

    if (experience === "ADVANCED") score += 15;
    if (recovery === "HIGH") score += 10;
    if (goal === "GAIN_MUSCLE_MASS") score += 15;

    return {
      type: "BRO_SPLIT",
      score: Math.min(score, 100),
      daysPerWeek: 5, // НАУЧНО: 1x/группу для максимального объема
    };
  }

  private calculateBMI(profile: ProfileDto): number {
    return profile.weight / Math.pow(profile.height / 100, 2);
  }

  private calculateExperienceLevel(profile: ProfileDto): ExperienceLevel {
    const bmi = this.calculateBMI(profile);

    if (profile.age <= 25 && bmi < 22 && profile.lifestyle === "LIGHT") {
      return "BEGINNER";
    }
    if (profile.lifestyle === "HARD" || (profile.age > 30 && bmi > 25)) {
      return "ADVANCED";
    }
    return "INTERMEDIATE";
  }

  private calculateRecoveryCapacity(profile: ProfileDto): RecoveryLevel {
    switch (profile.lifestyle) {
      case "IMMOBILE":
        return "LOW";
      case "LIGHT":
        return "LOW";
      case "AVERAGE":
        return "MEDIUM";
      case "HARD":
        return "HIGH";
      default:
        return "MEDIUM";
    }
  }
}
