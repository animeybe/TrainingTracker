import { UserId } from "../../common/types/ids";
import { Lifestyle, Goal } from "@prisma/client";

export class UserProfile {
  constructor(
    public readonly userId: UserId,
    public weight: number,
    public height: number,
    public age: number,
    public lifestyle: Lifestyle | null,
    public goal: Goal | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  // Бизнес-логика: BMI расчет
  calculateBMI(): number {
    if (this.weight <= 0 || this.height <= 0) return 0;
    return this.weight / (((this.height / 100) * this.height) / 100);
  }

  getBMICategory(): string {
    const bmi = this.calculateBMI();
    if (bmi < 18.5) return "UNDERWEIGHT";
    if (bmi < 25) return "NORMAL";
    if (bmi < 30) return "OVERWEIGHT";
    return "OBESE";
  }

  // Бизнес-метод: подходит ли профиль для интенсивных тренировок
  isReadyForHardTraining(): boolean {
    return this.age >= 18 && this.weight > 40 && this.height > 140;
  }

  update(
    data: Partial<{
      weight: number;
      height: number;
      age: number;
      lifestyle: Lifestyle;
      goal: Goal;
    }>,
  ): UserProfile {
    return new UserProfile(
      this.userId,
      data.weight ?? this.weight,
      data.height ?? this.height,
      data.age ?? this.age,
      data.lifestyle ?? this.lifestyle,
      data.goal ?? this.goal,
      this.createdAt,
      new Date(),
    );
  }
}
