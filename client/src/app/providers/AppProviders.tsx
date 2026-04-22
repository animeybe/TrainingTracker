import { ThemeProvider } from "@/shared/store";
import { AuthProvider } from "@/shared/store";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "..";
import { ErrorProviderWrapper } from "./ErrorProviderWrapper";
import { Toaster } from "react-hot-toast";

export function AppProviders() {
  return (
    <ErrorProviderWrapper>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
      <Toaster
      position='bottom-right'
      />
    </ErrorProviderWrapper>
  );
}
