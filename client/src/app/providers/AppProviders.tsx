import { ThemeProvider } from "@/shared/store";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HomePage } from "@/pages/Home";

export function AppProviders() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
