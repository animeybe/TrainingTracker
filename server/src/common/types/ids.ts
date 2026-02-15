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
