import { useContext } from "react";
import { ErrorContext } from "@/lib/ErrorBoundary/ErrorProvider";
import type { ErrorContextType } from "@/lib/ErrorBoundary/ErrorProvider";

export function useError(): ErrorContextType {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error("useError must be used within ErrorProvider");
  }
  return context;
}
