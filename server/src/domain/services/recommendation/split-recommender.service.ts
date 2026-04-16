import { Goal, Lifestyle } from "../../../common/types/enums.types";
import { UserProfileEntity } from "../../entities/user-profile.entity";
import { SplitRecommendation } from "../../types/training.types";
import { logger } from "../../../common/utils/logger";
import { Result, EntityValidationError } from "../../common";
import { calculateBMI } from "../../../common/utils/profile-utils";

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

      candidates.forEach((element) => {
        logger.info(`${element.split} - ${element.score}`);
      });

      return Result.ok(result);
    } catch (error) {
      logger.error("💥 SplitRecommender ERROR", { error: String(error) });
      return Result.error(new EntityValidationError(["Ошибка рекомендаций"]));
    }
  }

  private calculateMetrics(profile: UserProfileEntity, bmi: number) {
    const age = profile.age ?? 30;

    return {
      // Возрастные группы (исследования показывают)
      ageGroup:
        age < 25
          ? "YOUNG"
          : age < 40
            ? "PRIME"
            : age < 55
              ? "MATURE"
              : "SENIOR",
      agePenalty: age > 50 ? 15 : age > 40 ? 8 : age < 18 ? -10 : 0,

      // BMI категории (WHO стандарты)
      bmiCategory:
        bmi < 18.5
          ? "UNDERWEIGHT"
          : bmi < 25
            ? "NORMAL"
            : bmi < 30
              ? "OVERWEIGHT"
              : "OBESE",
      bmiModifier: bmi < 20 ? -8 : bmi > 30 ? 12 : bmi > 27 ? 6 : 0,

      // Восстановление по lifestyle (научно)
      recoveryScore: this.getRecoveryScore(profile.lifestyle!),

      // Цели по категориям
      goalCategory: this.categorizeGoal(profile.goal!),

      // Опыт по комплексной формуле
      experienceLevel: this.calculateExperienceLevel(profile, bmi),

      // Дни в неделю (реалистично)
      realisticDaysPerWeek:
        profile.lifestyle === "IMMOBILE"
          ? 3
          : profile.lifestyle === "LIGHT"
            ? 4
            : 5,
    };
  }

  /** 🧠 ВОЗРАСТ - ключевой фактор восстановления */
  private getAgeScore(ageGroup: string): number {
    return (
      {
        YOUNG: 0, // <25 - отличное восстановление
        PRIME: 2, // 25-40 - пик формы
        MATURE: 8, // 40-55 - нужно больше отдыха
        SENIOR: 18, // 55+ - приоритет восстановлению
      }[ageGroup] || 0
    );
  }

  /** 🩺 BMI - влияет на сложность упражнений */
  private getBmiScore(bmiCategory: string): number {
    return (
      {
        UNDERWEIGHT: -5, // легче выполнять
        NORMAL: 0, // идеально
        OVERWEIGHT: 8, // кардио нагрузка
        OBESE: 15, // нужна осторожность
      }[bmiCategory] || 0
    );
  }

  /** 💪 LIFESTYLE → восстановление (научно обосновано) */
  private getRecoveryScore(lifestyle: Lifestyle): number {
    return (
      {
        IMMOBILE: 25, // лежачий = плохо восстанавливается
        LIGHT: 15, // офис = средне
        AVERAGE: 5, // работа = нормально
        HARD: -12, // стройка = супер восстановление
      }[lifestyle] || 0
    );
  }

  /** 🎯 ЦЕЛИ по научным категориям */
  private categorizeGoal(goal: Goal): string {
    return goal === "LOSE_FAT" || goal === "MAINTAIN_WEIGHT"
      ? "FAT_LOSS"
      : goal === "GAIN_MUSCLE_MASS"
        ? "BULKING"
        : goal === "STRENGTH" || goal === "POWER"
          ? "STRENGTH"
          : goal === "HYPERTROPHY"
            ? "HYPERTROPHY"
            : goal === "ENDURANCE"
              ? "ENDURANCE"
              : "HEALTH";
  }

  /** 📈 Опыт по формуле (возраст + BMI + lifestyle) */
  private calculateExperienceLevel(
    profile: UserProfileEntity,
    bmi: number,
  ): string {
    const age = profile.age ?? 30;
    const points = 50; // база INTERMEDIATE

    // Молодой + худой + сидячий = новичок
    if (age < 25 && bmi < 22 && profile.lifestyle === "LIGHT")
      return "BEGINNER";

    // Рабочий или зрелый массивный = опытный
    if (profile.lifestyle === "HARD" || (age > 35 && bmi > 25))
      return "ADVANCED";

    return "INTERMEDIATE";
  }

  private scoreFullBody(
    metrics: ReturnType<typeof this.calculateMetrics>,
  ): any {
    let score = 92; // лучший для новичков

    score += metrics.experienceLevel === "BEGINNER" ? 25 : 0;
    score += metrics.recoveryScore > 15 ? 15 : 0; // плохо восстанавливается
    score += metrics.goalCategory === "HEALTH" ? 20 : 0;
    score += metrics.ageGroup === "YOUNG" ? 12 : 0;

    return {
      split: "FULL_BODY",
      score: score,
      daysPerWeek: 3,
      description: `💪 Full Body • ${metrics.realisticDaysPerWeek >= 3 ? "✅ Подходит" : "⚠️ Мало времени"}`,
    };
  }

  private scoreUpperLower(metrics: any): any {
    let score = 90;

    score += metrics.experienceLevel === "INTERMEDIATE" ? 20 : 0;
    score +=
      metrics.experienceLevel === "ADVANCED" && metrics.recoveryScore > 5
        ? 15
        : 0;
    score += metrics.goalCategory === "GAIN_MUSCLE_MASS" ? 18 : 0;
    score += metrics.realisticDaysPerWeek >= 4 ? 10 : 0;

    return {
      split: "UPPER_LOWER",
      score: score,
      daysPerWeek: 4,
      description: "⚖️ Upper/Lower • сбалансировано",
    };
  }

  private scorePushPullLegs(metrics: any): any {
    let score = 88;

    score += metrics.experienceLevel === "ADVANCED" ? 25 : 0;
    score +=
      metrics.recoveryScore <= 0 ? 20 : metrics.recoveryScore <= 5 ? 12 : 0; // HARD/AVERAGE
    score += metrics.goalCategory === "HYPERTROPHY" ? 22 : 0;

    return {
      split: "PPL",
      score: score,
      daysPerWeek: 6,
      description: "🏋️ PPL • высокая частота",
    };
  }

  private scoreBroSplit(metrics: any): any {
    let score = 87;

    score += metrics.goalCategory === "HYPERTROPHY" ? 25 : 0;
    score += metrics.experienceLevel === "ADVANCED" ? 18 : 0;
    score += metrics.ageGroup === "PRIME" ? 12 : 0;
    score += metrics.recoveryScore < 10 ? 10 : 0;

    return {
      split: "BRO_SPLIT",
      score: score,
      daysPerWeek: 5,
      description: "🔥 Bro Split • максимум объема",
    };
  }

  private scoreStrengthFocus(metrics: any): any {
    let score = 89;

    score += metrics.goalCategory === "STRENGTH" ? 30 : 0;
    score += metrics.experienceLevel === "ADVANCED" ? 22 : 0;
    score += metrics.bmiCategory === "OVERWEIGHT" ? 15 : 0;

    return {
      split: "STRENGTH_FOCUS",
      score: score,
      daysPerWeek: 4,
      description: "⚡ Силовой • тяжелые базы",
    };
  }

  private scoreHypertrophyFocus(metrics: any): any {
    let score = 86;

    score += metrics.goalCategory === "HYPERTROPHY" ? 28 : 0;
    score += metrics.bmiCategory === "NORMAL" ? 15 : 0;
    score += metrics.experienceLevel === "INTERMEDIATE" ? 12 : 0;

    return {
      score: score,
      split: "HYPERTROPHY_FOCUS",
      daysPerWeek: 5,
      description: "🏋️ Гипертрофия • 8-12 повторов",
    };
  }
}
