export class ExerciseId {
  constructor(private readonly _value: string) {}

  get value(): string {
    return this._value;
  }

  toString(): string {
    return this._value;
  }

  static create(value: string): ExerciseId {
    return new ExerciseId(value);
  }
}

export class UserId {
  constructor(private readonly _value: string) {}

  get value(): string {
    return this._value;
  }

  toString(): string {
    return this._value;
  }

  static create(value: string): UserId {
    return new UserId(value);
  }
}
export class ProfileId {
  constructor(private readonly _value: string) {}
  get value(): string {
    return this._value;
  }
  toString(): string {
    return this._value;
  }
  static create(value: string): ProfileId {
    return new ProfileId(value);
  }
}

export class WeeklyPlanId {
  constructor(private readonly _value: string) {}
  get value(): string {
    return this._value;
  }
  toString(): string {
    return this._value;
  }
  static create(value: string): WeeklyPlanId {
    return new WeeklyPlanId(value);
  }
}

export class TrainingDayId {
  constructor(private readonly _value: string) {}
  get value(): string {
    return this._value;
  }
  toString(): string {
    return this._value;
  }
  static create(value: string): TrainingDayId {
    return new TrainingDayId(value);
  }
}

export class FavoriteId {
  constructor(private readonly _value: string) {}
  get value(): string {
    return this._value;
  }
  toString(): string {
    return this._value;
  }
  static create(value: string): FavoriteId {
    return new FavoriteId(value);
  }
}
