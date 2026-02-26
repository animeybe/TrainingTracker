import { UserId } from "../../common/types/ids";
import { Lifestyle, Goal } from "../../common/types/enums.types";
import { EntityValidationError } from "../common/domain-error";
import { Result } from "../common/result";

interface UserProfileProps {
  userId: UserId;
  weight: number;
  height: number;
  age: number;
  lifestyle: Lifestyle | null;
  goal: Goal | null;
  createdAt: Date;
  updatedAt: Date;
}

const UNSET_VALUE = -1;

export class UserProfile {
  private constructor(
    public readonly userId: UserId,
    public readonly weight: number,
    public readonly height: number,
    public readonly age: number,
    public readonly lifestyle: Lifestyle | null,
    public readonly goal: Goal | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  get isWeightSet(): boolean {
    return this.weight !== UNSET_VALUE;
  }
  get isHeightSet(): boolean {
    return this.height !== UNSET_VALUE;
  }
  get isAgeSet(): boolean {
    return this.age !== UNSET_VALUE;
  }
  get isLifestyleSet(): boolean {
    return this.lifestyle !== null;
  }
  get isGoalSet(): boolean {
    return this.goal !== null;
  }

  static createEmptyFor(userId: UserId): Result<UserProfile> {
    return Result.ok(
      new UserProfile(
        userId,
        UNSET_VALUE,
        UNSET_VALUE,
        UNSET_VALUE,
        null,
        null,
        new Date(),
        new Date(),
      ),
    );
  }

  static create(props: {
    userId: UserId;
    weight?: number;
    height?: number;
    age?: number;
    lifestyle?: Lifestyle | null;
    goal?: Goal | null;
  }): Result<UserProfile> {
    const errors: string[] = [];

    const weight = props.weight ?? UNSET_VALUE;
    const height = props.height ?? UNSET_VALUE;
    const age = props.age ?? UNSET_VALUE;

    if (weight !== UNSET_VALUE && (weight < 20 || weight > 300)) {
      errors.push(`Weight must be 20-300kg (got ${weight})`);
    }
    if (height !== UNSET_VALUE && (height < 100 || height > 250)) {
      errors.push(`Height must be 100-250cm (got ${height})`);
    }
    if (age !== UNSET_VALUE && (age < 13 || age > 100)) {
      errors.push(`Age must be 13-100 (got ${age})`);
    }

    if (errors.length > 0) {
      return Result.error(new EntityValidationError(errors));
    }

    return Result.ok(
      new UserProfile(
        props.userId,
        weight,
        height,
        age,
        props.lifestyle ?? null,
        props.goal ?? null,
        new Date(),
        new Date(),
      ),
    );
  }

  static reconstitute(props: UserProfileProps): UserProfile {
    return new UserProfile(
      props.userId,
      props.weight ?? UNSET_VALUE,
      props.height ?? UNSET_VALUE,
      props.age ?? UNSET_VALUE,
      props.lifestyle,
      props.goal,
      props.createdAt,
      props.updatedAt,
    );
  }

  calculateBMI(): number | null {
    if (!this.isWeightSet || !this.isHeightSet) return null;
    return this.weight / Math.pow(this.height / 100, 2);
  }

  getBMICategory(): string {
    const bmi = this.calculateBMI();
    if (bmi === null) return "NOT_SET";
    if (bmi < 18.5) return "UNDERWEIGHT";
    if (bmi < 25) return "NORMAL";
    if (bmi < 30) return "OVERWEIGHT";
    return "OBESE";
  }

  isReadyForHardTraining(): boolean {
    return (
      this.isAgeSet &&
      this.isWeightSet &&
      this.isHeightSet &&
      this.age >= 18 &&
      this.weight > 40 &&
      this.height > 140
    );
  }

  update(
    data: Partial<{
      weight: number;
      height: number;
      age: number;
      lifestyle: Lifestyle | null;
      goal: Goal | null;
    }>,
  ): Result<UserProfile> {
    const updateProps = {
      userId: this.userId,
      weight: data.weight !== undefined ? data.weight : this.weight,
      height: data.height !== undefined ? data.height : this.height,
      age: data.age !== undefined ? data.age : this.age,
      lifestyle: data.lifestyle !== undefined ? data.lifestyle : this.lifestyle,
      goal: data.goal !== undefined ? data.goal : this.goal,
    };

    return UserProfile.create(updateProps);
  }
}
