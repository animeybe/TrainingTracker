export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class EntityNotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super(`${entity} with id "${id}" not found`);
  }
}

export class ValidationError extends DomainError {
  constructor(field: string, value: unknown, constraint: string) {
    super(
      `Validation failed: ${field}=${JSON.stringify(value)} violates ${constraint}`,
    );
  }
}
