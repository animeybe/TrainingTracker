// domain/services/recommendation/split-recommender.service.ts
import { UserProfileEntity } from "../../entities/user-profile.entity";
import { SplitRecommendation } from "../../types/training.types";
import { logger } from "../../../common/utils/logger";
import { Result, EntityValidationError } from "../../common";
import { calculateBMI } from "../../../common/utils/profile-utils";
import { Gender, Goal, Lifestyle } from "@prisma/client";

export class SplitRecommenderService {
  recommend(profile: UserProfileEntity): Result<SplitRecommendation> {
    try {
      if (!profile.age || !profile.goal || !profile.lifestyle) {
        return Result.error(
          new EntityValidationError([
            "Заполните профиль (возраст, цель, образ жизни)",
          ]),
        );
      }

      const bmi = calculateBMI(profile.weight, profile.height);
      if (!bmi) {
        return Result.error(new EntityValidationError(["Укажите вес и рост"]));
      }

      const metrics = this.calculateMetrics(profile, bmi);

      const candidates = [
        this.scoreFullBody(metrics),
        this.scoreUpperLower(metrics),
        this.scorePushPullLegs(metrics),
        this.scoreBroSplit(metrics),
        this.scoreStrengthFocus(metrics),
        this.scoreHypertrophyFocus(metrics),
      ];

      // Приоритет сплитов (выше = лучше для большинства)
      const PRIORITY: Record<string, number> = {
        PPL: 4,
        HYPERTROPHY_FOCUS: 2,
        UPPER_LOWER: 5,
        STRENGTH_FOCUS: 1,
        BRO_SPLIT: 3,
        FULL_BODY: 6,
      };

      const bestMatch = candidates.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return PRIORITY[b.split] - PRIORITY[a.split];
      })[0];

      const result: SplitRecommendation = {
        ...bestMatch,
        split: bestMatch.split,
      };

      candidates.forEach((c) => {
        logger.info(`📊 ${c.split}: ${c.score} баллов`);
      });

      logger.info(`🏆 Выбран: ${result.split} (${result.score} баллов)`);

