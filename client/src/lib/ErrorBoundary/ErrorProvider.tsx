import type { ErrorType } from "@/shared/ui/components/ErrorUI/model/types";
import { createContext, useCallback, useState, type ReactNode } from "react";
import { logger } from "../utils/logger";

interface ErrorContextType {
  setError: (errorType: ErrorType, message?: string) => void;
  clearError: () => void;
  currentError: { type: ErrorType; message: string } | null;
  hasError: boolean;
}

const ErrorContext = createContext<ErrorContextType | null>(null);

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [currentError, setCurrentError] =
    useState<ErrorContextType["currentError"]>(null);

  const setError = useCallback(
    (errorType: ErrorType, message = `Ошибка: ${errorType}`) => {
      logger.error("Global error set", { errorType, message });
      setCurrentError({ type: errorType, message });
    },
    [],
  );

  const clearError = useCallback(() => {
    logger.debug("Error cleared");
    setCurrentError(null);
  }, []);

  return (
    <ErrorContext.Provider
      value={{ setError, clearError, currentError, hasError: !!currentError }}>
      {children}
    </ErrorContext.Provider>
  );
}

export { ErrorContext, type ErrorContextType };
