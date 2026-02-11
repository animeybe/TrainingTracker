import { useContext } from "react";
import { ThemeContext } from "../store/theme/theme-context.ts";

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be inside ThemeProvider");
  return context;
};
