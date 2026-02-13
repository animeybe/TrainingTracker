import { useTheme } from "@/shared/store";
import "./DashboardPage.scss";

export function DashboardPage() {
  const { theme, toggleTheme } = useTheme();
  return <>Профиль</>;
}
