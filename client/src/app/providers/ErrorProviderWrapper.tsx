import { ErrorBoundary } from "@/lib/ErrorBoundary/ErrorBoundary";
import { ErrorProvider } from "@/lib/ErrorBoundary/ErrorProvider";
import { ThemeProvider } from "@/shared/store";
import { AuthProvider } from "@/shared/store";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export function ErrorProviderWrapper({ children }: Props) {
  return (
    <ErrorProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </ErrorProvider>
  );
}