      return Result.ok(result);
    } catch (error) {
      logger.error("💥 SplitRecommender ERROR", { error: String(error) });
      return Result.error(new EntityValidationError(["Ошибка рекомендаций"]));
    }
  }

  private calculateMetrics(profile: UserProfileEntity, bmi: number) {
    const age = profile.age ?? 30;
    const gender = profile.gender ?? Gender.Male;
    const lifestyle = profile.lifestyle ?? Lifestyle.AVERAGE;

    return {
      age,
      gender,
      bmi,
      lifestyle,

      // Возрастные группы
      ageGroup:
        age < 25
          ? "YOUNG"
          : age < 40
            ? "PRIME"
            : age < 55
              ? "MATURE"
              : "SENIOR",

      // BMI категории
      bmiCategory:
        bmi < 18.5
          ? "UNDERWEIGHT"
          : bmi < 25
            ? "NORMAL"
            : bmi < 30
              ? "OVERWEIGHT"
              : "OBESE",

      // Восстановление
      recoveryScore: this.getRecoveryScore(lifestyle, gender, age),

      // Категория цели
      goalCategory: this.categorizeGoal(profile.goal!),

      // Уровень опыта
      experienceLevel: this.calculateExperienceLevel(profile, bmi),

      // Реалистичное количество дней в неделю
      realisticDaysPerWeek: this.getRealisticDays(lifestyle, gender, age),
    };
  }

  /** 🧬 Пол: Мужчины восстанавливаются быстрее */
  private getRecoveryScore(
    lifestyle: Lifestyle,
    gender: Gender,
    age: number,
  ): number {
    const baseRecovery =
      {
        IMMOBILE: 25,
        LIGHT: 15,
        AVERAGE: 5,
        HARD: -12,
      }[lifestyle] || 0;

    // Женщины восстанавливаются медленнее (особенно в лютеиновой фазе)
    const genderModifier = gender === Gender.Female ? 8 : 0;

    // Возрастной модификатор
    const ageModifier = age > 50 ? 10 : age > 40 ? 5 : 0;

    return baseRecovery + genderModifier + ageModifier;
  }

  /** 🎯 ЦЕЛИ по научным категориям */
  private categorizeGoal(goal: Goal): string {
    if (goal === "LOSE_FAT" || goal === "MAINTAIN_WEIGHT") return "FAT_LOSS";
    if (goal === "GAIN_MUSCLE_MASS") return "BULKING";
    if (goal === "STRENGTH" || goal === "POWER") return "STRENGTH";
    if (goal === "HYPERTROPHY") return "HYPERTROPHY";
    if (goal === "ENDURANCE") return "ENDURANCE";
    return "HEALTH";
  }

  /** 📈 Опыт */
  private calculateExperienceLevel(
    profile: UserProfileEntity,
    bmi: number,
  ): string {
    const age = profile.age ?? 30;

    if (age < 25 && bmi < 22 && profile.lifestyle === Lifestyle.LIGHT)
      return "BEGINNER";
    if (profile.lifestyle === Lifestyle.HARD || (age > 35 && bmi > 25))
      return "ADVANCED";
    return "INTERMEDIATE";
  }

  /** 📅 Реалистичные дни тренировок */
  private getRealisticDays(
    lifestyle: Lifestyle,
    gender: Gender,
    age: number,
  ): number {
    const base =
      {
        IMMOBILE: 2,
        LIGHT: 3,
        AVERAGE: 4,
        HARD: 5,
      }[lifestyle] || 3;

    // Женщины тренируются чуть реже
    const genderModifier = gender === Gender.Female ? -1 : 0;
    // Возраст снижает частоту
    const ageModifier = age > 50 ? -1 : age > 40 ? -0 : 0;

    return Math.max(2, Math.min(6, base + genderModifier - ageModifier));
  }

  // ═══════════════ SCORING ═══════════════

  private scoreFullBody(metrics: any): any {
    let score = 92;
    score += metrics.experienceLevel === "BEGINNER" ? 25 : 0;
    score += metrics.recoveryScore > 15 ? 15 : 0;
    score += metrics.goalCategory === "HEALTH" ? 20 : 0;
    score += metrics.ageGroup === "YOUNG" ? 12 : 0;
    // Женщины: Full Body эффективнее для низа тела
    score += metrics.gender === Gender.Female ? 8 : 0;

    return {
      split: "FULL_BODY",
      score,
      daysPerWeek: Math.min(3, metrics.realisticDaysPerWeek),
      description: "💪 Full Body — всё тело за тренировку",
    };
  }

  private scoreUpperLower(metrics: any): any {
    let score = 90;
    score += metrics.experienceLevel === "INTERMEDIATE" ? 20 : 0;
    score += metrics.goalCategory === "BULKING" ? 18 : 0;
    score += metrics.realisticDaysPerWeek >= 4 ? 10 : 0;
    // Мужчины: лучше для верха тела
    score += metrics.gender === Gender.Male ? 5 : 0;

    return {
      split: "UPPER_LOWER",
      score,
      daysPerWeek: 4,
      description: "⚖️ Upper/Lower — сбалансированный подход",
    };
  }

  private scorePushPullLegs(metrics: any): any {
    let score = 88;
    score += metrics.experienceLevel === "ADVANCED" ? 25 : 0;
    score += metrics.recoveryScore <= 0 ? 20 : 0;
    score += metrics.goalCategory === "HYPERTROPHY" ? 22 : 0;
    score += metrics.gender === Gender.Male ? 10 : 0;

    return {
      split: "PPL",
      score,
      daysPerWeek: 6,
      description: "🏋️ PPL — высокая частота",
    };
  }

  private scoreBroSplit(metrics: any): any {
    let score = 87;
    score += metrics.goalCategory === "HYPERTROPHY" ? 25 : 0;
    score += metrics.experienceLevel === "ADVANCED" ? 18 : 0;
    score += metrics.gender === Gender.Male ? 8 : 0;

    return {
      split: "BRO_SPLIT",
      score,
      daysPerWeek: 5,
      description: "🔥 Bro Split — максимум объёма",
    };
  }

  private scoreStrengthFocus(metrics: any): any {
    let score = 89;
    score += metrics.goalCategory === "STRENGTH" ? 30 : 0;
    score += metrics.experienceLevel === "ADVANCED" ? 22 : 0;
    score += metrics.bmiCategory === "OVERWEIGHT" ? 15 : 0;
    score += metrics.gender === Gender.Male ? 12 : 0;

    return {
      split: "STRENGTH_FOCUS",
      score,
      daysPerWeek: 4,
      description: "⚡ Силовой — тяжёлые базы",
    };
  }

  private scoreHypertrophyFocus(metrics: any): any {
    let score = 86;
    score += metrics.goalCategory === "HYPERTROPHY" ? 28 : 0;
    score += metrics.bmiCategory === "NORMAL" ? 15 : 0;
    score += metrics.gender === Gender.Male ? 6 : 0;

    return {
      split: "HYPERTROPHY_FOCUS",
      score,
      daysPerWeek: 5,
      description: "🏋️ Гипертрофия — 8-12 повторений",
    };
  }
}
