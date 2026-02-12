import { ThemeProvider } from "@/shared/store";
import { AuthProvider } from "@/shared/store";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "..";

export function AppProviders() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
