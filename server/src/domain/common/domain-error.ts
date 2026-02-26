export abstract class DomainError extends Error {
  public readonly name: string;

  constructor(
    message: string,
    public readonly code: string,
    public readonly metadata?: Record<string, any>,
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, DomainError.prototype);
  }
}

export class EntityNotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super(`${entity} with id '${id}' not found`, "ENTITY_NOT_FOUND", {
      entity,
      id,
    });
  }
}

export class EntityAlreadyExistsError extends DomainError {
  constructor(entity: string, identifier: string) {
    super(`${entity} '${identifier}' already exists`, "ENTITY_ALREADY_EXISTS", {
      entity,
      identifier,
    });
  }
}

export class EntityValidationError extends DomainError {
  constructor(errors: string[]) {
    super("Entity validation failed", "ENTITY_VALIDATION_ERROR", { errors });
  }
}
