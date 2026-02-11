import { ThemeProvider } from "@/shared/store";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "..";

export function AppProviders() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
}
