export class ErrorBase extends Error {
  constructor(
    message: string,
    public readonly code: string = "GENERIC_ERROR",
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class EntityValidationError extends ErrorBase {
  constructor(messages: string[] = [], details?: Record<string, unknown>) {
    super(
      `Entity validation error: ${messages[0] || "Invalid data"}`,
      "ENTITY_VALIDATION",
      details,
    );
  }
}
