import { DomainError } from "./domain-error";

// domain/common/result.ts
export type Result<T, E extends DomainError = DomainError> =
  | { success: true; value: T }
  | { success: false; error: E };

export const Result = {
  ok<T>(value: T): Result<T> {
    return { success: true, value };
  },

  error<E extends DomainError>(error: E): Result<never, E> {
    return { success: false, error };
  },

  isOk<T, E extends DomainError>(
    result: Result<T, E>,
  ): result is { success: true; value: T } {
    return result.success;
  },

  isError<T, E extends DomainError>(
    result: Result<T, E>,
  ): result is { success: false; error: E } {
    return !result.success;
  },
};
