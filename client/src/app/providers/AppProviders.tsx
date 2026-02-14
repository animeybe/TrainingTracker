import { ThemeProvider } from "@/shared/store";
import { AuthProvider } from "@/shared/store";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "..";
import { ErrorBoundary } from "../ErrorBoundary/ErrorBoundary";

export function AppProviders() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
