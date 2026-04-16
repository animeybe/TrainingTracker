import { useCallback } from "react";
import { useError } from "./useError";
import { logger } from "@/lib/utils/logger";

export function useApiError() {
  const { setError, clearError } = useError();

  const handleApiError = useCallback(
    (error: unknown, context = "unknown") => {
      logger.error("API Error", { error, context });

      if (error instanceof Response) {
        if (error.status >= 500) return setError("500");
        if (error.status === 404) return setError("404");
        if (error.status === 401) return setError("auth");
        if (error.status === 403) return setError("permission-denied");
        return setError("500");
      }

      if (
        error instanceof Error &&
        (error.message.includes("fetch") || error.message.includes("network"))
      ) {
        return setError("network");
      }

      setError("500");
    },
    [setError],
  );

  return { handleApiError, setError, clearError };
}
