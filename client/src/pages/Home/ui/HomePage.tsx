import { useTheme } from "@/shared/hooks/useTheme";

export function HomePage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <button onClick={toggleTheme} className="theme">
        Сменить тему (Сейчас {theme})
      </button>
    </>
  );
}
