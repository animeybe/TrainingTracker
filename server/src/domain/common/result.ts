// domain/common/result.ts
export type Result<T, E = Error> =
  | { isOk: true; value: T }
  | { isOk: false; error: E };

export const Result = {
  ok<T>(value: T): Result<T> {
    return { isOk: true, value };
  },

  error<T, E = Error>(error: E): Result<T, E> {
    return { isOk: false, error };
  },
};
