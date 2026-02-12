import { useTheme } from "@/shared/hooks/useTheme";

export function HomePage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="content">
      <button onClick={toggleTheme} className="theme">
        Сменить тему (Сейчас {theme})
      </button>
    </div>
  );
}
